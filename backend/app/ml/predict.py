"""Carga modelos y produce predicciones para nuevos partidos."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np

from backend.app.config import settings
from backend.app.core.logging import logger


@dataclass
class MatchPrediction:
    p_home: float
    p_draw: float
    p_away: float
    p_btts_yes: float
    p_btts_no: float
    p_over_25: float
    p_under_25: float
    model_version: str


class Predictor:
    def __init__(self, artifacts_dir: Path | None = None):
        self.dir = artifacts_dir or settings.artifacts_path
        self._m_1x2 = None
        self._m_btts = None
        self._m_over = None
        self._version = "unknown"
        self._features: list[str] = []

    def load(self) -> None:
        versions = []
        for name, attr in [("1x2", "_m_1x2"), ("btts", "_m_btts"), ("over25", "_m_over")]:
            path = self.dir / f"model_{name}_latest.joblib"
            if not path.exists():
                raise FileNotFoundError(f"Falta artefacto {path}. Corre `python -m scripts.train_models`.")
            artifact = joblib.load(path)
            setattr(self, attr, artifact["pipeline"])
            self._features = artifact["feature_columns"]
            if isinstance(artifact, dict) and "version" in artifact:
                versions.append(artifact["version"])
        self._version = versions[0] if versions else "v1.0"
        logger.info(f"Modelos cargados (versión: {self._version}).")

    def predict(self, features: dict[str, float]) -> MatchPrediction:
        if self._m_1x2 is None:
            self.load()
        X = np.array([[features[c] for c in self._features]])
        p_1x2 = self._m_1x2.predict_proba(X)[0]
        p_btts_yes = float(self._m_btts.predict_proba(X)[0, 1])
        p_over = float(self._m_over.predict_proba(X)[0, 1])
        return MatchPrediction(
            p_home=float(p_1x2[0]),
            p_draw=float(p_1x2[1]),
            p_away=float(p_1x2[2]),
            p_btts_yes=p_btts_yes,
            p_btts_no=1.0 - p_btts_yes,
            p_over_25=p_over,
            p_under_25=1.0 - p_over,
            model_version=self._version,
        )
