"""Configuración centralizada de logging via loguru."""
from __future__ import annotations

import sys

from backend.app.config import settings

try:
    from loguru import logger

    def configure_logging() -> None:
        logger.remove()
        logger.add(
            sys.stderr,
            level=settings.log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                   "<level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
                   "<level>{message}</level>",
        )

    configure_logging()
except ImportError:
    import logging
    logging.basicConfig(level=getattr(logging, settings.log_level, logging.INFO))
    logger = logging.getLogger("fijas_ia")

    def configure_logging() -> None:
        pass

__all__ = ["logger", "configure_logging"]
