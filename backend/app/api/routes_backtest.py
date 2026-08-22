"""Endpoint para correr backtest sobre el dataset cargado."""
from __future__ import annotations

from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.backtesting.simulator import run_backtest
from backend.app.core.database import get_session
from backend.app.ml.predict import Predictor
from backend.app.models import Match, MatchStatus

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


@router.get("/run")
def run(start: str, end: str, initial: float = 1000.0, session: Session = Depends(get_session)):
    try:
        s = datetime.fromisoformat(start)
        e = datetime.fromisoformat(end)
    except ValueError:
        raise HTTPException(400, "Formato fechas: YYYY-MM-DD")

    matches = session.query(Match).filter(Match.status == MatchStatus.FINISHED).all()
    if not matches:
        raise HTTPException(409, "No hay datos. Corre seed_data primero.")
    df = pd.DataFrame([{
        "fixture_id": m.fixture_id, "league": m.league, "season": m.season,
        "kickoff": m.kickoff, "home_team": m.home_team, "away_team": m.away_team,
        "home_goals": m.home_goals, "away_goals": m.away_goals,
        "home_xg": m.home_xg, "away_xg": m.away_xg,
    } for m in matches])

    predictor = Predictor()
    predictor.load()
    res = run_backtest(df, predictor, s, e, initial_bankroll=initial)
    return {
        "initial": res.initial, "final": res.final, "pnl": res.pnl,
        "bets": res.bets, "won": res.won, "lost": res.lost,
        "roi": res.roi, "winrate": res.winrate,
        "max_drawdown": res.max_drawdown, "peak": res.peak, "sharpe": res.sharpe,
        "curve": [(t.isoformat(), bk) for t, bk in res.bankroll_curve[-200:]],  # últimos 200 puntos
    }
