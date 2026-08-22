"""Configuración SQLAlchemy. Soporta SQLite (dev) y Postgres (prod)."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.app.config import settings


class Base(DeclarativeBase):
    """Base declarativa para todos los modelos ORM."""


# SQLite necesita check_same_thread=False para FastAPI; Postgres lo ignora.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    """Crea todas las tablas. En prod usar Alembic en su lugar."""
    # Importar modelos para registrarlos en Base.metadata
    from backend.app.models import bet, match, odds, prediction, team_stats, model_version  # noqa: F401

    Base.metadata.create_all(bind=engine)


@contextmanager
def session_scope() -> Iterator[Session]:
    """Context manager para sesiones con commit/rollback automático."""
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def get_session() -> Iterator[Session]:
    """Dependencia FastAPI."""
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()
