"""Snapshot de estadísticas y features de un equipo en una fecha (pre-kickoff)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class TeamStats(Base):
    """Features pre-calculadas para un equipo a una fecha. Material para reproducibilidad."""
    __tablename__ = "team_stats"
    __table_args__ = (UniqueConstraint("team", "as_of", name="uq_team_asof"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team: Mapped[str] = mapped_column(String(120), index=True)
    as_of: Mapped[datetime] = mapped_column(DateTime, index=True)

    # Forma reciente
    form_5_points: Mapped[float] = mapped_column(Float, default=0.0)
    goals_for_avg_10: Mapped[float] = mapped_column(Float, default=0.0)
    goals_against_avg_10: Mapped[float] = mapped_column(Float, default=0.0)

    # ELO
    elo: Mapped[float] = mapped_column(Float, default=1500.0)

    # xG
    xg_for_avg_10: Mapped[float] = mapped_column(Float, default=0.0)
    xg_against_avg_10: Mapped[float] = mapped_column(Float, default=0.0)

    # Lesiones (impacto agregado: peso por minutos*rating)
    injury_impact: Mapped[float] = mapped_column(Float, default=0.0)

    # Descanso
    rest_days: Mapped[int] = mapped_column(Integer, default=7)
