"""Agregador de cuotas: combina snapshots de N casas y devuelve la mejor por selección,
junto con la probabilidad fair (devigging) y el margen del bookmaker.

Devigging = quitar el margen del bookmaker para obtener una estimación de probabilidad
"limpia" derivada del mercado. Comparar `p_modelo` vs `p_fair` da el "edge".
"""
from __future__ import annotations

from dataclasses import dataclass

from backend.app.schemas.dto import OddsDTO


@dataclass
class BestOdds1X2:
    o_home: float
    o_draw: float
    o_away: float
    book_home: str
    book_draw: str
    book_away: str
    p_fair_home: float
    p_fair_draw: float
    p_fair_away: float
    vig: float


@dataclass
class BestOddsBinary:
    o_yes: float
    o_no: float
    book_yes: str
    book_no: str
    p_fair_yes: float
    p_fair_no: float
    vig: float


def best_1x2(snapshots: list[OddsDTO]) -> BestOdds1X2 | None:
    valid = [s for s in snapshots if s.o_home and s.o_draw and s.o_away]
    if not valid:
        return None
    best_h = max(valid, key=lambda s: s.o_home or 0)
    best_d = max(valid, key=lambda s: s.o_draw or 0)
    best_a = max(valid, key=lambda s: s.o_away or 0)

    # Para devigging usamos un único snapshot consistente (el que tenga 3 cuotas).
    # Tomamos el primer snapshot que tenga las tres cuotas presentes.
    s0 = valid[0]
    raw = (1 / s0.o_home) + (1 / s0.o_draw) + (1 / s0.o_away)  # > 1
    vig = raw - 1.0
    return BestOdds1X2(
        o_home=best_h.o_home,
        o_draw=best_d.o_draw,
        o_away=best_a.o_away,
        book_home=best_h.bookmaker,
        book_draw=best_d.bookmaker,
        book_away=best_a.bookmaker,
        p_fair_home=(1 / s0.o_home) / raw,
        p_fair_draw=(1 / s0.o_draw) / raw,
        p_fair_away=(1 / s0.o_away) / raw,
        vig=vig,
    )


def _best_binary(snaps: list[OddsDTO], yes_attr: str, no_attr: str) -> BestOddsBinary | None:
    valid = [s for s in snaps if getattr(s, yes_attr) and getattr(s, no_attr)]
    if not valid:
        return None
    best_y = max(valid, key=lambda s: getattr(s, yes_attr) or 0)
    best_n = max(valid, key=lambda s: getattr(s, no_attr) or 0)
    s0 = valid[0]
    oy, on = getattr(s0, yes_attr), getattr(s0, no_attr)
    raw = 1 / oy + 1 / on
    vig = raw - 1.0
    return BestOddsBinary(
        o_yes=getattr(best_y, yes_attr),
        o_no=getattr(best_n, no_attr),
        book_yes=best_y.bookmaker,
        book_no=best_n.bookmaker,
        p_fair_yes=(1 / oy) / raw,
        p_fair_no=(1 / on) / raw,
        vig=vig,
    )


def best_btts(snapshots: list[OddsDTO]) -> BestOddsBinary | None:
    return _best_binary(snapshots, "o_btts_yes", "o_btts_no")


def best_over_under_25(snapshots: list[OddsDTO]) -> BestOddsBinary | None:
    return _best_binary(snapshots, "o_over_25", "o_under_25")
