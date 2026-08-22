"""Metadatos de cada versión de modelo entrenada."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), index=True)         # "1X2","BTTS","OU25"
    version: Mapped[str] = mapped_column(String(80), unique=True)     # hash o timestamp
    trained_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    artifact_path: Mapped[str] = mapped_column(String(255))

    # Métricas de evaluación
    log_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    brier_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    samples_train: Mapped[int | None] = mapped_column(Integer, nullable=True)
    samples_val: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
