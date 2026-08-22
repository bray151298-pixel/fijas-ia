"""Ejemplo de análisis end-to-end de UN partido.

Toma el primer partido SCHEDULED del dataset y muestra:
  1. Features calculadas
  2. Probabilidades del modelo
  3. Cuotas y probabilidades fair (devigging)
  4. EV por selección
  5. Veredicto del Tipster (¿value? ¿stake sugerido?)
"""
from __future__ import annotations

from pathlib import Path
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import pandas as pd

from backend.app.config import settings
from backend.app.ml.kelly import kelly_fraction
from backend.app.ml.predict import Predictor
from backend.app.ml.value_detector import assess
from backend.app.services.feature_engineering import (FEATURE_COLUMNS,
                                                       build_features_for_match,
                                                       compute_elo_history)


def _devig_1x2(o_h, o_d, o_a):
    raw = 1/o_h + 1/o_d + 1/o_a
    return (1/o_h)/raw, (1/o_d)/raw, (1/o_a)/raw, raw - 1


def _devig_binary(oy, on):
    raw = 1/oy + 1/on
    return (1/oy)/raw, (1/on)/raw, raw - 1


def main():
    df = pd.read_csv("data/synthetic_matches.csv", parse_dates=["kickoff"])
    history = df[df["status"] == "FINISHED"].copy()
    history = compute_elo_history(history)
    upcoming = df[df["status"] == "SCHEDULED"].sort_values("kickoff")
    if upcoming.empty:
        print("No hay partidos futuros. Re-corre seed_data.")
        return

    m = upcoming.iloc[0]
    print(f"\n📅 {m['kickoff']:%Y-%m-%d %H:%M}  ·  {m['league']}")
    print(f"⚽ {m['home_team']}  vs  {m['away_team']}\n")

    feats = build_features_for_match(history, m["home_team"], m["away_team"], m["kickoff"])
    print("=== Features pre-kickoff ===")
    for k in FEATURE_COLUMNS:
        print(f"  {k:<25}: {feats[k]:>8.3f}")

    predictor = Predictor()
    predictor.load()
    pred = predictor.predict(feats)
    print("\n=== Probabilidades del modelo ===")
    print(f"  P(Home Win) : {pred.p_home:.1%}")
    print(f"  P(Draw)     : {pred.p_draw:.1%}")
    print(f"  P(Away Win) : {pred.p_away:.1%}")
    print(f"  P(BTTS Yes) : {pred.p_btts_yes:.1%}")
    print(f"  P(Over 2.5) : {pred.p_over_25:.1%}")

    p_fh, p_fd, p_fa, vig = _devig_1x2(m["o_home"], m["o_draw"], m["o_away"])
    p_fby, p_fbn, vig_b = _devig_binary(m["o_btts_yes"], m["o_btts_no"])
    p_fo, p_fu, vig_ou = _devig_binary(m["o_over_25"], m["o_under_25"])

    print(f"\n=== Cuotas (vig 1X2={vig:.1%}, BTTS={vig_b:.1%}, OU={vig_ou:.1%}) ===")
    print(f"  1X2     : H {m['o_home']:.2f} | D {m['o_draw']:.2f} | A {m['o_away']:.2f}")
    print(f"  BTTS    : Yes {m['o_btts_yes']:.2f} | No {m['o_btts_no']:.2f}")
    print(f"  OU 2.5  : O {m['o_over_25']:.2f} | U {m['o_under_25']:.2f}")

    selections = [
        ("1X2 HOME",  pred.p_home,     m["o_home"],     p_fh),
        ("1X2 DRAW",  pred.p_draw,     m["o_draw"],     p_fd),
        ("1X2 AWAY",  pred.p_away,     m["o_away"],     p_fa),
        ("BTTS YES",  pred.p_btts_yes, m["o_btts_yes"], p_fby),
        ("BTTS NO",   pred.p_btts_no,  m["o_btts_no"],  p_fbn),
        ("OU OVER",   pred.p_over_25,  m["o_over_25"],  p_fo),
        ("OU UNDER",  pred.p_under_25, m["o_under_25"], p_fu),
    ]

    print("\n=== Análisis EV por selección ===")
    print(f"{'Selección':<12} {'p_model':>9} {'p_fair':>9} {'odd':>7} {'EV':>9} {'Edge':>9} {'Stake':>9}  Veredicto")
    print("-" * 92)
    bankroll = settings.initial_bankroll
    for name, p_m, odd, p_f in selections:
        a = assess(p_m, odd, p_f)
        f = kelly_fraction(p_m, odd) if a.is_value else 0.0
        stake = round(f * bankroll, 2)
        verdict = "✅ VALUE" if a.is_value else "❌ pasar"
        print(f"{name:<12} {p_m:>9.1%} {p_f:>9.1%} {odd:>7.2f} {a.expected_value:>+9.1%} {a.edge:>+9.1%} {stake:>9.2f}  {verdict}  {a.rationale}")


if __name__ == "__main__":
    main()
