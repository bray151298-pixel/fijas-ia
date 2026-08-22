"""Criterio de Kelly fraccional."""
from __future__ import annotations

from backend.app.config import settings


def kelly_fraction(p: float, odd: float,
                   fraction: float | None = None,
                   cap_pct: float | None = None) -> float:
    """
    Devuelve la fracción de banca a apostar.
      f* = (p*b - (1-p)) / b   donde b = odd-1
      f  = f* * `fraction`     (Kelly fraccional, default 0.25)
      f  = min(f, cap_pct)     (hard cap, default 2%)
    Si edge ≤ 0 devuelve 0.
    """
    fraction = settings.kelly_fraction if fraction is None else fraction
    cap_pct = settings.max_stake_pct if cap_pct is None else cap_pct

    b = odd - 1
    if b <= 0:
        return 0.0
    edge = p * b - (1 - p)
    if edge <= 0:
        return 0.0
    f_full = edge / b
    return float(min(f_full * fraction, cap_pct))


def stake_amount(p: float, odd: float, bankroll: float, **kw) -> float:
    """Devuelve el monto en dinero a apostar."""
    return round(kelly_fraction(p, odd, **kw) * bankroll, 2)
