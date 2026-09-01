"""Entry point FastAPI. Levanta la API + sirve el dashboard estático."""
from __future__ import annotations

import os
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

# FAIL CLOSED (remediación PRE-F00): sin wildcard CORS. Orígenes propios vía
# ALLOWED_ORIGINS (CSV); default = dev local. Si no coincide origen → el browser
# bloquea (fail closed), no se abre la API a cualquier web.
_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()] or [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
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
