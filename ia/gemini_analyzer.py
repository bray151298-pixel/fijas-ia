"""
Cerebro IA del proyecto: Google Gemini 1.5 Flash.

Recibe un dossier completo del partido (Poisson + forma + estadisticas
+ contexto de liga) y devuelve un analisis estructurado en JSON con:
  - marcador exacto mas probable
  - probabilidades 1X2
  - recomendaciones de apuesta
  - oportunidades de valor (si hay cuotas)
  - razonamiento tactico

El prompt esta diseado para que Gemini RAZONE sobre la distribucion de
Poisson y la forma reciente, no solo regurgite los numeros.
"""
from __future__ import annotations

import json
from typing import Any

import google.generativeai as genai
import streamlit as st

MODELO = "gemini-3.6-flash"

GENERATION_CONFIG = {
    "temperature": 0.4,           # algo creativo pero coherente
    "top_p": 0.9,
    "max_output_tokens": 2048,
    "response_mime_type": "application/json",
}

SYSTEM_PROMPT = """Eres un analista experto en futbol y apuestas deportivas con 15
anos de experiencia. Combinas dos enfoques:

  1. METODO CUANTITATIVO: Distribucion de Poisson sobre goles esperados (xG).
     Confias en los numeros pero entiendes sus limitaciones.

  2. ESTADO DE FORMA RECIENTE: Los ultimos 5 partidos pesan mas que la
     temporada completa. Una racha caliente o una crisis cambian todo.

REGLAS DE ANALISIS:

- Considera SIEMPRE el contexto de la liga: una liga de pocos goles
  (Ligue 1, Segunda Espana, Serie B Italia) cambia las lineas Over/Under
  respecto a una liga "loca" (Eredivisie, Bundesliga 2, ligas menores
  de Asia/Sudamerica donde se ven 4+ goles por partido).
- Da MAS peso al rendimiento local del local y al visitante del visitante.
- Marcadores comunes en futbol: 1-0, 2-1, 1-1, 2-0, 0-0, 2-2.
  Marcadores raros (4-3, 5-2) son menos probables salvo evidencia fuerte.
- Si las cuotas del bookie estan disponibles, identifica VALOR:
  apuesta tu probabilidad estimada contra la implicita de la cuota.
- Si los datos son insuficientes o contradictorios, BAJA tu confianza.
  Es mejor decir "no hay valor claro" que inventar una recomendacion.

FORMATO DE SALIDA (JSON estricto):
{
  "marcador_exacto": {"local": int, "visitante": int, "confianza_pct": float},
  "probabilidades_1x2": {"local_pct": float, "empate_pct": float, "visitante_pct": float},
  "total_goles_estimado": float,
  "recomendaciones": [
    {
      "mercado": "string (ej. 'Mas de 2.5 goles', 'Ambos anotan SI', 'Doble oportunidad 1X')",
      "confianza_pct": float,
      "justificacion": "string (1-2 frases concretas)"
    }
  ],
  "oportunidades_valor": [
    {
      "mercado": "string",
      "cuota_bookie": float,
      "prob_modelo_pct": float,
      "edge_pct": float,
      "comentario": "string"
    }
  ],
  "razonamiento_tactico": "string (3-5 frases sobre que decide el partido)",
  "nivel_confianza_global": "ALTO | MEDIO | BAJO",
  "advertencia": "string (si hay datos limitados o factores de riesgo)"
}

Las probabilidades 1X2 deben sumar 100. Los porcentajes son numeros (no strings).
"""


def _configurar_gemini() -> genai.GenerativeModel:
    """Inicializa el cliente con la clave de Streamlit secrets o fallback."""
    api_key = ""
    try:
        api_key = st.secrets.get("GEMINI_API_KEY", "") or st.secrets.get("GOOGLE_API_KEY", "")
    except Exception:
        pass

    if not api_key:
        api_key = "AIzaSyCSSSoFRgd6_eQA0_d6Um07Iz9nI4eHHdo"

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name=MODELO,
        generation_config=GENERATION_CONFIG,
        system_instruction=SYSTEM_PROMPT,
    )



def _construir_prompt_partido(dossier: dict[str, Any]) -> str:
    """
    Convierte el dossier (dict con todos los datos) en un prompt
    de usuario para Gemini.
    """
    local = dossier["local"]
    visit = dossier["visitante"]
    poisson_data = dossier["poisson"]
    cuotas = dossier.get("cuotas")
    liga = dossier["liga"]

    # Bloque de cuotas (opcional)
    bloque_cuotas = "No disponibles."
    if cuotas:
        bloque_cuotas = (
            f"Local {cuotas.get('local', 'N/A')} | "
            f"Empate {cuotas.get('empate', 'N/A')} | "
            f"Visitante {cuotas.get('visitante', 'N/A')}"
        )

    # Top marcadores Poisson
    top_marc = "\n".join(
        f"  - {l}-{v}: {p*100:.1f}%" for l, v, p in poisson_data["top_marcadores"][:5]
    )

    prompt = f"""ANALIZA ESTE PARTIDO Y DEVUELVE EL JSON SEGUN EL FORMATO INDICADO.

==================================================
LIGA: {liga['nombre']} ({liga['pais']})  -  Temporada {liga['temporada']}
PROMEDIO GOLES POR PARTIDO EN LA LIGA: ~{liga.get('promedio_goles', 'N/D')}
==================================================

EQUIPO LOCAL: {local['nombre']}
  Posicion en tabla: {local.get('posicion', 'N/D')}
  Forma reciente (ultimos 5): {local.get('forma', 'N/D')}
  Promedio goles a favor (general): {local['stats']['goles_favor_total']:.2f}
  Promedio goles en contra (general): {local['stats']['goles_contra_total']:.2f}
  RENDIMIENTO COMO LOCAL:
    - Goles a favor en casa: {local['stats']['goles_favor_local']:.2f}
    - Goles en contra en casa: {local['stats']['goles_contra_local']:.2f}
  Ultimos 5 partidos (goles favor-contra):
{local.get('ultimos_partidos_resumen', '  N/D')}

EQUIPO VISITANTE: {visit['nombre']}
  Posicion en tabla: {visit.get('posicion', 'N/D')}
  Forma reciente (ultimos 5): {visit.get('forma', 'N/D')}
  Promedio goles a favor (general): {visit['stats']['goles_favor_total']:.2f}
  Promedio goles en contra (general): {visit['stats']['goles_contra_total']:.2f}
  RENDIMIENTO COMO VISITANTE:
    - Goles a favor fuera: {visit['stats']['goles_favor_visitante']:.2f}
    - Goles en contra fuera: {visit['stats']['goles_contra_visitante']:.2f}
  Ultimos 5 partidos (goles favor-contra):
{visit.get('ultimos_partidos_resumen', '  N/D')}

==================================================
ANALISIS POISSON (calculado por nuestro motor matematico):
  Goles esperados (xG) Local:    {poisson_data['xg']['local']:.2f}
  Goles esperados (xG) Visitante: {poisson_data['xg']['visitante']:.2f}

  Probabilidades 1X2 (modelo Poisson puro):
    Local: {poisson_data['probabilidades_1x2']['local']*100:.1f}%
    Empate: {poisson_data['probabilidades_1x2']['empate']*100:.1f}%
    Visitante: {poisson_data['probabilidades_1x2']['visitante']*100:.1f}%

  Top 5 marcadores Poisson:
{top_marc}

  Mas de 2.5 goles: {poisson_data['over_under']['2.5']['over']*100:.1f}%
  Mas de 1.5 goles: {poisson_data['over_under']['1.5']['over']*100:.1f}%
  Ambos anotan SI: {poisson_data['btts']['si']*100:.1f}%

CUOTAS DEL BOOKMAKER (1X2): {bloque_cuotas}
==================================================

INSTRUCCION:
1. Toma el output de Poisson como BASE matematica.
2. AJUSTALO segun la forma reciente (rachas, lesiones implicitas en goles).
3. AJUSTALO segun el contexto de la liga (liga goleadora vs cerrada).
4. Da el marcador exacto, las probabilidades 1X2 y 1-3 recomendaciones de apuesta.
5. Si hay cuotas, identifica oportunidades de VALOR (edge > 5%).
6. Devuelve SOLO el JSON, sin texto adicional.
"""
    return prompt


def _analizar_con_omniroute(prompt: str) -> dict[str, Any]:
    """Llama a OmniRoute / OpenAI compatible endpoint."""
    import requests
    base_url = st.secrets.get("OMNIROUTE_BASE_URL", "http://localhost:20128/v1").rstrip("/")
    api_key = st.secrets.get("OMNIROUTE_API_KEY", "sk-omniroute")
    model = st.secrets.get("OMNIROUTE_MODEL", "deepseek-chat")

    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    raw = data["choices"][0]["message"]["content"].strip()
    # Limpiar markdown si viene envuelto
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return json.loads(raw.strip())


def analizar_partido(dossier: dict[str, Any]) -> dict[str, Any]:
    """
    Funcion principal: recibe el dossier completo y devuelve el JSON
    parseado con el analisis de Gemini u OmniRoute.
    """
    texto = ""
    try:
        prompt = _construir_prompt_partido(dossier)
        # Si esta configurado OmniRoute en secrets, usarlo prioritariamente
        if "OMNIROUTE_API_KEY" in st.secrets or "OMNIROUTE_BASE_URL" in st.secrets:
            return _analizar_con_omniroute(prompt)

        modelo = _configurar_gemini()
        respuesta = modelo.generate_content(prompt)
        texto = respuesta.text.strip()
        return json.loads(texto)
    except json.JSONDecodeError as exc:
        return {
            "error": "El modelo devolvio un JSON invalido.",
            "detalle": str(exc),
            "texto_crudo": texto,
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "error": "Fallo la llamada a la IA.",
            "detalle": str(exc),
        }
