"""Predicción del modelo para un partido."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id"), index=True)
    model_version: Mapped[str] = mapped_column(String(80), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # 1X2
    p_home: Mapped[float] = mapped_column(Float)
    p_draw: Mapped[float] = mapped_column(Float)
    p_away: Mapped[float] = mapped_column(Float)

    # BTTS
    p_btts_yes: Mapped[float] = mapped_column(Float)

    # Over/Under 2.5
    p_over_25: Mapped[float] = mapped_column(Float)
