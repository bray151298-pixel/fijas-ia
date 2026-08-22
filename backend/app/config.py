"""Configuración global del sistema. Lee de variables de entorno / .env."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", protected_namespaces=()
    )

    # Datos
    api_football_key: str = ""
    api_football_host: str = "api-football-v1.p.rapidapi.com"

    # Base de datos
    database_url: str = "sqlite:///./tipster.db"

    # Banca y gestión de riesgo
    initial_bankroll: float = 1000.0
    kelly_fraction: float = 0.25
    max_stake_pct: float = 0.02
    min_probability: float = 0.60
    min_expected_value: float = 0.05
    daily_stop_loss_pct: float = 0.05
    drawdown_threshold_pct: float = 0.20
    min_odd: float = 1.40
    max_odd: float = 8.00

    # IA (análisis con LLM — opcional)
    # Opción 1: Anthropic Claude (paid, ~$0.05/análisis, mejor calidad)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5"
    # Opción 2: Google Gemini (FREE, 1500 análisis/día, sin tarjeta)
    google_api_key: str = ""
    google_model: str = "gemini-3.6-flash"
    # Opción 3: OmniRoute / Proxy OpenAI compatible (localhost:20128)
    omniroute_base_url: str = "http://localhost:20128/v1"
    omniroute_api_key: str = ""
    omniroute_model: str = "deepseek-chat"
    # Provider preferido: "auto" | "omniroute" | "anthropic" | "gemini"
    ai_provider: str = "auto"

    # Alertas
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # Operación
    environment: str = "development"
    log_level: str = "INFO"
    model_artifacts_dir: str = "backend/app/ml/artifacts"

    @property
    def artifacts_path(self) -> Path:
        p = Path(self.model_artifacts_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
