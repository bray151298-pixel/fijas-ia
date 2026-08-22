"""Snapshot de cuotas de un partido."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class OddsSnapshot(Base):
    """Snapshot puntual de cuotas. Permite tener N snapshots por partido y casa."""
    __tablename__ = "odds_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id"), index=True)
    bookmaker: Mapped[str] = mapped_column(String(80), index=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime, index=True, default=datetime.utcnow)

    # 1X2
    o_home: Mapped[float | None] = mapped_column(Float, nullable=True)
    o_draw: Mapped[float | None] = mapped_column(Float, nullable=True)
    o_away: Mapped[float | None] = mapped_column(Float, nullable=True)

    # BTTS
    o_btts_yes: Mapped[float | None] = mapped_column(Float, nullable=True)
    o_btts_no: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Over/Under 2.5
    o_over_25: Mapped[float | None] = mapped_column(Float, nullable=True)
    o_under_25: Mapped[float | None] = mapped_column(Float, nullable=True)
