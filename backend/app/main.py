"""Entry point FastAPI. Levanta la API + sirve el dashboard estático."""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from backend.app.api import (routes_ai_analysis, routes_backtest, routes_bets,
                              routes_dashboard, routes_manual,
                              routes_predictions)
from backend.app.config import settings
from backend.app.core.database import init_db
from backend.app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Tipster IA arrancando en modo {settings.environment}")
    init_db()
    yield


app = FastAPI(
    title="Tipster IA",
    description="Sistema de apuestas deportivas con IA — value betting + Kelly + risk management",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_predictions.router)
app.include_router(routes_bets.router)
app.include_router(routes_dashboard.router)
app.include_router(routes_backtest.router)
app.include_router(routes_manual.router)
app.include_router(routes_ai_analysis.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# Dashboard estático
_frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
if _frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_frontend_dir)), name="static")

    @app.get("/", response_class=HTMLResponse)
    def root():
        index = _frontend_dir / "index.html"
        if index.exists():
            return index.read_text(encoding="utf-8")
        return "<h1>Tipster IA — visita /docs</h1>"
