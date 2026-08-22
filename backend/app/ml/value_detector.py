"""Detector de value bets.

Para cada selección con cuota `o`:
  - p_imp_cruda = 1/o
  - p_fair (devigging) = (1/o) / Σ(1/o_i)   con todas las selecciones del mercado
  - EV = p_model * (o - 1) - (1 - p_model)
  - edge = p_model - p_fair

Se considera "value bet" si:
  - EV ≥ EV_MIN (default 5%)
  - p_model ≥ P_MIN (default 60%)
  - edge > 0
"""
from __future__ import annotations

from dataclasses import dataclass

from backend.app.config import settings


@dataclass
class ValueAssessment:
    is_value: bool
    expected_value: float
    edge: float
    p_model: float
    p_fair: float
    odd: float
    rationale: str


def assess(p_model: float, odd: float, p_fair: float,
           min_p: float | None = None, min_ev: float | None = None,
           min_odd: float | None = None, max_odd: float | None = None) -> ValueAssessment:
    """Evalúa si una selección es value bet."""
    min_p = settings.min_probability if min_p is None else min_p
    min_ev = settings.min_expected_value if min_ev is None else min_ev
    min_odd = settings.min_odd if min_odd is None else min_odd
    max_odd = settings.max_odd if max_odd is None else max_odd

    ev = p_model * (odd - 1) - (1 - p_model)
    edge = p_model - p_fair

    reasons = []
    is_value = True
    if p_model < min_p:
        is_value = False
        reasons.append(f"p_model {p_model:.2%} < min {min_p:.0%}")
    if ev < min_ev:
        is_value = False
        reasons.append(f"EV {ev:.2%} < min {min_ev:.0%}")
    if edge <= 0:
        is_value = False
        reasons.append(f"edge {edge:+.2%} no positivo")
    if odd < min_odd:
        is_value = False
        reasons.append(f"cuota {odd:.2f} muy baja (< {min_odd:.2f})")
    if odd > max_odd:
        is_value = False
        reasons.append(f"cuota {odd:.2f} muy alta (long shot > {max_odd:.2f})")

    rationale = "; ".join(reasons) if reasons else f"p_model={p_model:.2%}, EV={ev:+.2%}, edge={edge:+.2%}"
    return ValueAssessment(
        is_value=is_value, expected_value=ev, edge=edge,
        p_model=p_model, p_fair=p_fair, odd=odd, rationale=rationale,
    )
