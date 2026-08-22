"""Análisis manual de un partido: tú pasas equipos + cuotas, devuelve veredicto.

Útil cuando:
  - Quieres analizar un partido de una liga que el sistema no auto-escanea (ej. Liga 1 Perú).
  - Tienes cuotas de tu casa preferida (Apuesta Total, etc.) y quieres saber si hay value.
  - Tu casa cotiza un mercado que el motor automático no recogió.

Si los equipos no están en el dataset histórico, el sistema usa valores por defecto
(ELO=1500, form=neutra) y avisa en el campo `warnings`. La predicción será menos
precisa pero todavía da una referencia sobre la cuota.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.core.database import get_session
from backend.app.core.logging import logger
from backend.app.ml.kelly import kelly_fraction, stake_amount
from backend.app.ml.predict import Predictor
from backend.app.ml.value_detector import assess
from backend.app.models import Bet, BetStatus, Match, MatchStatus
from backend.app.services.feature_engineering import (
    _build_team_indices, _features_using_index, compute_elo_history,
)

router = APIRouter(prefix="/api/manual", tags=["manual"])

_predictor: Predictor | None = None
_team_idx_cache = None
_h2h_idx_cache = None
_known_teams: set[str] = set()


def _get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        _predictor = Predictor()
        _predictor.load()
    return _predictor


def _get_indices(session: Session):
    """Construye índice histórico una vez por proceso."""
    global _team_idx_cache, _h2h_idx_cache, _known_teams
    if _team_idx_cache is not None:
        return _team_idx_cache, _h2h_idx_cache

    matches = session.query(Match).filter(Match.status == MatchStatus.FINISHED).all()
    if not matches:
        raise HTTPException(409, "No hay datos históricos. Corre `python -m scripts.seed_data` primero.")

    history = pd.DataFrame([{
        "fixture_id": m.fixture_id, "league": m.league, "season": m.season,
        "kickoff": m.kickoff, "home_team": m.home_team, "away_team": m.away_team,
        "home_goals": m.home_goals, "away_goals": m.away_goals,
        "home_xg": m.home_xg, "away_xg": m.away_xg,
    } for m in matches])

    df_with_elo = compute_elo_history(history)
    _team_idx_cache, _h2h_idx_cache = _build_team_indices(df_with_elo)
    _known_teams = set(history["home_team"].unique()) | set(history["away_team"].unique())
    logger.info(f"Índice manual construido: {len(_known_teams)} equipos en histórico")
    return _team_idx_cache, _h2h_idx_cache


# ---------- Schemas ----------
class OddsInput(BaseModel):
    """Cuotas que pasa el usuario. Todos opcionales — el sistema solo evalúa los mercados con cuota.

    Tip: copia las cuotas como aparecen en tu casa. Por ejemplo en Apuesta Total:
      home=2.10, draw=3.40, away=3.20  (1X2)
      btts_yes=1.85, btts_no=1.85      (Ambos marcan)
      over_25=1.92, under_25=1.78      (Total goles 2.5)
    """
    home: Optional[float] = Field(None, gt=1.01, description="Cuota local")
    draw: Optional[float] = Field(None, gt=1.01, description="Cuota empate")
    away: Optional[float] = Field(None, gt=1.01, description="Cuota visitante")
    btts_yes: Optional[float] = Field(None, gt=1.01)
    btts_no: Optional[float] = Field(None, gt=1.01)
    over_25: Optional[float] = Field(None, gt=1.01)
    under_25: Optional[float] = Field(None, gt=1.01)


class ManualAnalysisRequest(BaseModel):
    home_team: str = Field(..., min_length=2)
    away_team: str = Field(..., min_length=2)
    kickoff: Optional[datetime] = None
    league: Optional[str] = None
    bookmaker: str = "Apuesta Total"
    odds: OddsInput
    bankroll: Optional[float] = None  # Si no, usa settings.initial_bankroll


class MarketAssessment(BaseModel):
    market: str
    selection: str
    odd: float
    p_model: float
    p_fair: float
    edge: float
    expected_value: float
    is_value: bool
    suggested_stake: float
    rationale: str


class ParlayLeg(BaseModel):
    home_team: str
    away_team: str
    kickoff: Optional[datetime] = None
    market: str = Field(..., description="1X2 | BTTS | OU25 | DC")
    selection: str = Field(..., description="HOME/DRAW/AWAY/YES/NO/OVER/UNDER/1X/X2/12")
    odd: float = Field(..., gt=1.01)


class ParlayRequest(BaseModel):
    legs: list[ParlayLeg] = Field(..., min_length=2, max_length=8)
    bookmaker: str = "Apuesta Total"
    bankroll: Optional[float] = None


class ParlayLegDetail(BaseModel):
    home_team: str
    away_team: str
    market: str
    selection: str
    odd: float
    p_model: float


class ParlayResponse(BaseModel):
    n_legs: int
    bankroll: float
    legs: list[ParlayLegDetail]
    combined_odd: float
    combined_p_model: float
    implied_p: float          # 1/combined_odd (sin devigging)
    edge: float                # combined_p_model - implied_p
    expected_value: float
    is_value: bool
    warnings: list[str]
    suggested_stake: float
    rationale: str


class ManualAnalysisResponse(BaseModel):
    home_team: str
    away_team: str
    kickoff: datetime
    bookmaker: str
    bankroll: float
    teams_known: dict[str, bool]
    warnings: list[str]
    predictions: dict[str, float]
    assessments: list[MarketAssessment]
    value_picks: list[MarketAssessment]
    summary: str


# ---------- Helpers ----------
def _devig_1x2(o_h: float, o_d: float, o_a: float) -> tuple[float, float, float]:
    inv = [1.0 / o_h, 1.0 / o_d, 1.0 / o_a]
    s = sum(inv)
    return inv[0] / s, inv[1] / s, inv[2] / s


def _devig_binary(o_yes: float, o_no: float) -> tuple[float, float]:
    inv_y, inv_n = 1.0 / o_yes, 1.0 / o_no
    s = inv_y + inv_n
    return inv_y / s, inv_n / s


def _get_p_for_selection(pred, market: str, selection: str) -> float | None:
    """Mapea (mercado, selección) → probabilidad del modelo."""
    mkt = market.upper()
    sel = selection.upper()
    if mkt == "1X2":
        return {"HOME": pred.p_home, "DRAW": pred.p_draw, "AWAY": pred.p_away}.get(sel)
    if mkt == "BTTS":
        return {"YES": pred.p_btts_yes, "NO": pred.p_btts_no}.get(sel)
    if mkt in ("OU25", "OU", "OVERUNDER"):
        return {"OVER": pred.p_over_25, "UNDER": pred.p_under_25}.get(sel)
    if mkt in ("DC", "DOUBLECHANCE", "DOBLE"):
        # Doble oportunidad — derivada de 1X2
        return {
            "1X": pred.p_home + pred.p_draw,
            "X2": pred.p_draw + pred.p_away,
            "12": pred.p_home + pred.p_away,
        }.get(sel)
    return None


# ---------- Endpoint ----------
@router.post("/analyze", response_model=ManualAnalysisResponse)
def analyze(req: ManualAnalysisRequest, session: Session = Depends(get_session)):
    from backend.app.config import settings

    team_idx, h2h_idx = _get_indices(session)
    home_known = req.home_team in _known_teams
    away_known = req.away_team in _known_teams
    warnings: list[str] = []
    if not home_known:
        warnings.append(f"'{req.home_team}' no está en el histórico — predicción usa defaults para ese equipo")
    if not away_known:
        warnings.append(f"'{req.away_team}' no está en el histórico — predicción usa defaults para ese equipo")

    kickoff = req.kickoff or datetime.utcnow()
    feats = _features_using_index(team_idx, h2h_idx, req.home_team, req.away_team, kickoff)
    pred = _get_predictor().predict(feats)

    bankroll = req.bankroll or settings.initial_bankroll
    assessments: list[MarketAssessment] = []

    # ---- 1X2 ----
    o = req.odds
    if o.home and o.draw and o.away:
        p_fh, p_fd, p_fa = _devig_1x2(o.home, o.draw, o.away)
        # ---- Doble oportunidad (derivada del mismo mercado 1X2) ----
        # Estimamos cuotas teóricas para 1X, X2, 12 a partir de las probabilidades fair
        # NOTA: si tu casa cotiza estos mercados directamente, ingrésalos en el modo manual
        # con esos valores; este bloque genera una estimación basada en 1X2.
        for sel, p_m_dc, p_f_dc in [
            ("1X", pred.p_home + pred.p_draw, p_fh + p_fd),
            ("X2", pred.p_draw + pred.p_away, p_fd + p_fa),
            ("12", pred.p_home + pred.p_away, p_fh + p_fa),
        ]:
            # cuota implícita teórica (sin margen extra del bookie)
            odd_dc = 1.0 / p_f_dc if p_f_dc > 0 else 99.0
            a_dc = assess(p_m_dc, odd_dc, p_f_dc)
            stake_dc = stake_amount(p_m_dc, odd_dc, bankroll) if a_dc.is_value else 0.0
            assessments.append(MarketAssessment(
                market="DC", selection=sel, odd=round(odd_dc, 2),
                p_model=p_m_dc, p_fair=p_f_dc, edge=a_dc.edge,
                expected_value=a_dc.expected_value, is_value=a_dc.is_value,
                suggested_stake=round(stake_dc, 2),
                rationale=f"(estimación) {a_dc.rationale}",
            ))
        for sel, p_m, odd, p_f in [
            ("HOME", pred.p_home, o.home, p_fh),
            ("DRAW", pred.p_draw, o.draw, p_fd),
            ("AWAY", pred.p_away, o.away, p_fa),
        ]:
            a = assess(p_m, odd, p_f)
            stake = stake_amount(p_m, odd, bankroll) if a.is_value else 0.0
            assessments.append(MarketAssessment(
                market="1X2", selection=sel, odd=odd,
                p_model=p_m, p_fair=p_f, edge=a.edge,
                expected_value=a.expected_value, is_value=a.is_value,
                suggested_stake=round(stake, 2), rationale=a.rationale,
            ))

    # ---- BTTS ----
    if o.btts_yes and o.btts_no:
        p_fy, p_fn = _devig_binary(o.btts_yes, o.btts_no)
        for sel, p_m, odd, p_f in [
            ("YES", pred.p_btts_yes, o.btts_yes, p_fy),
            ("NO", pred.p_btts_no, o.btts_no, p_fn),
        ]:
            a = assess(p_m, odd, p_f)
            stake = stake_amount(p_m, odd, bankroll) if a.is_value else 0.0
            assessments.append(MarketAssessment(
                market="BTTS", selection=sel, odd=odd,
                p_model=p_m, p_fair=p_f, edge=a.edge,
                expected_value=a.expected_value, is_value=a.is_value,
                suggested_stake=round(stake, 2), rationale=a.rationale,
            ))

    # ---- Over/Under 2.5 ----
    if o.over_25 and o.under_25:
        p_fy, p_fn = _devig_binary(o.over_25, o.under_25)
        for sel, p_m, odd, p_f in [
            ("OVER",  pred.p_over_25,  o.over_25,  p_fy),
            ("UNDER", pred.p_under_25, o.under_25, p_fn),
        ]:
            a = assess(p_m, odd, p_f)
            stake = stake_amount(p_m, odd, bankroll) if a.is_value else 0.0
            assessments.append(MarketAssessment(
                market="OU25", selection=sel, odd=odd,
                p_model=p_m, p_fair=p_f, edge=a.edge,
                expected_value=a.expected_value, is_value=a.is_value,
                suggested_stake=round(stake, 2), rationale=a.rationale,
            ))

    if not assessments:
        raise HTTPException(400, "Tienes que pasar al menos un mercado completo (ej. home/draw/away o btts_yes/btts_no o over_25/under_25)")

    value_picks = [a for a in assessments if a.is_value]
    value_picks.sort(key=lambda x: x.expected_value, reverse=True)

    # Resumen humano
    if value_picks:
        top = value_picks[0]
        summary = (f"✅ {len(value_picks)} value bet(s). Top pick: "
                   f"{top.market} {top.selection} @ {top.odd:.2f} → "
                   f"EV +{top.expected_value*100:.1f}%, stake €{top.suggested_stake:.2f}")
    else:
        summary = "❌ Sin value bets en este partido — todas las cuotas tienen edge insuficiente."

    return ManualAnalysisResponse(
        home_team=req.home_team,
        away_team=req.away_team,
        kickoff=kickoff,
        bookmaker=req.bookmaker,
        bankroll=bankroll,
        teams_known={req.home_team: home_known, req.away_team: away_known},
        warnings=warnings,
        predictions={
            "p_home": round(pred.p_home, 4),
            "p_draw": round(pred.p_draw, 4),
            "p_away": round(pred.p_away, 4),
            "p_btts_yes": round(pred.p_btts_yes, 4),
            "p_btts_no": round(pred.p_btts_no, 4),
            "p_over_25": round(pred.p_over_25, 4),
            "p_under_25": round(pred.p_under_25, 4),
        },
        assessments=assessments,
        value_picks=value_picks,
        summary=summary,
    )


@router.post("/parlay", response_model=ParlayResponse)
def parlay(req: ParlayRequest, session: Session = Depends(get_session)):
    """Calcula valor de una combinada (parlay).

    Multiplica cuotas y probabilidades. Asume independencia entre piernas (válido
    para partidos distintos; INVÁLIDO para 2 piernas del mismo partido — el
    sistema avisa si lo detecta).

    Stake sugerido: usa Kelly fraccional con un descuento adicional (×0.5)
    porque las combinadas tienen mucha más varianza por euro apostado.
    """
    from backend.app.config import settings

    team_idx, h2h_idx = _get_indices(session)
    bankroll = req.bankroll or settings.initial_bankroll
    warnings: list[str] = []

    # Detectar piernas del mismo partido (correlación)
    seen_matches: dict[tuple[str, str], int] = {}
    for i, leg in enumerate(req.legs):
        key = tuple(sorted([leg.home_team.lower(), leg.away_team.lower()]))
        seen_matches.setdefault(key, 0)
        seen_matches[key] += 1
    for key, count in seen_matches.items():
        if count > 1:
            warnings.append(
                f"⚠️ Tienes {count} piernas del partido {key[0]} vs {key[1]}. "
                "La fórmula de combinada asume independencia — esto INFLA la probabilidad. "
                "Una casa seria no aceptaría esta combinación; si sí la aceptan, casi seguro hay correlación negativa."
            )

    leg_details: list[ParlayLegDetail] = []
    combined_odd = 1.0
    combined_p = 1.0

    predictor = _get_predictor()
    for leg in req.legs:
        kickoff = leg.kickoff or datetime.utcnow()
        if leg.home_team not in _known_teams:
            warnings.append(f"'{leg.home_team}' no está en el histórico — predicción con defaults")
        if leg.away_team not in _known_teams:
            warnings.append(f"'{leg.away_team}' no está en el histórico — predicción con defaults")

        feats = _features_using_index(team_idx, h2h_idx, leg.home_team, leg.away_team, kickoff)
        pred = predictor.predict(feats)
        p_m = _get_p_for_selection(pred, leg.market, leg.selection)
        if p_m is None:
            raise HTTPException(400, f"Mercado/selección no reconocido: {leg.market}/{leg.selection}")

        leg_details.append(ParlayLegDetail(
            home_team=leg.home_team, away_team=leg.away_team,
            market=leg.market.upper(), selection=leg.selection.upper(),
            odd=leg.odd, p_model=round(p_m, 4),
        ))
        combined_odd *= leg.odd
        combined_p *= p_m

    implied_p = 1.0 / combined_odd
    edge = combined_p - implied_p
    ev = combined_p * (combined_odd - 1) - (1 - combined_p)
    is_value = ev >= settings.min_expected_value and combined_p >= 0.10 and edge > 0

    # Stake conservador: Kelly normal × 0.5 por mayor varianza
    if is_value:
        f_kelly = kelly_fraction(combined_p, combined_odd)
        stake = round(f_kelly * 0.5 * bankroll, 2)
    else:
        stake = 0.0

    if combined_p < 0.05:
        warnings.append(f"Probabilidad combinada muy baja ({combined_p*100:.1f}%) — long shot, mucha varianza")
    if combined_odd > 50:
        warnings.append(f"Cuota combinada muy alta ({combined_odd:.1f}) — la mayoría de las casas tiene cap en pago máximo")
    if len(req.legs) >= 5:
        warnings.append(f"{len(req.legs)} piernas — la varianza crece exponencialmente; pierdes 90%+ de las veces aunque cada pierna sea +EV")

    rationale = (
        f"Cuota combinada: {combined_odd:.2f} | p_model: {combined_p*100:.2f}% | "
        f"p_implícita: {implied_p*100:.2f}% | edge: {edge*100:+.2f}% | EV: {ev*100:+.2f}%"
    )

    return ParlayResponse(
        n_legs=len(req.legs),
        bankroll=bankroll,
        legs=leg_details,
        combined_odd=round(combined_odd, 4),
        combined_p_model=round(combined_p, 4),
        implied_p=round(implied_p, 4),
        edge=round(edge, 4),
        expected_value=round(ev, 4),
        is_value=is_value,
        warnings=warnings,
        suggested_stake=stake,
        rationale=rationale,
    )


@router.get("/known_teams")
def known_teams(session: Session = Depends(get_session)):
    """Lista los equipos disponibles en el dataset histórico (autocomplete del frontend)."""
    _get_indices(session)
    return {"count": len(_known_teams), "teams": sorted(_known_teams)}


@router.get("/search")
def search_matches(q: str, limit: int = 15, session: Session = Depends(get_session)):
    """Busca partidos PROGRAMADOS cuyo equipo (local o visitante) contenga `q`.

    Tipa parte del nombre del equipo y devuelve hasta `limit` partidos próximos
    con su fixture_id, kickoff y liga, listos para analizar con un click.
    """
    if len(q.strip()) < 2:
        return {"count": 0, "matches": []}
    q_lower = q.strip().lower()
    rows = session.query(Match).filter(
        Match.status == MatchStatus.SCHEDULED,
        (Match.home_team.ilike(f"%{q_lower}%")) | (Match.away_team.ilike(f"%{q_lower}%")),
    ).order_by(Match.kickoff.asc()).limit(limit).all()
    return {
        "count": len(rows),
        "matches": [{
            "fixture_id": m.fixture_id,
            "home_team": m.home_team,
            "away_team": m.away_team,
            "league": m.league,
            "kickoff": m.kickoff.isoformat(),
        } for m in rows],
    }


@router.get("/analyze_fixture/{fixture_id}", response_model=ManualAnalysisResponse)
def analyze_fixture(fixture_id: int, bankroll: Optional[float] = None,
                     session: Session = Depends(get_session)):
    """Análisis completo de un partido conocido (por fixture_id).

    A diferencia de /analyze (donde tú pasas las cuotas), este endpoint
    OBTIENE las cuotas automáticamente desde el data provider (BD sintética
    o API-Football real). Útil tras buscar con /search y hacer click en un
    partido del dropdown.
    """
    from backend.app.config import settings
    from backend.app.services.data_provider import get_provider

    match = session.query(Match).filter(Match.fixture_id == fixture_id).first()
    if not match:
        raise HTTPException(404, f"Partido {fixture_id} no encontrado")

    provider = get_provider()
    odds_map = provider.get_odds([fixture_id])
    snaps = odds_map.get(fixture_id, [])
    if not snaps:
        raise HTTPException(409, "No hay cuotas para este partido")
    snap = snaps[0]  # tomamos la primera casa disponible

    # Construimos un OddsInput a partir del snapshot
    odds = OddsInput(
        home=snap.o_home, draw=snap.o_draw, away=snap.o_away,
        btts_yes=snap.o_btts_yes, btts_no=snap.o_btts_no,
        over_25=snap.o_over_25, under_25=snap.o_under_25,
    )
    req = ManualAnalysisRequest(
        home_team=match.home_team,
        away_team=match.away_team,
        kickoff=match.kickoff,
        league=match.league,
        bookmaker=snap.bookmaker,
        odds=odds,
        bankroll=bankroll,
    )
    return analyze(req, session)
