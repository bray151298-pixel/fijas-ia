"""Aprendizaje continuo: scheduler que decide cuándo reentrenar.

Triggers (ver ARCHITECTURE.md §2.8):
  1. Data-driven: cada N apuestas resueltas nuevas.
  2. Drift: Brier rolling 30 días sube >15% vs baseline.
  3. Cron: semanal.

Implementación: APScheduler. En contenedor independiente (docker-compose service).
"""
from __future__ import annotations

import sys
import time
from datetime import datetime, timedelta

import pandas as pd
from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import select

from backend.app.core.database import session_scope, init_db
from backend.app.core.logging import logger
from backend.app.ml.train import train_all
from backend.app.models import Bet, BetStatus, Match, MatchStatus
from backend.app.services.feature_engineering import build_features_dataframe


SETTLED_THRESHOLD = 200  # reentrenar tras 200 nuevas apuestas resueltas
_last_settled_count = 0


def _settled_count() -> int:
    with session_scope() as s:
        return s.query(Bet).filter(Bet.status.in_([BetStatus.WON, BetStatus.LOST])).count()


def _matches_df() -> pd.DataFrame:
    with session_scope() as s:
        rows = s.query(Match).filter(Match.status == MatchStatus.FINISHED).all()
        return pd.DataFrame([{
            "fixture_id": m.fixture_id,
            "league": m.league,
            "season": m.season,
            "kickoff": m.kickoff,
            "home_team": m.home_team,
            "away_team": m.away_team,
            "home_goals": m.home_goals,
            "away_goals": m.away_goals,
            "home_xg": m.home_xg,
            "away_xg": m.away_xg,
        } for m in rows])


def maybe_retrain():
    global _last_settled_count
    now = _settled_count()
    if now - _last_settled_count >= SETTLED_THRESHOLD:
        logger.info(f"Trigger retraining: {now - _last_settled_count} nuevas apuestas resueltas")
        df = _matches_df()
        if len(df) < 200:
            logger.warning(f"Solo {len(df)} matches — retrasando retraining")
            return
        feat = build_features_dataframe(df)
        train_all(feat)
        _last_settled_count = now


def weekly_retrain():
    logger.info("Retraining semanal programado...")
    df = _matches_df()
    if len(df) < 200:
        logger.warning(f"Solo {len(df)} matches — saltando")
        return
    feat = build_features_dataframe(df)
    train_all(feat)


def main():
    init_db()
    scheduler = BlockingScheduler()
    scheduler.add_job(maybe_retrain, "interval", hours=6)
    scheduler.add_job(weekly_retrain, "cron", day_of_week="sun", hour=3)
    logger.info("Retrain scheduler arrancado (data-driven cada 6h, semanal domingo 3am)")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        sys.exit(0)


if __name__ == "__main__":
    main()
