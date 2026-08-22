"""Endpoints de predicciones."""
from __future__ import annotations

from datetime import date

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_session
from backend.app.ml.predict import Predictor
from backend.app.models import Match, MatchStatus
from backend.app.services.feature_engineering import (
    _build_team_indices, _features_using_index, compute_elo_history,
)
from backend.app.tipster.decision_engine import DecisionEngine

router = APIRouter(prefix="/api/predictions", tags=["predictions"])
_predictor: Predictor | None = None


def _get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        _predictor = Predictor()
        _predictor.load()
    return _predictor


@router.get("/today")
def predictions_today(on_date: date | None = None, session: Session = Depends(get_session)):
    """Devuelve probabilidades para los partidos de la fecha solicitada (default hoy)."""
    on_date = on_date or date.today()
    matches = session.query(Match).filter(
        Match.kickoff >= pd.Timestamp(on_date),
        Match.kickoff < pd.Timestamp(on_date) + pd.Timedelta(days=1),
    ).all()
    if not matches:
        return {"date": on_date.isoformat(), "predictions": []}

    history = pd.DataFrame([{
        "fixture_id": m.fixture_id, "league": m.league, "season": m.season,
        "kickoff": m.kickoff, "home_team": m.home_team, "away_team": m.away_team,
        "home_goals": m.home_goals, "away_goals": m.away_goals,
        "home_xg": m.home_xg, "away_xg": m.away_xg,
    } for m in session.query(Match).filter(Match.status == MatchStatus.FINISHED).all()])

    if history.empty:
        raise HTTPException(409, "No hay datos históricos para construir features.")

    pred = _get_predictor()
    df_with_elo = compute_elo_history(history)
    team_idx, h2h_idx = _build_team_indices(df_with_elo)

    out = []
    for m in matches:
        feats = _features_using_index(team_idx, h2h_idx, m.home_team, m.away_team, m.kickoff)
        p = pred.predict(feats)
        out.append({
            "fixture_id": m.fixture_id,
            "match": f"{m.home_team} vs {m.away_team}",
            "league": m.league,
            "kickoff": m.kickoff.isoformat(),
            "p_home": p.p_home, "p_draw": p.p_draw, "p_away": p.p_away,
            "p_btts_yes": p.p_btts_yes, "p_over_25": p.p_over_25,
        })
    return {"date": on_date.isoformat(), "predictions": out}
