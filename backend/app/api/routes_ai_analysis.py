"""Análisis IA inteligente — usa Claude (Anthropic) con búsqueda web.

A diferencia del análisis manual (donde tú pegas cuotas), este endpoint hace
TODO el trabajo de investigación por ti:

  1. Tú escribes solo el partido: "Real Madrid vs Barcelona"
  2. Claude busca en la web: form reciente, h2h, lesiones, alineaciones, contexto
  3. Razona cualitativamente sobre el partido
  4. Devuelve probabilidades para todos los mercados (1X2, BTTS, O/U, doble oport.)
  5. Si el usuario pegó cuotas, también calcula EV y picks recomendados

Costo: ~$0.05-0.10 por análisis con Claude Sonnet.
Requiere: `ANTHROPIC_API_KEY` en .env.
"""
from __future__ import annotations

import json
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.core.logging import logger
from backend.app.ml.kelly import stake_amount

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ---------- Schemas ----------
class AISearchOdds(BaseModel):
    home: Optional[float] = None
    draw: Optional[float] = None
    away: Optional[float] = None
    btts_yes: Optional[float] = None
    btts_no: Optional[float] = None
    over_25: Optional[float] = None
    under_25: Optional[float] = None


class AIAnalysisRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Ej: 'Real Madrid vs Barcelona' o 'Universitario'")
    odds: Optional[AISearchOdds] = None
    bankroll: Optional[float] = None
    bookmaker: str = "Apuesta Total"


class AIPick(BaseModel):
    market: str
    selection: str
    p_model: float
    odd: Optional[float] = None
    p_fair: Optional[float] = None
    expected_value: Optional[float] = None
    suggested_stake: Optional[float] = None
    reason: str


class AIAnalysisResponse(BaseModel):
    query: str
    matched_event: str
    league: str
    kickoff: str
    context_summary: str
    home_form: str
    away_form: str
    h2h_summary: str
    injuries: str
    key_factors: list[str]
    probabilities: dict[str, float]
    ai_recommendation: str
    confidence_level: str  # LOW / MEDIUM / HIGH
    rationale: str
    picks: list[AIPick]
    cost_estimate_usd: float
    sources: list[str]


# ---------- Sistema prompt ----------
SYSTEM_PROMPT = """Eres un analista experto de apuestas deportivas con 15 años de experiencia,
especialista en value betting y análisis cuantitativo de fútbol. Tu trabajo es analizar un
partido específico y devolver probabilidades calibradas para los principales mercados.

REGLAS CRÍTICAS:
0. **OBLIGATORIO: el partido a analizar tiene que ser de HOY (mismo día) o FUTURO**
   (kickoff posterior o igual a la fecha actual que te indiquen).
   - Si encuentras un partido programado para HOY: SÍRVELO (incluso si ya empezó, marca
     status="EN VIVO" en context_summary y reduce confidence_level a "LOW" porque las
     cuotas pre-match ya no son válidas en live).
   - Si solo encuentras partidos ya terminados: busca el SIGUIENTE programado entre esos
     dos equipos en los próximos 14 días.
   - Si el usuario pasa solo el nombre de un equipo: busca su PRÓXIMO partido (hoy o en
     los próximos 14 días).
   - NUNCA devuelvas un partido ya FINALIZADO (kickoff < hoy).
1. SIEMPRE usa búsqueda web para obtener datos REALES y RECIENTES (form últimos 5 partidos,
   h2h, lesiones confirmadas, alineaciones probables, contexto del partido).
2. Para Liga 1 Perú, La Liga, Premier, Champions, etc. — investiga las fuentes oficiales
   (Sofascore, FBref, ESPN, Marca, AS, Depor.com para Perú).
3. NO inventes números. Si no encuentras h2h, di "no disponible" en lugar de inventar.
4. Las probabilidades deben sumar correctamente: P(home)+P(draw)+P(away)=1.0,
   P(btts_yes)+P(btts_no)=1.0, P(over_25)+P(under_25)=1.0.
5. Sé honesto sobre incertidumbre — un confidence "LOW" es mejor que un dato inventado.
6. Las probabilidades calibradas suelen estar entre 0.20 y 0.65 para 1X2; nunca 95%+.
7. Considera factores cualitativos: motivación (descenso, copa, derbi), clima, viaje, árbitro.

DEVUELVE EXCLUSIVAMENTE un JSON válido con esta estructura — sin texto antes ni después:

{
  "matched_event": "Liverpool vs Arsenal",
  "league": "Premier League 2025-26",
  "kickoff": "2026-04-30T16:00:00",
  "context_summary": "Resumen 2-3 frases del estado de los dos equipos",
  "home_form": "WWLDW (3W-1D-1L últimos 5)",
  "away_form": "DWWLW",
  "h2h_summary": "Últimos 5 enfrentamientos: 2 ganados Liverpool, 2 ganados Arsenal, 1 empate",
  "injuries": "Liverpool: van Dijk lesionado. Arsenal: Saka duda.",
  "key_factors": [
    "Liverpool sin van Dijk pierde solidez defensiva",
    "Arsenal viene de eliminación europea, posible bajón motivacional",
    "Histórico: BTTS sí en 4 de últimos 5 enfrentamientos"
  ],
  "probabilities": {
    "home_win": 0.48,
    "draw": 0.27,
    "away_win": 0.25,
    "btts_yes": 0.62,
    "btts_no": 0.38,
    "over_25": 0.58,
    "under_25": 0.42,
    "double_chance_1x": 0.75,
    "double_chance_x2": 0.52,
    "double_chance_12": 0.73
  },
  "ai_recommendation": "BTTS Sí parece la mejor opción dado el histórico y las bajas defensivas",
  "confidence_level": "MEDIUM",
  "rationale": "Análisis textual de 4-6 frases explicando por qué llegaste a estas probabilidades",
  "sources": ["sofascore.com/...", "espn.com/...", "marca.com/..."]
}
"""


def _extract_json(text: str) -> dict:
    """Claude a veces envuelve el JSON en markdown ```json ... ``` — lo quitamos."""
    text = text.strip()
    # Intento 1: parse directo
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Intento 2: buscar bloque JSON
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Claude no devolvió JSON válido. Respuesta: {text[:500]}...")


def _devig_1x2(o_h: float, o_d: float, o_a: float):
    inv = [1.0 / o_h, 1.0 / o_d, 1.0 / o_a]
    s = sum(inv)
    return inv[0] / s, inv[1] / s, inv[2] / s


def _devig_binary(o_yes: float, o_no: float):
    inv_y, inv_n = 1.0 / o_yes, 1.0 / o_no
    s = inv_y + inv_n
    return inv_y / s, inv_n / s


def _build_picks_from_odds(probs: dict, odds: AISearchOdds, bankroll: float) -> list[AIPick]:
    """Si el usuario pegó cuotas, calculamos EV vs predicciones IA."""
    from backend.app.config import settings
    picks: list[AIPick] = []

    def consider(market, sel, p_m, odd, p_f):
        ev = p_m * (odd - 1) - (1 - p_m)
        edge = p_m - p_f
        is_value = (
            ev >= settings.min_expected_value
            and p_m >= settings.min_probability
            and edge > 0
            and 1.40 <= odd <= 8.0
        )
        stake = stake_amount(p_m, odd, bankroll) if is_value else 0.0
        reason = (
            f"✅ EV +{ev*100:.1f}%, edge +{edge*100:.1f}% — apostar"
            if is_value
            else f"❌ EV {ev*100:+.1f}%, edge {edge*100:+.1f}% — descartar"
        )
        picks.append(AIPick(
            market=market, selection=sel, p_model=round(p_m, 4),
            odd=odd, p_fair=round(p_f, 4),
            expected_value=round(ev, 4),
            suggested_stake=round(stake, 2),
            reason=reason,
        ))

    if odds.home and odds.draw and odds.away:
        p_fh, p_fd, p_fa = _devig_1x2(odds.home, odds.draw, odds.away)
        consider("1X2", "HOME", probs.get("home_win", 0), odds.home, p_fh)
        consider("1X2", "DRAW", probs.get("draw", 0), odds.draw, p_fd)
        consider("1X2", "AWAY", probs.get("away_win", 0), odds.away, p_fa)

    if odds.btts_yes and odds.btts_no:
        p_fy, p_fn = _devig_binary(odds.btts_yes, odds.btts_no)
        consider("BTTS", "YES", probs.get("btts_yes", 0), odds.btts_yes, p_fy)
        consider("BTTS", "NO", probs.get("btts_no", 0), odds.btts_no, p_fn)

    if odds.over_25 and odds.under_25:
        p_fy, p_fn = _devig_binary(odds.over_25, odds.under_25)
        consider("OU25", "OVER", probs.get("over_25", 0), odds.over_25, p_fy)
        consider("OU25", "UNDER", probs.get("under_25", 0), odds.under_25, p_fn)

    return picks


# ---------- Backends LLM ----------
def _today_iso() -> str:
    """Fecha actual en ISO (sin hora) para pasar al LLM como contexto."""
    from datetime import datetime
    return datetime.utcnow().strftime("%Y-%m-%d")


def _call_anthropic(query: str) -> tuple[dict, float]:
    """Llama a Claude con web search. Devuelve (data, cost_usd)."""
    from backend.app.config import settings
    from anthropic import Anthropic

    client = Anthropic(api_key=settings.anthropic_api_key)
    today = _today_iso()
    user_msg = (
        f"Fecha actual: **{today}**. Analiza un partido que sea de HOY o FUTURO (kickoff >= {today}).\n\n"
        f"Partido / equipo a analizar: **{query}**.\n\n"
        f"Si te dieron solo un nombre de equipo, busca su PRÓXIMO partido programado (hoy o en "
        f"los próximos 14 días). Investiga en la web la fecha exacta, formación probable, lesiones, "
        f"forma reciente, head-to-head, y devuelve el JSON estructurado. "
        f"NO devuelvas partidos ya finalizados. Si el partido es HOY y ya empezó, indícalo en "
        f"context_summary y baja confidence_level a LOW. Si no encuentras un dato, di 'no disponible'."
    )
    response = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 8}],
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = "".join(b.text for b in response.content if hasattr(b, "text"))
    data = _extract_json(raw)
    cost = (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) / 1_000_000
    return data, cost


def _call_omniroute(query: str) -> tuple[dict, float]:
    """Llama a OmniRoute / proxy OpenAI-compatible local o remoto."""
    from backend.app.config import settings
    from backend.app.services.web_search_service import build_live_match_context
    import httpx

    today = _today_iso()
    web_ctx = build_live_match_context(query)
    user_msg = (
        f"Fecha actual del sistema: **{today}**.\n\n"
        f"{web_ctx}\n\n"
        f"INSTRUCCIONES:\n"
        f"Analiza el partido o equipo: **{query}** usando los DATOS EN VIVO ENCONTRADOS EN LA WEB de arriba.\n"
        f"Si es un equipo, busca su PRÓXIMO partido real programado (fecha exacta y hora de kickoff en formato ISO 'YYYY-MM-DDTHH:MM:SS').\n"
        f"Devuelve EXCLUSIVAMENTE el JSON estructurado según el system prompt. NO devuelvas partidos ya finalizados."
    )
    url = f"{settings.omniroute_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.omniroute_api_key or 'sk-omniroute'}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.omniroute_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "temperature": 0.2,
    }
    with httpx.Client(timeout=60.0) as client:
        r = client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        res_json = r.json()

    raw = res_json["choices"][0]["message"]["content"]
    data = _extract_json(raw)
    usage = res_json.get("usage", {})
    in_tok = usage.get("prompt_tokens", 0)
    out_tok = usage.get("completion_tokens", 0)
    cost = (in_tok * 1.0 + out_tok * 2.0) / 1_000_000
    data.setdefault("_used_model", f"OmniRoute ({settings.omniroute_model})")
    return data, cost


def _list_gemini_models(api_key: str) -> list[str]:
    """Lista modelos disponibles para esta API key (con generateContent)."""
    import httpx
    try:
        r = httpx.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            params={"key": api_key},
            timeout=10.0,
        )
        r.raise_for_status()
        data = r.json()
        out = []
        for m in data.get("models", []):
            if "generateContent" in m.get("supportedGenerationMethods", []):
                # name viene como "models/gemini-xxx" → quitamos prefijo
                out.append(m["name"].replace("models/", ""))
        return out
    except Exception as e:
        logger.error(f"Error listando modelos Gemini: {e}")
        return []


def _pick_best_gemini_model(available: list[str]) -> str:
    """Elige el mejor modelo disponible por orden de preferencia.
    Prioriza modelos LITE primero porque son los que típicamente tienen free tier.
    """
    preferences = [
        "gemini-flash-lite-latest",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-lite-001",
        "gemini-2.5-flash-lite",
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-001",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
    ]
    for pref in preferences:
        if pref in available:
            return pref
    # Si ninguno preferido está, usa el primero "flash" que no sea preview/embed/vision
    for m in available:
        if ("flash" in m and "preview" not in m and "embed" not in m
                and "vision" not in m and "tts" not in m and "image" not in m):
            return m
    return available[0] if available else "gemini-1.5-flash"


_FALLBACK_CHAIN = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
]


def _try_gemini_model(model_name: str, prompt: str):
    """Intenta una llamada a Gemini con un modelo específico."""
    import google.generativeai as genai
    try:
        model = genai.GenerativeModel(model_name=model_name, system_instruction=SYSTEM_PROMPT)
        return model.generate_content(prompt), None
    except Exception as e:
        return None, e


def _call_gemini(query: str) -> tuple[dict, float]:
    """Llama a Gemini con fallback automático ante 429 o 404."""
    from backend.app.config import settings
    import google.generativeai as genai

    genai.configure(api_key=settings.google_api_key)

    available = _list_gemini_models(settings.google_api_key)
    available_set = set(available)

    candidates = []
    if settings.google_model in available_set:
        candidates.append(settings.google_model)
    for m in _FALLBACK_CHAIN:
        if m in available_set and m not in candidates:
            candidates.append(m)
    if not candidates:
        candidates.append(_pick_best_gemini_model(available))

    from backend.app.services.web_search_service import build_live_match_context
    today = _today_iso()
    web_ctx = build_live_match_context(query)
    prompt = (
        f"Fecha actual del sistema: **{today}**.\n\n"
        f"{web_ctx}\n\n"
        f"INSTRUCCIONES:\n"
        f"Analiza el partido o equipo: **{query}** usando estrictamente los datos de arriba.\n"
        f"REGLA OBLIGATORIA: Si arriba aparece un 'CALENDARIO OFICIAL EN VIVO (ESPN)', utiliza OBLIGATORIAMENTE ese partido real como matched_event, su liga y su kickoff oficial exacto.\n"
        f"Incluye: alineación probable, lesiones clave, forma reciente (últimos 5), head-to-head, contexto y probabilidades calibradas.\n"
        f"Devuelve EXCLUSIVAMENTE un JSON válido con la estructura del system prompt — sin markdown, sin texto antes ni después.\n"
        f"NO devuelvas partidos ya finalizados."
    )

    last_error = None
    used_model = None
    response = None

    for cand in candidates:
        r, err = _try_gemini_model(cand, prompt)
        if err is None:
            response = r
            used_model = cand
            logger.info(f"Gemini exitoso con modelo='{cand}'")
            break
        err_str = str(err)
        last_error = err_str
        logger.warning(f"Modelo '{cand}' falló: {err}. Probando siguiente.")

    if response is None:
        raise RuntimeError(
            f"Todos los modelos Gemini fallaron. Último error: {last_error}. "
            f"Probados: {candidates}"
        )

    raw = response.text
    data = _extract_json(raw)
    # Anota el modelo realmente usado en los datos para que el frontend lo muestre
    data.setdefault("_used_model", used_model)
    return data, 0.0


# ---------- Endpoint ----------
@router.post("/analyze", response_model=AIAnalysisResponse)
def ai_analyze(req: AIAnalysisRequest):
    """Análisis IA con búsqueda web. Usa Claude o Gemini según configuración."""
    from backend.app.config import settings

    # Decide qué proveedor usar
    has_anthropic = bool(settings.anthropic_api_key)
    has_google = bool(settings.google_api_key)
    has_omniroute = bool(settings.omniroute_api_key) or (settings.ai_provider.lower() in ("omniroute", "openai"))
    prov = settings.ai_provider.lower()
    if prov == "auto":
        prov = "omniroute" if has_omniroute else ("anthropic" if has_anthropic else ("gemini" if has_google else ""))
    if prov not in ("anthropic", "gemini", "omniroute", "openai"):
        raise HTTPException(
            400,
            "No hay IA configurada. Añade OMNIROUTE_API_KEY o GOOGLE_API_KEY en .env.",
        )
    if prov == "anthropic" and not has_anthropic:
        raise HTTPException(400, "ai_provider=anthropic pero falta ANTHROPIC_API_KEY")
    if prov == "gemini" and not has_google:
        raise HTTPException(400, "ai_provider=gemini pero falta GOOGLE_API_KEY")

    try:
        if prov in ("omniroute", "openai"):
            data, cost = _call_omniroute(req.query)
        elif prov == "anthropic":
            data, cost = _call_anthropic(req.query)
        else:
            data, cost = _call_gemini(req.query)
    except ImportError as e:
        raise HTTPException(
            500,
            f"Falta paquete Python: {e}. Corre `pip install -r requirements.txt`",
        )
    except ValueError as e:
        raise HTTPException(502, f"La IA no devolvió JSON válido: {e}")
    except Exception as e:
        logger.error(f"LLM error ({prov}): {e}")
        raise HTTPException(502, f"Error llamando al LLM ({prov}): {e}")

    logger.info(f"Análisis IA con {prov} → costo ${cost:.4f}")
    probs = data.get("probabilities", {})

    # Si trae cuotas, calculamos picks
    bankroll = req.bankroll or settings.initial_bankroll
    picks: list[AIPick] = []
    if req.odds:
        picks = _build_picks_from_odds(probs, req.odds, bankroll)

    return AIAnalysisResponse(
        query=req.query,
        matched_event=data.get("matched_event", req.query),
        league=data.get("league", "no disponible"),
        kickoff=data.get("kickoff", "no disponible"),
        context_summary=data.get("context_summary", ""),
        home_form=data.get("home_form", "no disponible"),
        away_form=data.get("away_form", "no disponible"),
        h2h_summary=data.get("h2h_summary", "no disponible"),
        injuries=data.get("injuries", "no disponible"),
        key_factors=data.get("key_factors", []),
        probabilities=probs,
        ai_recommendation=data.get("ai_recommendation", ""),
        confidence_level=data.get("confidence_level", "MEDIUM"),
        rationale=data.get("rationale", ""),
        picks=picks,
        cost_estimate_usd=round(cost, 4),
        sources=data.get("sources", []),
    )


# ---------- Autocomplete ----------
_suggest_cache: dict[str, tuple[float, list]] = {}


@router.get("/suggest")
def ai_suggest(q: str):
    """Autocomplete: dado un nombre de equipo (o parte), devuelve los próximos
    partidos donde juegue, en formato listo para mostrar como dropdown.

    Cache TTL=10min para no martillar la API gratis con cada tecla.
    """
    import time
    from backend.app.config import settings

    q = q.strip()
    if len(q) < 3:
        return {"count": 0, "suggestions": []}

    # Cache hit
    cached = _suggest_cache.get(q.lower())
    if cached and (time.time() - cached[0] < 600):
        return {"count": len(cached[1]), "suggestions": cached[1], "cached": True}

    if not settings.google_api_key and not settings.anthropic_api_key:
        raise HTTPException(400, "Sin LLM configurado — añade GOOGLE_API_KEY en .env")

    today = _today_iso()
    prompt = (
        f"Fecha actual: {today}. Lista los próximos 3 partidos de fútbol que sean HOY o "
        f"en los siguientes 14 días, donde juegue el equipo o coincidan con: '{q}'.\n\n"
        f"INCLUYE partidos de HOY (incluso si ya empezaron, pon status='EN VIVO' o 'HOY').\n"
        f"INCLUYE partidos futuros (kickoff >= {today}).\n"
        f"NO incluyas partidos ya finalizados (kickoff < {today}).\n"
        f"Si no encuentras ninguno, devuelve [].\n\n"
        f"Responde EXCLUSIVAMENTE con un JSON array, sin texto antes ni después, formato:\n"
        f'[{{"home":"Equipo A","away":"Equipo B","kickoff":"2026-04-30T20:00:00",'
        f'"league":"Liga 1 Perú","status":"EN VIVO|HOY|PROGRAMADO"}}, ...]\n\n'
        f"Si no encuentras partidos: []"
    )

    try:
        if settings.google_api_key:
            import google.generativeai as genai
            genai.configure(api_key=settings.google_api_key)
            available = _list_gemini_models(settings.google_api_key)
            model_name = settings.google_model
            if model_name not in available:
                model_name = _pick_best_gemini_model(available)
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    tools=[{"google_search": {}}],
                )
                resp = model.generate_content(prompt)
            except Exception:
                model = genai.GenerativeModel(model_name=model_name)
                resp = model.generate_content(prompt)
            raw = resp.text
        else:
            from anthropic import Anthropic
            client = Anthropic(api_key=settings.anthropic_api_key)
            r = client.messages.create(
                model=settings.anthropic_model,
                max_tokens=1024,
                tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 4}],
                messages=[{"role": "user", "content": prompt}],
            )
            raw = "".join(b.text for b in r.content if hasattr(b, "text"))

        # Parsear JSON array
        import json, re
        m = re.search(r"\[[\s\S]*\]", raw)
        if not m:
            return {"count": 0, "suggestions": [], "raw": raw[:200]}
        suggestions = json.loads(m.group(0))
        if not isinstance(suggestions, list):
            suggestions = []
    except Exception as e:
        logger.warning(f"Suggest error: {e}")
        return {"count": 0, "suggestions": [], "error": str(e)}

    # Filtrar futuros (defensa adicional)
    from datetime import datetime
    now_str = today
    filtered = []
    for s in suggestions:
        if not isinstance(s, dict):
            continue
        ko = s.get("kickoff", "")
        if ko and ko[:10] >= now_str:
            filtered.append(s)
    if not filtered and suggestions:
        # Si todos vinieron como pasados, igual devolvemos algunos por si acaso
        filtered = suggestions[:3]

    _suggest_cache[q.lower()] = (time.time(), filtered)
    return {"count": len(filtered), "suggestions": filtered, "cached": False}


_featured_cache: dict[str, tuple[float, dict]] = {}


@router.get("/featured")
def featured_matches(league: str = "all"):
    """Lista partidos importantes de HOY + próximos 7 días, estilo casa de apuestas.

    Agrupados por liga. Cache 30 minutos para no martillar la API.
    `league` puede ser: all | liga1peru | premier | laliga | seriea | bundesliga | ligue1 |
                         champions | sudamericana | mls
    """
    import time
    from backend.app.config import settings

    cache_key = league.lower()
    cached = _featured_cache.get(cache_key)
    # Cache 2 horas — para no quemar la cuota gratis si hace clicks seguidos
    if cached and (time.time() - cached[0] < 7200):
        return {**cached[1], "cached": True}

    if not settings.google_api_key and not settings.anthropic_api_key:
        raise HTTPException(400, "Sin LLM configurado — añade GOOGLE_API_KEY en .env")

    today = _today_iso()
    league_filter = ""
    if league == "all":
        league_filter = (
            "Liga 1 Perú, Premier League (Inglaterra), La Liga (España), Serie A (Italia), "
            "Bundesliga (Alemania), Ligue 1 (Francia), Champions League, Europa League, "
            "Copa Sudamericana, Copa Libertadores, MLS"
        )
    else:
        league_map = {
            "liga1peru": "Liga 1 Perú",
            "premier": "Premier League (Inglaterra)",
            "laliga": "La Liga (España)",
            "seriea": "Serie A (Italia)",
            "bundesliga": "Bundesliga (Alemania)",
            "ligue1": "Ligue 1 (Francia)",
            "champions": "Champions League",
            "sudamericana": "Copa Sudamericana / Libertadores",
            "mls": "MLS (Estados Unidos)",
        }
        league_filter = league_map.get(league, league)

    prompt = (
        f"Fecha actual: {today}. Lista los 15-20 partidos de fútbol más importantes que se "
        f"jueguen entre HOY ({today}) y los próximos 7 días, en estas ligas: {league_filter}.\n\n"
        f"REGLAS:\n"
        f"- INCLUYE partidos de HOY (incluso si ya empezaron, status='EN VIVO').\n"
        f"- INCLUYE partidos futuros (kickoff >= {today}).\n"
        f"- NO incluyas partidos terminados.\n"
        f"- Prioriza derbis, partidos top y los de más interés.\n\n"
        f"Responde EXCLUSIVAMENTE con JSON, sin markdown, formato:\n"
        f'{{"matches": ['
        f'{{"home":"Equipo A","away":"Equipo B","kickoff":"2026-04-30T20:00:00",'
        f'"league":"Liga 1 Perú","status":"EN VIVO|HOY|PROGRAMADO"}}, ...'
        f"]}}"
    )

    try:
        if settings.google_api_key:
            import google.generativeai as genai
            genai.configure(api_key=settings.google_api_key)
            available = _list_gemini_models(settings.google_api_key)
            model_name = settings.google_model
            if model_name not in available:
                model_name = _pick_best_gemini_model(available)
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    tools=[{"google_search": {}}],
                )
                resp = model.generate_content(prompt)
            except Exception:
                model = genai.GenerativeModel(model_name=model_name)
                resp = model.generate_content(prompt)
            raw = resp.text
        else:
            from anthropic import Anthropic
            client = Anthropic(api_key=settings.anthropic_api_key)
            r = client.messages.create(
                model=settings.anthropic_model,
                max_tokens=2048,
                tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 6}],
                messages=[{"role": "user", "content": prompt}],
            )
            raw = "".join(b.text for b in r.content if hasattr(b, "text"))

        data = _extract_json(raw)
        matches = data.get("matches", []) if isinstance(data, dict) else []
    except Exception as e:
        logger.error(f"featured error: {e}")
        raise HTTPException(502, f"No se pudo obtener partidos destacados: {e}")

    # Filtrar futuros + agrupar por liga
    from datetime import datetime
    today_str = today
    by_league: dict[str, list] = {}
    for m in matches:
        if not isinstance(m, dict):
            continue
        ko = m.get("kickoff", "")
        if ko and ko[:10] < today_str:
            continue  # descartar pasados
        lg = m.get("league", "Sin liga")
        by_league.setdefault(lg, []).append(m)
    # Ordenar partidos dentro de cada liga por kickoff
    for lg in by_league:
        by_league[lg].sort(key=lambda x: x.get("kickoff", ""))

    out = {
        "league": league,
        "total": sum(len(v) for v in by_league.values()),
        "leagues": [
            {"name": lg, "matches": ms} for lg, ms in by_league.items()
        ],
        "fetched_at": today,
    }
    _featured_cache[cache_key] = (time.time(), out)
    return out


@router.get("/list_gemini_models")
def list_gemini_models():
    """Lista los modelos Gemini disponibles para tu API key.
    Útil cuando un modelo da 404 — para saber cuál sí tienes.
    """
    from backend.app.config import settings
    if not settings.google_api_key:
        raise HTTPException(400, "Falta GOOGLE_API_KEY")
    available = _list_gemini_models(settings.google_api_key)
    if not available:
        raise HTTPException(502, "No se pudo listar modelos. ¿API key inválida?")
    best = _pick_best_gemini_model(available)
    return {
        "count": len(available),
        "available": available,
        "currently_configured": settings.google_model,
        "recommended": best,
    }


@router.get("/status")
def ai_status():
    """Verifica si la IA está configurada y qué provider está activo."""
    from backend.app.config import settings
    has_anthropic = bool(settings.anthropic_api_key)
    has_google = bool(settings.google_api_key)
    has_omniroute = bool(settings.omniroute_api_key) or (settings.ai_provider.lower() in ("omniroute", "openai"))
    prov = settings.ai_provider.lower()
    if prov == "auto":
        prov = "omniroute" if has_omniroute else ("anthropic" if has_anthropic else ("gemini" if has_google else "none"))

    if prov in ("omniroute", "openai"):
        model_name = settings.omniroute_model
        cost_desc = "Vía OmniRoute (según proveedor configurado)"
    elif prov == "anthropic":
        model_name = settings.anthropic_model
        cost_desc = "~$0.05-0.10 (Claude API)"
    else:
        model_name = settings.google_model
        cost_desc = "GRATIS (Gemini free tier)"

    return {
        "configured": prov in ("anthropic", "gemini", "omniroute", "openai"),
        "provider": prov,
        "model": model_name,
        "cost_per_analysis": cost_desc,
        "available_providers": {
            "omniroute": has_omniroute,
            "anthropic": has_anthropic,
            "gemini": has_google,
        },
    }
