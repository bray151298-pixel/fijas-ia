"""Backtesting determinístico.

Simula el comportamiento del Tipster sobre un periodo histórico, replicando exactamente:
  - features pre-kickoff (sin leakage)
  - decisión value/no-value
  - sizing Kelly fraccional
  - reglas de riesgo (drawdown guard, stop-loss diario)
  - liquidación al resultado real

Salida: histórico de banca, ROI, winrate, max drawdown, Sharpe.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Iterator

import numpy as np
import pandas as pd

from backend.app.config import settings
from backend.app.core.logging import logger
from backend.app.ml.kelly import kelly_fraction
from backend.app.ml.predict import Predictor
from backend.app.ml.value_detector import assess
from backend.app.services.feature_engineering import (
    FEATURE_COLUMNS,
    _build_team_indices,
    _features_using_index,
    compute_elo_history,
)


@dataclass
class BacktestResult:
    initial: float
    final: float
    bets: int
    won: int
    lost: int
    pnl: float
    roi: float
    winrate: float
    max_drawdown: float
    peak: float
    sharpe: float
    bankroll_curve: list[tuple[datetime, float]] = field(default_factory=list)


def _market_iter(row: pd.Series, pred) -> Iterator[tuple[str, str, float, float, float]]:
    """
    Genera tuplas (market, selection, odd, p_model, p_fair) para todas las selecciones.
    Devigging local sobre el snapshot de cuota único disponible en el CSV.
    """
    # 1X2
    raw_1x2 = 1 / row["o_home"] + 1 / row["o_draw"] + 1 / row["o_away"]
    yield ("1X2", "HOME", float(row["o_home"]), float(pred.p_home), (1 / row["o_home"]) / raw_1x2)
    yield ("1X2", "DRAW", float(row["o_draw"]), float(pred.p_draw), (1 / row["o_draw"]) / raw_1x2)
    yield ("1X2", "AWAY", float(row["o_away"]), float(pred.p_away), (1 / row["o_away"]) / raw_1x2)
    # BTTS
    raw_btts = 1 / row["o_btts_yes"] + 1 / row["o_btts_no"]
    yield ("BTTS", "YES", float(row["o_btts_yes"]), float(pred.p_btts_yes), (1 / row["o_btts_yes"]) / raw_btts)
    yield ("BTTS", "NO", float(row["o_btts_no"]), float(pred.p_btts_no), (1 / row["o_btts_no"]) / raw_btts)
    # OU 2.5
    raw_ou = 1 / row["o_over_25"] + 1 / row["o_under_25"]
    yield ("OU25", "OVER", float(row["o_over_25"]), float(pred.p_over_25), (1 / row["o_over_25"]) / raw_ou)
    yield ("OU25", "UNDER", float(row["o_under_25"]), float(pred.p_under_25), (1 / row["o_under_25"]) / raw_ou)


def _resolve(market: str, selection: str, hg: int, ag: int) -> bool:
    if market == "1X2":
        if selection == "HOME": return hg > ag
        if selection == "DRAW": return hg == ag
        if selection == "AWAY": return hg < ag
    if market == "BTTS":
        return ((hg > 0 and ag > 0) and selection == "YES") or \
               ((hg == 0 or ag == 0) and selection == "NO")
    if market == "OU25":
        total = hg + ag
        return (total > 2.5 and selection == "OVER") or (total <= 2.5 and selection == "UNDER")
    return False


def run_backtest(matches_df: pd.DataFrame, predictor: Predictor,
                 start: datetime, end: datetime,
                 initial_bankroll: float | None = None) -> BacktestResult:
    """Corre un backtest entre `start` y `end` usando los modelos cargados en `predictor`."""
    initial = initial_bankroll or settings.initial_bankroll
    bankroll = float(initial)
    peak = bankroll
    daily_pnl: dict[date, float] = {}
    bets, won, lost = 0, 0, 0
    pnl_total = 0.0
    curve: list[tuple[datetime, float]] = [(start, bankroll)]
    daily_returns: list[float] = []

    df_with_elo = compute_elo_history(matches_df)
    team_idx, h2h_idx = _build_team_indices(df_with_elo)
    df_eval = df_with_elo[(df_with_elo["kickoff"] >= start) & (df_with_elo["kickoff"] <= end)].sort_values("kickoff")

    last_day = None
    last_day_start_bk = bankroll

    for _, row in df_eval.iterrows():
        if pd.isna(row["home_goals"]) or pd.isna(row["away_goals"]):
            continue
        kickoff = row["kickoff"].to_pydatetime() if hasattr(row["kickoff"], "to_pydatetime") else row["kickoff"]
        d = kickoff.date()
        if last_day is None:
            last_day = d
        elif d != last_day:
            daily_returns.append((bankroll - last_day_start_bk) / last_day_start_bk if last_day_start_bk > 0 else 0.0)
            last_day = d
            last_day_start_bk = bankroll

        # Stop-loss diario
        if daily_pnl.get(d, 0.0) <= -settings.daily_stop_loss_pct * peak:
            continue

        feats = _features_using_index(team_idx, h2h_idx, row["home_team"], row["away_team"], kickoff)
        pred = predictor.predict(feats)

        for market, selection, odd, p_m, p_f in _market_iter(row, pred):
            a = assess(p_m, odd, p_f)
            if not a.is_value:
                continue
            f = kelly_fraction(p_m, odd)
            # Drawdown guard
            if peak > 0 and (peak - bankroll) / peak >= settings.drawdown_threshold_pct:
                f *= 0.5
            stake = round(f * bankroll, 2)
            if stake < 1.0:
                continue

            won_bet = _resolve(market, selection, int(row["home_goals"]), int(row["away_goals"]))
            pnl = stake * (odd - 1) if won_bet else -stake
            bankroll += pnl
            peak = max(peak, bankroll)
            pnl_total += pnl
            bets += 1
            won += int(won_bet)
            lost += int(not won_bet)
            daily_pnl[d] = daily_pnl.get(d, 0.0) + pnl
            curve.append((kickoff, bankroll))

            if bankroll <= 0:
                logger.error("Banca quebrada — stop")
                break
        if bankroll <= 0:
            break

    drawdown = max(0.0, (peak - bankroll) / peak) if peak > 0 else 0.0
    roi = pnl_total / (sum(abs(p[1] - p2[1]) for p, p2 in zip(curve, curve[1:])) or 1.0)
    # Sharpe simple: media/stdev de daily returns (anualizado)
    if daily_returns:
        mu = float(np.mean(daily_returns))
        sd = float(np.std(daily_returns)) or 1e-9
        sharpe = (mu / sd) * np.sqrt(365)
    else:
        sharpe = 0.0
    winrate = (won / bets) if bets else 0.0
    return BacktestResult(
        initial=initial, final=round(bankroll, 2), bets=bets, won=won, lost=lost,
        pnl=round(pnl_total, 2), roi=round(roi, 4), winrate=round(winrate, 4),
        max_drawdown=round(drawdown, 4), peak=round(peak, 2), sharpe=round(sharpe, 2),
        bankroll_curve=curve,
    )
