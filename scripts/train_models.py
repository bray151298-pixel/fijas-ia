"""Entrena los 3 modelos (1X2, BTTS, OU2.5) sobre datos del CSV sintético/real."""
from __future__ import annotations

from pathlib import Path
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import pandas as pd

from backend.app.core.logging import logger
from backend.app.ml.train import train_all
from backend.app.services.feature_engineering import build_features_dataframe


def main():
    csv_path = Path("data/synthetic_matches.csv")
    if not csv_path.exists():
        raise FileNotFoundError("No existe data/synthetic_matches.csv. Corre `python -m scripts.seed_data`.")
    df = pd.read_csv(csv_path, parse_dates=["kickoff"])
    finished = df[df["status"] == "FINISHED"].copy()
    logger.info(f"Construyendo features para {len(finished)} partidos terminados...")
    feat = build_features_dataframe(finished)
    logger.info(f"Features construidas: {feat.shape}")

    results = train_all(feat)
    print("\n=== Resultados de entrenamiento ===")
    for r in results:
        print(f" {r.name:<6} | log_loss={r.log_loss:.4f} | "
              f"acc={r.accuracy:.3f} | "
              f"brier={'-' if r.brier is None else f'{r.brier:.4f}'} | "
              f"train={r.samples_train} val={r.samples_val} | "
              f"version={r.version}")


if __name__ == "__main__":
    main()
