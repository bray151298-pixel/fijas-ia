"""Endpoints de métricas / dashboard."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.core.database import get_session
from backend.app.models import Bet, BetStatus
from backend.app.schemas.dto import DashboardMetrics

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def metrics(session: Session = Depends(get_session)):
    bets = session.query(Bet).order_by(Bet.placed_at.asc()).all()
    won = sum(1 for b in bets if b.status == BetStatus.WON)
    lost = sum(1 for b in bets if b.status == BetStatus.LOST)
    pending = sum(1 for b in bets if b.status == BetStatus.PENDING)
    pnl = sum((b.pnl or 0.0) for b in bets)
    total_stake = sum(b.stake for b in bets if b.status in (BetStatus.WON, BetStatus.LOST))
    bankroll = settings.initial_bankroll + pnl

    # max drawdown
    bk = settings.initial_bankroll
    peak = bk
    max_dd = 0.0
    for b in bets:
        if b.status in (BetStatus.WON, BetStatus.LOST):
            bk += b.pnl or 0.0
            peak = max(peak, bk)
            dd = (peak - bk) / peak if peak > 0 else 0.0
            max_dd = max(max_dd, dd)

    return DashboardMetrics(
        bankroll=round(bankroll, 2),
        initial_bankroll=settings.initial_bankroll,
        total_bets=len(bets),
        won=won, lost=lost, pending=pending,
        pnl=round(pnl, 2),
        roi=round(pnl / total_stake, 4) if total_stake > 0 else 0.0,
        winrate=round(won / (won + lost), 4) if (won + lost) > 0 else 0.0,
        max_drawdown=round(max_dd, 4),
        peak_bankroll=round(peak, 2),
    )
