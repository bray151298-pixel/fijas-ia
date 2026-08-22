"""Apuesta recomendada y su resultado."""
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class BetStatus(str, enum.Enum):
    PENDING = "PENDING"
    WON = "WON"
    LOST = "LOST"
    VOID = "VOID"


class Bet(Base):
    __tablename__ = "bets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id"), index=True)
    market: Mapped[str] = mapped_column(String(40))      # "1X2", "BTTS", "OU25"
    selection: Mapped[str] = mapped_column(String(40))   # "HOME","DRAW","AWAY","YES","NO","OVER","UNDER"
    odd: Mapped[float] = mapped_column(Float)
    stake: Mapped[float] = mapped_column(Float)
    bankroll_at_bet: Mapped[float] = mapped_column(Float)

    p_model: Mapped[float] = mapped_column(Float)        # probabilidad estimada
    expected_value: Mapped[float] = mapped_column(Float)
    edge: Mapped[float] = mapped_column(Float)

    bookmaker: Mapped[str] = mapped_column(String(80))
    placed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[BetStatus] = mapped_column(Enum(BetStatus), default=BetStatus.PENDING)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pnl: Mapped[float | None] = mapped_column(Float, nullable=True)
