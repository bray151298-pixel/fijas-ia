"""Modelo ORM de partidos."""
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class MatchStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    LIVE = "LIVE"
    FINISHED = "FINISHED"
    CANCELLED = "CANCELLED"


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fixture_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)  # ID del proveedor
    league: Mapped[str] = mapped_column(String(120), index=True)
    season: Mapped[int] = mapped_column(Integer, index=True)
    kickoff: Mapped[datetime] = mapped_column(DateTime, index=True)
    home_team: Mapped[str] = mapped_column(String(120), index=True)
    away_team: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[MatchStatus] = mapped_column(Enum(MatchStatus), default=MatchStatus.SCHEDULED)
    home_goals: Mapped[int | None] = mapped_column(Integer, nullable=True)
    away_goals: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Datos auxiliares pre-partido
    home_xg: Mapped[float | None] = mapped_column(Float, nullable=True)
    away_xg: Mapped[float | None] = mapped_column(Float, nullable=True)

    def __repr__(self) -> str:
        return f"<Match {self.home_team} vs {self.away_team} @ {self.kickoff:%Y-%m-%d}>"
