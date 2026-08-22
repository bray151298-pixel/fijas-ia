"""Pipeline de entrenamiento.

Entrena 3 modelos: 1X2 (multiclass), BTTS (binary), Over/Under 2.5 (binary).
Cada uno:
  - Pipeline = StandardScaler + XGBoost
  - Calibración isotónica con TimeSeriesSplit
  - Validación temporal (NO random K-fold)
  - Persistencia con joblib + metadatos

Uso:
    from backend.app.ml.train import train_all
    train_all(features_df)
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, brier_score_loss, log_loss
from sklearn.model_selection import TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from backend.app.config import settings
from backend.app.core.logging import logger
from backend.app.services.feature_engineering import FEATURE_COLUMNS


@dataclass
class TrainResult:
    name: str
    artifact_path: Path
    log_loss: float
    brier: float | None
    accuracy: float
    samples_train: int
    samples_val: int
    version: str


def _xgb(num_class: int | None = None) -> XGBClassifier:
    common = dict(
        n_estimators=400,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.0,
        tree_method="hist",
        random_state=42,
        eval_metric="mlogloss" if num_class else "logloss",
    )
    if num_class and num_class > 2:
        return XGBClassifier(objective="multi:softprob", num_class=num_class, **common)
    return XGBClassifier(objective="binary:logistic", **common)


def _make_pipeline(model) -> Pipeline:
    return Pipeline([
        ("scaler", StandardScaler()),
        ("model", model),
    ])


def _temporal_split(df: pd.DataFrame, val_frac: float = 0.2) -> tuple[pd.DataFrame, pd.DataFrame]:
    df_sorted = df.sort_values("kickoff").reset_index(drop=True)
    cut = int(len(df_sorted) * (1 - val_frac))
    return df_sorted.iloc[:cut], df_sorted.iloc[cut:]


def _save(obj: dict, name: str) -> tuple[Path, str]:
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    version = ts
    obj["version"] = version
    path = settings.artifacts_path / f"{name}_{ts}.joblib"
    joblib.dump(obj, path)
    # Symlink/copia al "latest"
    latest = settings.artifacts_path / f"{name}_latest.joblib"
    joblib.dump(obj, latest)
    return path, version


def train_1x2(features_df: pd.DataFrame) -> TrainResult:
    train, val = _temporal_split(features_df)
    X_tr, y_tr = train[FEATURE_COLUMNS].values, train["y_1x2"].values
    X_va, y_va = val[FEATURE_COLUMNS].values, val["y_1x2"].values

    base = _make_pipeline(_xgb(num_class=3))
    # Calibración isotónica con TimeSeriesSplit para evitar leakage
    calibrated = CalibratedClassifierCV(base, method="isotonic", cv=TimeSeriesSplit(5))
    calibrated.fit(X_tr, y_tr)

    proba = calibrated.predict_proba(X_va)
    pred = calibrated.predict(X_va)
    ll = float(log_loss(y_va, proba, labels=[0, 1, 2]))
    acc = float(accuracy_score(y_va, pred))

    artifact = {"pipeline": calibrated, "feature_columns": FEATURE_COLUMNS}
    path, version = _save(artifact, "model_1x2")
    logger.info(f"[1X2] log_loss={ll:.4f} acc={acc:.3f} samples_train={len(y_tr)} samples_val={len(y_va)}")
    return TrainResult("1X2", path, ll, None, acc, len(y_tr), len(y_va), version)


def _train_binary(features_df: pd.DataFrame, target_col: str, name: str) -> TrainResult:
    train, val = _temporal_split(features_df)
    X_tr, y_tr = train[FEATURE_COLUMNS].values, train[target_col].values
    X_va, y_va = val[FEATURE_COLUMNS].values, val[target_col].values

    base = _make_pipeline(_xgb())
    calibrated = CalibratedClassifierCV(base, method="isotonic", cv=TimeSeriesSplit(5))
    calibrated.fit(X_tr, y_tr)

    proba_yes = calibrated.predict_proba(X_va)[:, 1]
    pred = (proba_yes >= 0.5).astype(int)
    ll = float(log_loss(y_va, np.column_stack([1 - proba_yes, proba_yes]), labels=[0, 1]))
    brier = float(brier_score_loss(y_va, proba_yes))
    acc = float(accuracy_score(y_va, pred))

    artifact = {"pipeline": calibrated, "feature_columns": FEATURE_COLUMNS}
    path, version = _save(artifact, f"model_{name}")
    logger.info(f"[{name.upper()}] log_loss={ll:.4f} brier={brier:.4f} acc={acc:.3f}")
    return TrainResult(name, path, ll, brier, acc, len(y_tr), len(y_va), version)


def train_btts(features_df: pd.DataFrame) -> TrainResult:
    return _train_binary(features_df, "y_btts", "btts")


def train_over25(features_df: pd.DataFrame) -> TrainResult:
    return _train_binary(features_df, "y_over25", "over25")


def train_all(features_df: pd.DataFrame) -> list[TrainResult]:
    """Entrena los 3 modelos y devuelve resultados."""
    return [
        train_1x2(features_df),
        train_btts(features_df),
        train_over25(features_df),
    ]
