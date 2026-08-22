# Tipster IA — Sistema de Apuestas Deportivas con Inteligencia Artificial

> Sistema "tipster inteligente" de extremo a extremo: ingesta de datos de fútbol,
> modelos predictivos calibrados, detección de value bets (EV+),
> gestión de riesgo con Kelly fraccional, backtesting, alertas y dashboard.

## TL;DR — Cómo correrlo en 5 pasos

```bash
# 1. Crear venv e instalar dependencias
python -m venv .venv && source .venv/bin/activate   # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt

# 2. Configurar variables de entorno
cp .env.example .env
# (Edita .env y pon tu API_FOOTBALL_KEY si la tienes; el sistema funciona también con datos sintéticos)

# 3. Generar dataset sintético, sembrar DB y entrenar los 3 modelos
python -m scripts.seed_data
python -m scripts.train_models

# 4. Correr un backtest (12 meses, banca inicial 1000)
python -m scripts.run_backtest

# 5. Levantar la API
uvicorn backend.app.main:app --reload --port 8000
# Visita http://localhost:8000/docs
```

## ¿Qué hace este sistema?

1. **Ingiere** partidos, alineaciones, lesiones y odds (API-Football + adaptador genérico).
2. **Calcula features** (forma reciente, ELO, xG implícito, fortaleza local/visitante,
   H2H, valor de plantilla afectada por lesiones).
3. **Predice** con modelos XGBoost calibrados:
   - Resultado 1X2
   - Both Teams To Score (BTTS)
   - Over/Under 2.5 goles
   - (Extensible a Handicap Asiático)
4. **Detecta value bets** comparando `p_modelo` contra la `p_implícita` de la cuota
   (descontando el margen del bookmaker / "vig").
5. **Decide** si recomendar la apuesta (umbral de probabilidad y EV configurables).
6. **Calcula stake** con **Kelly fraccional** + límites de exposición + drawdown guard.
7. **Emite alertas** (Telegram opcional) y expone una **API REST** para el dashboard.
8. **Aprende continuamente**: cada apuesta resuelta se guarda; el reentrenamiento
   automático recalibra los modelos cuando se acumulan N nuevos resultados.

## Arquitectura

Ver [`ARCHITECTURE.md`](ARCHITECTURE.md) para el diseño detallado, diagramas de flujo
y decisiones técnicas.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Fuentes de datos: API-Football, The Odds API, scraping (opcional)        │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Adaptadores (services/data_provider.py, services/odds_aggregator.py)     │
│  · Rate-limit, retries con backoff, cache local, normalización           │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Persistencia (PostgreSQL en prod / SQLite en dev) + Feature Store        │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Feature Engineering → Modelos ML (XGBoost calibrado) → Probabilidades    │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Value Detector (devigging) → Decision Engine → Risk Manager (Kelly)      │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ API FastAPI · Alertas Telegram · Dashboard · Backtesting · Retraining    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Estructura del repositorio

```
tipster/
├── backend/app/
│   ├── main.py                     # FastAPI entry point
│   ├── config.py                   # Settings (pydantic-settings)
│   ├── api/                        # Endpoints REST
│   ├── core/                       # database.py, logging
│   ├── models/                     # SQLAlchemy ORM
│   ├── schemas/                    # Pydantic DTOs
│   ├── services/                   # data_provider, odds_aggregator, features
│   ├── ml/                         # train, predict, value_detector, kelly
│   ├── tipster/                    # decision_engine, risk_manager, ranker
│   ├── alerts/                     # telegram
│   └── backtesting/                # simulator
├── data/                           # CSVs (sintético + real)
├── scripts/                        # seed_data, train_models, run_backtest
├── tests/                          # pytest
├── notebooks/                      # análisis de un partido (ejemplo)
├── frontend/                       # Dashboard mínimo HTML+JS (extensible a React)
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Despliegue paso a paso

### Local (desarrollo)

```bash
pip install -r requirements.txt
python -m scripts.seed_data && python -m scripts.train_models
uvicorn backend.app.main:app --reload
```

### Docker

```bash
docker compose up --build
# Postgres + API + worker de retraining se levantan juntos
```

### Producción

1. Provisiona Postgres administrado (RDS, Supabase, Neon).
2. Define secretos: `API_FOOTBALL_KEY`, `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`.
3. Despliega `Dockerfile` en Fly.io, Render, Railway o ECS.
4. Programa el `retrain_scheduler` como cron (diario / semanal).
5. Configura monitoring: Sentry para errores, Prometheus + Grafana para ROI/winrate.

## Gestión de riesgo (lo más importante)

Ver [`ARCHITECTURE.md#gestión-de-riesgo`](ARCHITECTURE.md#gestión-de-riesgo). Reglas duras:

- **Kelly fraccional** (0.25× por defecto). Kelly puro es muy volátil.
- **Stake máximo absoluto**: 2% de la banca por apuesta.
- **Stop-loss diario**: si pierdes >5% en un día, deja de apostar hasta el día siguiente.
- **Drawdown guard**: si la banca cae >20% del peak, reduce tamaño de stakes a la mitad.
- **EV mínimo**: solo se recomienda si EV ≥ 5%.
- **Probabilidad mínima**: configurable (default 60%; el prompt pide >70%).
- **Calibración**: los modelos se calibran (Isotónica) antes de usarse en producción —
  un modelo "preciso" pero descalibrado es peor que inútil para apuestas.
- **No martingala. No recuperar pérdidas con stakes más altos.**

## Avisos legales

Este software es para fines educativos y de investigación. Apostar dinero real
implica riesgo de pérdida total. Verifica la legalidad en tu jurisdicción.
Ningún modelo garantiza ganancias.
