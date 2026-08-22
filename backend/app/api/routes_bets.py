"""Endpoints de apuestas (picks recomendados, settle, listado)."""
from __future__ import annotations

from datetime import date, datetime

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_session
from backend.app.core.logging import logger
from backend.app.ml.predict import Predictor
from backend.app.models import Bet, BetStatus, Match, MatchStatus
from backend.app.tipster.decision_engine import DecisionEngine
from backend.app.tipster.ranker import rank_picks

router = APIRouter(prefix="/api/bets", tags=["bets"])
_predictor: Predictor | None = None


def _get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        _predictor = Predictor()
        _predictor.load()
    return _predictor


def _current_bankroll(session: Session, initial: float) -> tuple[float, float]:
    """Devuelve (bankroll_actual, peak_bankroll) sumando PnL de apuestas resueltas."""
    rows = session.query(Bet).filter(Bet.status.in_([BetStatus.WON, BetStatus.LOST])).order_by(Bet.settled_at.asc()).all()
    bk = initial
    peak = initial
    for b in rows:
        bk += b.pnl or 0.0
        peak = max(peak, bk)
    return bk, peak


@router.get("/recommended")
def recommended(top_n: int = 5, on_date: date | None = None, session: Session = Depends(get_session)):
    from backend.app.config import settings
    on_date = on_date or date.today()

    matches = session.query(Match).filter(Match.status == MatchStatus.FINISHED).all()
    if not matches:
        raise HTTPException(409, "No hay datos históricos. Corre `python -m scripts.seed_data` primero.")

    history = pd.DataFrame([{
        "fixture_id": m.fixture_id, "league": m.league, "season": m.season,
        "kickoff": m.kickoff, "home_team": m.home_team, "away_team": m.away_team,
        "home_goals": m.home_goals, "away_goals": m.away_goals,
        "home_xg": m.home_xg, "away_xg": m.away_xg,
    } for m in matches])

    bankroll, peak = _current_bankroll(session, settings.initial_bankroll)
    engine = DecisionEngine(session, history, _get_predictor())
    picks = engine.scan(on_date, bankroll, peak)
    top = rank_picks(picks, top_n=top_n)
    return {
        "date": on_date.isoformat(),
        "bankroll": bankroll,
        "peak": peak,
        "count": len(top),
        "picks": [p.model_dump() for p in top],
    }


@router.post("/{bet_id}/settle")
def settle_bet(bet_id: int, won: bool, session: Session = Depends(get_session)):
    bet = session.get(Bet, bet_id)
    if not bet:
        raise HTTPException(404, "Bet not found")
    if bet.status != BetStatus.PENDING:
        raise HTTPException(409, "Bet ya resuelta")
    bet.status = BetStatus.WON if won else BetStatus.LOST
    bet.pnl = bet.stake * (bet.odd - 1) if won else -bet.stake
    bet.settled_at = datetime.utcnow()
    session.commit()
    return {"id": bet.id, "status": bet.status.value, "pnl": bet.pnl}


@router.get("")
def list_bets(status: BetStatus | None = None, limit: int = 100, session: Session = Depends(get_session)):
    q = session.query(Bet)
    if status:
        q = q.filter(Bet.status == status)
    rows = q.order_by(Bet.placed_at.desc()).limit(limit).all()
    return [{
        "id": b.id, "match_id": b.match_id, "market": b.market, "selection": b.selection,
        "odd": b.odd, "stake": b.stake, "p_model": b.p_model, "expected_value": b.expected_value,
        "status": b.status.value, "pnl": b.pnl, "placed_at": b.placed_at.isoformat(),
    } for b in rows]
