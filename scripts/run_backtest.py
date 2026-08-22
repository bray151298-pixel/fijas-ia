"""Corre un backtest completo sobre el CSV histórico."""
from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import pandas as pd

from backend.app.backtesting.simulator import run_backtest
from backend.app.config import settings
from backend.app.ml.predict import Predictor


def main():
    csv_path = Path("data/synthetic_matches.csv")
    df = pd.read_csv(csv_path, parse_dates=["kickoff"])
    df = df[df["status"] == "FINISHED"].copy()

    # Backtest sobre el ÚLTIMO 25% de la historia (out-of-sample del entrenamiento)
    df = df.sort_values("kickoff").reset_index(drop=True)
    cut = int(len(df) * 0.75)
    start = df.iloc[cut]["kickoff"]
    end = df.iloc[-1]["kickoff"]
    print(f"Backtest: {start.date()} → {end.date()}  (out-of-sample, {len(df) - cut} partidos)")

    predictor = Predictor()
    predictor.load()
    res = run_backtest(df, predictor, start, end, initial_bankroll=settings.initial_bankroll)

    print("\n=== Resultados Backtest ===")
    print(f" Banca inicial   : {res.initial:,.2f}")
    print(f" Banca final     : {res.final:,.2f}")
    print(f" PnL             : {res.pnl:+,.2f}")
    print(f" Apuestas totales: {res.bets}")
    print(f" Ganadas/Perdidas: {res.won} / {res.lost}")
    print(f" Winrate         : {res.winrate:.1%}")
    print(f" ROI             : {res.roi:+.2%}")
    print(f" Max drawdown    : {res.max_drawdown:.1%}")
    print(f" Banca peak      : {res.peak:,.2f}")
    print(f" Sharpe (anual)  : {res.sharpe:.2f}")


if __name__ == "__main__":
    main()
