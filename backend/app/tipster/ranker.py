"""Rankea picks del día y produce top-N para alertas / dashboard."""
from __future__ import annotations

from typing import Iterable

from backend.app.schemas.dto import ValueBetDTO


def rank_picks(picks: Iterable[ValueBetDTO], top_n: int = 5) -> list[ValueBetDTO]:
    """Ordena por (EV * confianza) descendente y devuelve los top-N."""
    scored = sorted(picks, key=lambda p: p.expected_value * p.confidence, reverse=True)
    return scored[:top_n]
