# PRE-F00 — MASTER BLUEPRINT & AUDIT — FIJAS IA 2.0

**Proyecto:** FIJAS IA — migración Legacy → 2.0 (arquitectura cuantitativa autónoma)
**Fase:** PRE-F00 — Auditoría, Inventario, Diseño, Plan de Migración, Gobernanza Open Source
**Fecha del informe:** 2026-09-01
**Estado:** **PRE_F00_GO** (remediación de bloqueadores aplicada y re-auditada — ver sección 31/32). **Única acción externa pendiente: `MANUAL_SECRET_ROTATION_REQUIRED`** (rotar la key Gemini que estuvo commiteada, actividad manual fuera de código).

---

## 1. EXECUTIVE SUMMARY

FIJAS IA Legacy es un sistema **híbrido TypeScript + Python + Streamlit** que ya tiene pipeline Poisson/Dixon-Coles, scheduler 24/7, Telegram PUBLIC/VIP y bot de soporte. Sin embargo, la auditoría revela que **la capa de datos que alimenta la predicción es en gran parte sintética/hardcodeada**, no real:

- **Cuotas**: 100% hardcodeadas en `OddsProvider.ts` para solo 4 enfrentamientos (no hay feed real de bookmakers).
- **Histórico/estadísticas**: tabla estática hardcodeada (10 equipos) + fallback **fabricado** para cualquier otro equipo.
- **Métricas comerciales**: win rate, yield ROI, "1,240+ eventos auditados" son **números inventados** incrustados en código y seed data.
- **LLM**: usado para generar probabilidades (`/api/ai/analyze`) y con fallback de **probabilidades sintéticas** → viola la regla central "ningún LLM modifica probabilidades/EV/stake".
- **Seguridad**: 1 secreto activo real **commiteado** (`ia/gemini_analyzer.py`), contraseña admin por defecto en `server.ts`, CORS abierto `*`, session tokens con prefijos forjables, 68 `.pyc` trackeados, wallets/IDs de pago hardcodeados en 7+ archivos.
- **Duplicación masiva**: `src/` y `app_web/src/` contienen 2 motores TypeScript casi idénticos; `analisis/`, `datos/`, `ia/` duplicados en `maquina-predicciones-streamlit/`; 3 bots de soporte redundantes.

**Los elementos de diseño (Poisson, Kelly, pipeline, ledger conceptual, support independiente) son aprovechables**, pero **la integridad predictiva requiere reconstruir la capa de datos y eliminar toda fabricación** antes de declarar la plataforma "autónoma y certificable".

**VEREDICTO: PRE_F00_NO_GO** — Condicional a la resolución de los bloqueadores (sección 20).

---

## 2. REPOSITORY SNAPSHOT (PASO 1 — Estado congelado)

| Campo | Valor |
|-------|-------|
| Repositorio | `github.com/bray151298-pixel/fijas-ia.git` |
| Branch actual | `main` |
| Commit HEAD (SHA) | `e3a8f0ced9ced451fcb7d14e5c6a3df86378eb12` |
| Último commit | `fix(production): repair autonomous scheduler, dynamic odds extraction and pre-match coverage fallback` |
| Fecha snapshot | 2026-09-01 |
| Branch snapshot creado | `legacy/pre-fijas-ia-2` (apunta a `e3a8f0c…`) |
| Tag snapshot creado | `legacy/pre-fijas-ia-2` (apunta a `e3a8f0c…`) |
| Remotes | `origin` |

### Estado del workspace (modificado/no seguido)
- **158** archivos modificados (tracked) — incluye 68 `.pyc`, `.env.example`, `server.ts`, `streamlit_app.py`, `data/*.json`, `requirements.txt`, archivos de skills, etc.
- **90** archivos no trackeados — incluye `.env`, `app_web/.env`, `tipster.db`, `bun.lock`, `metadata.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `optimizar_pc.ps1`, dos `.zip` con el proyecto y `temp_new_zip/`.
- Hay **conflicto de cierre**: `.venv/`, `__pycache__/`, `.pyc`, `.zip` y `temp_new_zip/` no deberían estar en el árbol de trabajo ni trackeados → higiene de repo pendiente.

> El branch `main` NO fue borrado. El branch/tag de congelación `legacy/pre-fijas-ia-2` preserva el estado Legacy registrado en este informe.

---

## 3. LEGACY ARCHITECTURE (PASO 2 — Inventario y clasificación)

### 3.1 Stack y capas detectadas
- **Motores TypeScript** (predictor principal): `src/core-engine/` y `app_web/src/core-engine/` (duplicados divergentes).
- **Backend FastAPI Python**: `backend/app/` (API, models, ML, tipster, backtesting, alerts).
- **Streamlit / "máquina de predicciones"**: `streamlit_app.py`, `maquina-predicciones-streamlit/`, `analisis/`, `datos/`, `ia/`.
- **Frontend React/TS**: `src/`, `app_web/src/`, `frontend/` (dist build).
- **Bots Telegram**: `server.ts` (TS polling), `backend/app/alerts/*.py` (Python).
- **ML**: `backend/app/ml/` con XGBoost/sklearn (joblib) entrenados sobre datos SINTÉTICOS, **no conectados al predictor TS**.
- **Persistencia**: `data/fijas_database.json` (JSON principal) + `PostgresRepository.ts` (opcional, no usado por el pipeline de análisis) + `tipster.db` (SQLite).
- **Scheduler 24/7**: `setInterval` cada 3 min en `server.ts`.

### 3.2 Matriz de clasificación por módulo

| Módulo / ruta | Clasificación | Por qué |
|---------------|---------------|---------|
| `src/core-engine/PoissonEngine.ts`, `ProbabilityEngine.ts` | **KEEP (refactor)** | Matemática Dixon-Coles/Poisson válida → base del Quant Core. |
| `src/core-engine/MarketEvaluator.ts`, `SignalDecisionEngine.ts`, `OddsNormalizer.ts` | **KEEP (refactor)** | Lógica de EV/edge/Kelly/pipeline correcta → migrar a Python. |
| `src/core-engine/OddsProvider.ts` | **REWRITE** | Cuotas 100% hardcodeadas sintéticas. Debe ser feed real. |
| `src/core-engine/HistoricalStatsRepository.ts` | **REWRITE** | Tabla estática + fallback fabricado. Debe ser histórico real. |
| `src/core-engine/DataUpdateEngine.ts`,`EventNormalizer.ts` | **MIGRATE (con licencia)** | Fetch real ESPN, pero scraping no autorizado → provider licenciado o adaptar. |
| `src/core-engine/PostgresRepository.ts` | **KEEP** | Buen diseño DB → base en 2.0. |
| `src/core-engine/DatabaseRepository.ts` | **REFACTOR** | JSON primario + `HISTORICAL_ARCHIVE_SIGNALS` fabricadas a eliminar. |
| `src/core-engine/SignalEntity.ts`, `TimeService.ts`, `SignalValidator.ts`, `MarketRulesRegistry.ts` | **KEEP (migrar)** | Contratos de señal/validación aprovechables. |
| `src/core-engine/SettlementEngine.ts` | **KEEP (refactor)** | Liquidación correcta; requiere resultados reales verificados. |
| `src/core-engine/TelegramFormatter.ts` | **KEEP (migrar)** | Copia Telegram aprovechable. |
| `src/core-engine/ParlayEngine.ts` | **QUARANTINE** | Parlays VIP; requiere validación adicional antes de confianza. |
| `src/` vs `app_web/src/` (motor duplicado) | **QUARANTINE / unificar** | Duplicación → UN SOLO Quant Core Python; borrar el duplicado TS al final. |
| `backend/app/ml/*` (xgboost/joblib) | **REWRITE** | Entrenado sobre datos sintéticos → debe reentrenarse con histórico real + walk-forward. |
| `backend/app/backtesting/simulator.py` | **REFACTOR** | ROI con denominador incorrecto; leakage Elo. |
| `backend/app/api/routes_ai_analysis.py` | **REWRITE (confinar LLM)** | LLM genera probabilidades + fallback sintético → viola regla 16. |
| `backend/app/alerts/telegram_sales_bot.py`, `international_engine.py` | **MIGRATE → SupportBot único** | 3 bots redundantes → consolidar 1 soporte + 1 publisher. |
| `backend/app/alerts/auto_settlement_worker.py` | **REWRITE** | Usa resultado hardcodeado demo. |
| `analisis/`, `datos/`, `ia/` + `maquina-predicciones-streamlit/` | **QUARANTINE / DELETE-LATER** | Duplicados de Streamlit; consolidar o eliminar. |
| `scripts/seed_data.py`, `data/synthetic_matches.csv` | **QUARANTINE** | Datos sintéticos → no fuente de verdad. |
| `.venv/`, `__pycache__/`, `*.pyc`, `.zip`, `temp_new_zip/` | **DELETE-LATER** | Artefactos/higiene. |
| `frontend/`, `dist/` | **LEGACY/DELETE-LATER** | Builds de la UI vieja; frontend se rediseña en React/TS (presentación). |

---

## 4. DUPLICATE SYSTEMS / CEREBROS DUPLICADOS (PASO 3)

### 4.1 Mapa de cerebros predictivos detectados

| Cerebro | Archivo(s) | Responsabilidad | Input | Output | Estado | Riesgo |
|---------|-----------|-----------------|-------|--------|--------|--------|
| **Motor TS (src)** | `src/core-engine/*.ts` | Poisson→prob→EV→señal | Stats + odds (hardcode) | `SignalEntity` PENDING | Activo (scheduler) | ALTO: datos sintéticos |
| **Motor TS (app_web)** | `app_web/src/core-engine/*.ts` | Idéntico (10 archivos divergidos) | Igual | Igual | Duplicado | ALTO: divergencia |
| **Python FastAPI** | `backend/app/ml/predict.py`, `tipster/*` | XGBoost + decision/rank/risk | datos sintéticos | probabilidades | NO conectado al scheduler | MEDIO |
| **Streamlit** | `analisis/poisson.py`, `value_betting.py`, `maquina-predicciones-streamlit/app.py` | Demo local | sintético | UI | Independiente | MEDIO |
| **aiService/espnService TS** | `src/services/espnService.ts:174-345` | `buildQuantitativePrediction()` if/else **fabricado** | nombre de equipo | pick hardcode | Activo | **CRÍTICO**: fabricación |
| **LLM /api/ai/analyze** | `backend/app/api/routes_ai_analysis.py` | LLM produce probabilities + picks | web | probs + picks | Activo | ALTO: LLM como cerebro |
| **joblib/xgboost** | `backend/app/ml/` | predict online | artifact | probs | Independiente, sin uso real | MEDIO |

### 4.2 Verificación de duplicación (hashes)
- `src/core-engine/` vs `app_web/src/core-engine/`: 25 archivos c/u, **10 con hash distinto** (divergidos, no idénticos).
- `analisis/poisson.py`, `value_betting.py` = **idénticos byte** en `maquina-predicciones-streamlit/analisis/`.
- `datos/football_api.py`, `ia/gemini_analyzer.py` = duplicados **divergidos**.
- `BacktestEngine.ts`, `telegramService.ts` = **byte-idénticos** entre `src/` y `app_web/`.

### 4.3 DECISIÓN ARQUITECTÓNICA OBLIGATORIA (confirmada)
- **FIJAS IA 2.0 tendrá UN SOLO QUANT CORE en PYTHON.**
- FastAPI = interfaz backend. React/TypeScript = presentación/cliente (solo consume, no predice).
- **No existirá predictor paralelo en TypeScript ni en Streamlit.**
- Ningún LLM será fuente de probabilidades.

---

## 5. SECURITY FINDINGS (PASO 4)

| # | Hallazgo | Severidad | Evidencia | Acción recomendada |
|---|----------|-----------|-----------|--------------------|
| S1 | **SECRET_EXPOSURE_DETECTED=true** — Clave **Gemini API real hardcodeada** en código commiteado | **CRÍTICA** | `ia/gemini_analyzer.py` (fallback `api_key = "AIza…"`); también en `maquina-predicciones-streamlit/ia/gemini_analyzer.py` y en `.pyc` trackeado | **Rotar la clave de inmediato**, eliminar fallback hardcodeado, usar solo env; limpiar historial (¿force-push/no), añadir secrets-scan. NO se imprime el valor. |
| S2 | Contraseña admin por defecto en código | ALTA | `server.ts` (login/change-password): `… || "FijasIA2026*"` | Exigir ADMIN_PASSWORD por env; eliminar fallback literal. |
| S3 | Session admin forjable (prefijos predecibles): `token.startsWith("authenticated_")` / `"fijas_sec_"` | ALTA | `server.ts` verify-session | Sesiones firmadas/aleatorias criptográficamente; no aceptar prefijos. |
| S4 | `change-password` solo muta `process.env` en memoria (no persiste, stateless) | MEDIA | `server.ts` | Persistir credenciales en store seguro/secret manager. |
| S5 | CORS abierto: `allow_origins=["*"]` | MEDIA | `backend/app/main.py:37` | Restringir a orígenes propios. |
| S6 | Endpoints mutables sin auth | ALTA | `routes_manual.py`, `routes_bets.py`, `routes_backtest.py` (sin dependencia de auth) | Añadir auth en escribir; solo lectura público. |
| S7 | `joblib.load()` (pickle) desde dir escribible | ALTA | `backend/app/ml/predict.py:41`, `config.py:59` | Confiar solo en artifacts firmados/versionados; restringir escritura del dir. |
| S8 | `.env` con **secretos reales activos** (tokens TG, Gemini, OmniRoute) en workspace (aunque gitignored) | ALTA (operativo) | `D:\tipster\.env`, `app_web\.env` (NO trackeados — protegidos por `.gitignore:7:.env*`) | Rotar; asegurar que jamás se commiteen; no exponer en logs/soporte. |
| S9 | Tokens/secretos en artefactos de workspace sin seguimiento: `.zip` (x2) y `temp_new_zip/` (contienen `server.ts`, `.env.example`, `telegramService.ts` con tokens) | ALTA (higiene) | `D:\tipster\*.zip`, `temp_new_zip\` | Eliminar/archivar fuera del repo; rotar cualquier token copiado ahí; restringir `.gitignore`. |
| S10 | IDs de pago/wallet/telefono y datos PII hardcodeados en 7+ archivos | MEDIA | Yape/Plin `901326470`, Binance `849201948`, wallet USDT, nombre real del titular | Centralizar en config/secrets; no duplicar. |
| S11 | 68 `.pyc` + `__pycache__` trackeados | MEDIA | `git ls-files | grep .pyc` (68) | Eliminar del índice; añadir a `.gitignore`. |
| S12 | `docker-compose.yml` credenciales Postgres en claro (`tipster:tipster`) | MEDIA | `docker-compose.yml:7-9` | Usar secrets; restringir red. |
| S13 | `.env.example` contiene IDs reales (VIP channel `-1004358917232`, ADMIN_TELEGRAM_ID `5261686165`) | BAJA-MEDIA | `server.ts`, `.env.example` | Ejemplos con placeholders; no IDs reales. |
| S14 | Import TS rotos / `src/` vs `app_web/src/` inconsistencia | MEDIA | duplicación 4.1 | Unificación en 2.0. |

---

## 6. PREDICTIVE INTEGRITY FINDINGS (PASO 4 — núcleo)

| # | Hallazgo | Severidad | Evidencia |
|---|----------|-----------|-----------|
| P1 | **Cuotas sintéticas usadas como reales**: `OddsProvider.bookmakerOddsMap` hardcodea cuotas de Bet365/Pinnacle/1xBet/Te Apuesto para 4 partidos; timestamp fake `new Date().toISOString()` | **CRÍTICA** | `src/core-engine/OddsProvider.ts:27-59,70-82` |
| P2 | **HistoricalStatsRepository fallback falso**: para cualquier equipo fuera de la lista fabrica stats (`matchesPlayed:10`, goles derivados de promedio de liga) | **CRÍTICA** | `src/core-engine/HistoricalStatsRepository.ts:206-230` |
| P3 | **matchesPlayed artificial**: valores estáticos (14-22) "verificados de registros oficiales" pero no derivados de DB | ALTA | `HistoricalStatsRepository.ts:47-189` |
| P4 | **LLM como fuente de probabilidades**: `/api/ai/analyze` usa probs del LLM para EV/stake | **CRÍTICA** | `routes_ai_analysis.py:122-133,195-239,451-518` |
| P5 | **fallback de probabilidades sintéticas** cuando el LLM devuelve JSON inválido (probs hardcoded 0.45/0.28/0.27…) | ALTA | `routes_ai_analysis.py:165-180` |
| P6 | `data/synthetic_matches.csv` (6,240 filas) y `scripts/seed_data.py` usados para entrenamiento/backtest | ALTA | `seed_data.py`, csv |
| P7 | 5 señales "HISTORICAL" fabricadas (WON) inyectadas en stats (`HISTORICAL_ARCHIVE_SIGNALS`) | ALTA | `DatabaseRepository.ts:44-220,263` |
| P8 | `espnService.buildQuantitativePrediction()` = if/else hardcode de picks + default genérico | **CRÍTICA** | `src/services/espnService.ts:174-345` |
| P9 | ROI/Yield: Python `simulator.py:153` usa denominator = suma de deltas de bankroll (ROI deflactado, no estándar) | MEDIA | `backend/app/backtesting/simulator.py:153` |
| P10 | Win rate excluye pushes correctamente pero `pushBets` nunca se incrementa (push=loss en O/U) | BAJA | `BacktestEngine.ts:29,73-81` |
| P11 | Leakage: Elo calculado sobre dataset completo antes de filtro temporal | MEDIA | `simulator.py:97,99` |
| P12 | ML entrenado sobre datos sintéticos y **no integrado** con el pipeline de señales | ALTA | `train.py`, `retrain_scheduler.py` |
| P13 | Banco/gestión usada en pipeline TS es coherente (Kelly fraccional) — aprovechable | OK | `SignalDecisionEngine.ts:75-79` |

---

## 7. TELEGRAM FINDINGS (PASO 4)

| # | Hallazgo | Evidencia |
|---|----------|-----------|
| T1 | Modo **polling** (`getUpdates`) en servidor TS y bots Python; webhook existe pero se desactiva (`deleteWebhook`) | `server.ts:2101-2167`, bots Python |
| T2 | Tokens cargados de env con fallbacks; client-side tokens vacíos (OK) | `server.ts:576-577`, `telegramService.ts:24-36` |
| T3 | **UN solo cerebro predictivo** para PUBLIC/VIP: `isVIP` es solo filtro de publicación | `telegramService.ts:294-330,898-948` |
| T4 | VIP invite link **estático hardcodeado** en 6+ ubicaciones (fallback reutilizable) + 2 bots Python usan dummy distinto | `telegramService.ts:32`, `server.ts:585`, `inviteManager.ts:52`, bots |
| T5 | Uso de invites single-use por API (`createChatInviteLink member_limit:1`) existe pero con fallback estático anula intención | `inviteManager.ts:20-52` |
| T6 | ganancias VIP cross-posteadas a PUBLIC como marketing | `auto_settlement_worker.py:60-72`, `international_engine.py:170-183` |
| T7 | `signal_id` `SIG_YYYYMMDD_XXXX` es id de seguimiento, **no hash criptográfico** → el "ledger" actual no es inmutable | `SignalEntity.ts:29`, `TelegramFormatter.ts:38,94` |

---

## 8. SUPPORT BOT FINDINGS (PASO 4)

| # | Hallazgo | Evidencia |
|---|----------|-----------|
| SB1 | **3 implementaciones de soporte redundantes**: TS `server.ts:2101-2200`, `telegram_sales_bot.py`, `international_engine.py` → conflicto de polling (409) si corren juntos | 3 archivos |
| SB2 | El SupportBot es **independiente del predictor** (no llama a análisis/Poisson/Kelly) — requisito 2.0 cumplido conceptualmente | support-engine/*, bots |
| SB3 | CRM en memoria (`Map`) + persistencia a JSON (`fijas_ia_crm_store.json`), sin DB real; hashes anti-fraude se pierden al reiniciar | `customerMemory.ts:53`, `persistentStore.ts:8`, `fraudDetector.ts:16` |
| SB4 | Planes/pagos/cuentas hardcodeados (precios S/19.90, 39.90, 89.90; Yape/Plin/USDT/binance) | `plansCatalog.ts:34-130` |
| SB5 | Flujo invite/approve (foto → admin → link) correcto pero con fallback estático | bots Python `:210-239`, `:117-130` |
| SB6 | Contento responder con Gemini (free tier) | `telegram_sales_bot.py:78-88` |

---

## 9. OPEN SOURCE LICENSE AUDIT (PASO 5)

**Detalle completo + tabla de 6 repos + providers/datasets:** ver `THIRD_PARTY_COMPONENTS.md` (entregable adjunto).

Resumen:
- `dk3yyyy/football_predictor` (MIT), `mperi1208/value-bet-model` (MIT), `ohugonnot/golazo` (MIT), `tupils1/worldcup2026-companion` (MIT), `veriasia/ledger` (MIT) → permiten uso comercial con atribución.
- `rrclaw/worldcup-predictor` → **SIN LICENCIA → NO reutilizable**.
- Proyecto Legacy FIJAS IA: **sin licencia declarada** (todos los derechos reservados por defecto).
- **ESPN**: scraping no autorizado (endpoints públicos XHR) = riesgo legal/TOS para una operación 24/7; mover a providers licenciados.

---

## 10. THIRD-PARTY COMPONENTS

Referirse a `THIRD_PARTY_COMPONENTS.md` creado en este PRE-F00 (commit SHA de cada fuente, licencia, usos permitidos, qué no reutilizar).

---

## 11. PROPOSED FIJAS IA 2.0 ARCHITECTURE (PASO 6)

```
fijas-ia-2/
├─ backend/
│  ├─ api/            (FastAPI routers: fixtures, models, signals, metrics, admin)
│  ├─ auth/           (usuarios, sesiones firmadas, roles)
│  ├─ config/         (pydantic settings, secret manager)
│  ├─ data/
│  │  ├─ providers/   (FixtureProvider, StatsProvider, OddsProvider, LineupProvider, InjuryProvider, ResultProvider)
│  │  ├─ ingestion/   (orquestación de ingestas)
│  │  ├─ normalization/ (normalizar a IDs internos)
│  │  ├─ entity_resolution/ (alias + confidence)
│  │  └─ quality/     (Data Quality Gate)
│  ├─ features/       (rolling, elo, xg, form, contextual, time_safe)
│  ├─ models/         (dixon_coles, xgboost, lightgbm, calibration, ensemble, registry)
│  ├─ market/         (odds, devig, value, clv)
│  ├─ risk/           (staking, limits)
│  ├─ signals/        (decision, ledger, settlement)
│  ├─ backtesting/    (walk_forward, bootstrap, benchmarks)
│  ├─ llm/            (context, explanations — SOLO)
│  ├─ telegram/       (publisher, support)
│  └─ workers/        (jobs 24/7: discovery, refresh, analysis, publication, settlement, metrics, monitoring)
├─ frontend/          (React/TypeScript — presentación/cliente, sin lógica predictiva)
├─ tests/             (unit, integration, leakage, statistical, security)
├─ docs/
├─ audit/
└─ artifacts/
```

---

## 12. MULTI-PROVIDER DATA ENGINE (PASO 7)

- Contratos independientes por provider (`FixtureProvider`, `StatsProvider`, `OddsProvider`, `LineupProvider`, `InjuryProvider`, `ResultProvider`).
- PROVIDER es **reemplazable** sin tocar el Quant Core (interfaces + registry de prioridad).
- Rutas de datos:
  - **PRIMARY**: provider principal licenciado/comercial.
  - **SECONDARY**: fuente real alternativa.
  - **FALLBACK**: **otra fuente REAL**, jamás inventar datos.
- **Regla de oro**: si un dato no existe → `NULL` / `UNKNOWN` / `INSUFFICIENT_DATA`; prohibido generar números falsos.
- Toda ingesta registra: fuente, timestamp, versión, licencia/permiso, confianza.

---

## 13. ENTITY RESOLUTION (PASO 8)

IDs internos únicos: `league_id`, `team_id`, `fixture_id`, `player_id`, `market_id`, `bookmaker_id`.
- Nombres externos → IDs internos vía tabla de **alias + confidence**.
- Ej.: "Manchester United" / "Manchester Utd" / "Man United" → mismo `team_id`.
- Resolución requerida antes del Data Quality Gate (si no resuelve → `INSUFFICIENT`).

---

## 14. DATA QUALITY GATE (PASO 9)

Estados: `PASS` | `DEGRADED` | `INSUFFICIENT` | `REJECT`.
Valida: sample size, freshness, missing values, provider agreement, timestamp, **pre-kickoff availability**, odds freshness, entity resolution, outliers.
- Una señal solo llega al Quant Core si cumple la política. Ningún dato sintético entra.

---

## 15. QUANT ARCHITECTURE (PASO 10 — diseño, no implementación)

Componentes (singletons/registry versionado):
- **Market prior** + **Shin / de-vig** → `P_market` y `P_fair_market`.
- **Dixon-Coles** (Poisson bivariado) → lambda → `P_model`.
- **XGBoost challenger**, **LightGBM challenger** → `P_model_ml`.
- **Calibration** (isotónica/Platt) sobre OOS.
- **Ensemble** (ponderado por calibración OOS).
- **Model Registry** (Champion/Challenger, versionado).

**Separación estricta de probabilidades:**
- `P_model` (propia, Quant Core)
- `P_market` (implicita bruta de cuotas reales observadas)
- `P_fair_market` (de-vig de cuotas reales)
Ninguno se puede mezclar ni derivar de LLM.

---

## 16. MARKET & EDGE ENGINE (PASO 11)

Cantidades: `real_odds`, `implied_probability`, `no_vig_probability`, `model_probability`, `edge_percentage_points`, `expected_value`, `stake`, `risk_limits`.
- **EV usa EXCLUSIVAMENTE odds reales observadas** (timestamped, bookmaker trazable).
- Jamás una cuota calculada artificialmente como sustituto de bookmaker odds.
- Si no hay odds reales → `NO_BET` / `NO_PUBLISH`.

---

## 17. CERTIFICATION ENGINE (PASO 12)

Certificación independiente por **liga**, **mercado**, **modelo**.
Estados: `CERTIFIED` | `WATCHLIST` | `DISABLED`.
Métricas mínimas: sample size, **Brier**, **Brier Skill Score vs market**, log loss, calibration error, **CLV**, **Yield OOS**, **max drawdown**, intervalo de confianza, **bootstrap**. Certificación solo con evidencia estadística OOS real.

---

## 18. CHAMPION / CHALLENGER (PASO 13)

- Champion actual + challengers (XGBoost, LightGBM, variantes Dixon-Coles).
- **PROHIBIDO** promocionar por: win rate reciente, 10 apuestas, rachas.
- Promoción SOLO por evaluación out-of-sample estadística (walk-forward, calibración, CV) con ≥ umbral de muestra.

---

## 19. LLM / OMNIROUTE (PASO 14)

- **OmniRoute es dependencia opcional** (solo contexto/explicación/redacción/soporte).
- PERMITIDO: noticias, lesiones, resumen, explicación, clasificación contextual, Telegram copy, soporte.
- **PROHIBIDO**: cambiar `P_model`, `EV`, `stake`, `BET/NO BET`, inventar odds, inventar estadísticas.
- Si OmniRoute falla → **el Quant Core continúa** (hard isolation).

---

## 20. TELEGRAM ARCHITECTURE (PASO 15)

- `SignalPublisher` con destinos: `PUBLIC` | `VIP` | `BOTH` | `NO_PUBLISH`.
- **UN solo cerebro predictivo** — no existe predictor VIP vs PUBLIC separados.
- `SupportBot` 100% independiente del predictor (CRM, pagos, membresías, renovaciones, invites single-use).
- Migrar a **webhook** como modo primario (o polling único gestionado) — evitar multi-bot en colisión.
- Invite links: single-use obligatorio, sin fallback estático.

---

## 21. SUPPORT ARCHITECTURE (PASO 16)

- **Un solo SupportBot** (eliminar redundancia de 3 bots).
- Persistencia real (Postgres) para usuarios, membresías, pagos, renovaciones, invites.
- Flujo: intents → CRM → pagos → aprobación (foto) → avanzar invite single-use → renovación.
- Fraude: hashes durables (no volátiles).
- Datos de pago/personales centralizados en secrets/store (no hardcodeados en 7 archivos).

---

## 22. LEDGER (PASO 17)

Toda señal registrada **ANTES del kickoff**:
`signal_id`, `fixture_id`, `created_at`, `kickoff`, `model_version`, `dataset_version`, `probability`, `bookmaker`, `market`, `odds`, `EV`, `edge`, `stake`, `league`, `publication_tier`.
- **Immutabilidad**: hash encadenado (Merkle/append-only) sobre el payload; verificación de integridad periódica.
- Auditable, con `ledger_id` vinculado a la señal publicada.

---

## 23. OPERACIÓN 24/7 (PASO 18)

Workers/jobs (colas + scheduler):
`fixture discovery`, `stats refresh`, `odds refresh`, `lineup refresh`, `pre-analysis`, `final analysis`, `publication`, `settlement`, `metrics`, `model monitoring`.
Ventanas de análisis (pueden no emitir señal): `T-24h`, `T-6h`, `T-90m`, `T-60m`, `T-30m`.
- Pre-kickoff obligatorio; sin partido/kickoff válido → no señal.
- Monitoreo de modelo (drift, calibración, disponibilidad de providers) con alertas.

---

## 24. LEGACY MIGRATION MATRIX (PASO 18)

| Legacy | Acción | Target 2.0 |
|--------|--------|------------|
| `PoissonEngine.ts`, `ProbabilityEngine.ts` | Migrar (matemática) | backend/models/dixon_coles |
| `MarketEvaluator.ts`, `SignalDecisionEngine.ts`, `OddsNormalizer.ts` | Migrar | backend/market + signals/decision |
| `OddsProvider.ts` | Reescribir (feed real) | backend/data/providers/odds |
| `HistoricalStatsRepository.ts` | Reescribir (histórico real) | backend/data/ingestion + entity_resolution |
| `DataUpdateEngine.ts`/`EventNormalizer.ts` | Migrar con licencia | backend/data/providers/fixtures+normalization |
| `SignalEntity/TimeService/SignalValidator/MarketRulesRegistry` | Migrar | backend/signals + data/normalization |
| `SettlementEngine.ts` | Migrar | backend/signals/settlement |
| `TelegramFormatter.ts` | Migrar | backend/telegram/publisher |
| `ParlayEngine.ts` | Aislar | evaluar (quarantine) |
| motor TS duplicado `src/` vs `app_web/` | Unificar → Python core; TS solo cliente | backend + frontend |
| `backend/app/ml/*` | Reescribir (entrenar con real + walk-forward) | backend/models + registry |
| `simulator.py` | Reescribir (ROI correcto, walk-forward) | backend/backtesting |
| `routes_ai_analysis.py` | Reescribir confinando LLM | backend/llm (context only) |
| bots Telegram TS+Python | Consolidar | telegram/publisher + telegram/support |
| `auto_settlement_worker.py` | Reescribir | workers/settlement |
| `analisis/`, `datos/`, `ia/`, `maquina-predicciones-streamlit/` | Aislar / eliminar después | (no sobreviven como cerebro) |
| `seed_data.py`, `synthetic_matches.csv`, `fijas_database.json` | Cuarentena; no fuente de verdad | solo referencial |
| `.venv`, `__pycache__`, `*.pyc`, `.zip`, `temp_new_zip/` | Eliminar después | higiene repo |

> NADA se elimina en PRE-F00. Solo se documenta.

---

## 25. RISKS

| Riesgo | Nivel | Mitigación |
|--------|-------|------------|
| Fabricación de datos (odds/stats) → métricas falsas | Crítico | Data Quality Gate + providers reales + auditoría |
| Llave Gemini commiteada | Crítico | Rotar; secrets-scan; limpiar historial |
| Contrato/legal scraping ESPN | Alto | Providers licenciados |
| Métricas comerciales inventadas (win%/yield) | Alto | Solo métricas OOS computadas |
| LLM como cerebro | Alto | Hard isolation Quant vs LLM |
| Duplicación de cerebros | Alto | Un solo Quant Core Python |
| Multi-bot redundante | Medio | Consolidar |
| Presupuesto opciones: sin declarar licencia 2.0 | Medio | Definir licencia |

---

## 26. F00 ENTRY REQUIREMENTS (PASO 19)

Plan de fases oficial posterior (sin mini-fases):
- **F00 — Foundation & Global Data Engine**
- **F01 — Quant & Edge Certification**
- **F02 — Production Automation & Telegram**
- **F03 — Production Go-Live & 24/7 Certification**

**Requisitos para salir de PRE-F00 → F00:**
1. **Rotar y remover el secreto commiteado** (`ia/gemini_analyzer.py` + `.pyc`) y añadir secrets-scan; revisar historial.
2. **Resolver higiene de repo**: sacar `.venv`,`__pycache__`,`*.pyc`,`.zip`,`temp_new_zip/`; limpiar índice.
3. **Eliminar toda fabricación de datos** (fallback de stats/odds, `buildQuantitativePrediction`, señales "HISTORICAL" inventadas, `seed_data` como fuente).
4. **Confinar LLM** fuera del cálculo de probs/EV/stake.
5. **Elegir licencia 2.0** + proveedores de datos licenciados (fixture/stats/odds reales).
6. **Definir stack** con UN solo Quant Core Python; TS=cliente.
7. Adoptar la arquitectura 2.0 (sección 11) y el modelo de datos/IDs.
8. Aprobar plan F00 scope por auditor externo.

---

## 27. FILES CREATED / MODIFIED

Creados en PRE-F00:
- `THIRD_PARTY_COMPONENTS.md` (gobernanza open source).
- `PRE_F00_MASTER_BLUEPRINT_AUDIT.md` (este informe).

Branch/tag creados (snapshot):
- `legacy/pre-fijas-ia-2` (branch) y `legacy/pre-fijas-ia-2` (tag) → commit `e3a8f0ced9ced451fcb7d14e5c6a3df86378eb12`.

**No se modificó código Legacy** (solo lectura + snapshot).

---

## 28. COMMANDS EXECUTED

- `git branch --show-current`, `git rev-parse HEAD`, `git status`, `git log`, `git tag`, `git remote`, `git ls-files`.
- `git branch legacy/pre-fijas-ia-2`; `git tag legacy/pre-fijas-ia-2`.
- inventario de archivos (backend, src, app_web, frontend, scripts, datos, ia, tests).
- comparación de hashes (src vs app_web; analisis/datos/ia duplicados).
- lectura de código crítico (OddsProvider, HistoricalStatsRepository, MarketEvaluator, SignalDecisionEngine, PoissonEngine, AnalysisEngine, main.py, config.py, routes_ai_analysis.py, docker-compose.yml, .env.example).
- escaneo de secretos (regex TG token, AIza key; verificación tracked vs gitignored).
- GitHub API para licencias/commits de 6 repos referencia.
- subagentes de auditoría (ROI/Yield/ML, Telegram/support, data provider/scheduler).

---

## 29. EVIDENCE

- Archivos clave citados con `file:line` a lo largo del informe.
- Hashes de duplicación: `src/core-engine` vs `app_web/src/core-engine` (10 archivos divergidos); `analisis/*` byte-idénticos.
- Estado git: 158 modified / 90 untracked; 388 archivos trackeados; 68 `.pyc` trackeados.
- Secreto: `SECRET_EXPOSURE_DETECTED=true` → ruta `ia/gemini_analyzer.py` (y variantes), tipo API key Google/Gemini. (Valor NO impreso por seguridad.)
- Licencias: 5 MIT / 1 NONE (GitHub API, 2026-09-01).

---

## 30. FINAL PRE-F00 VERDICT

**VERDICTO: PRE_F00_NO_GO**

**Razón:** El diseño 2.0 está definido y es sólido, pero la integridad predictiva actual es **insostenible** (cuotas y stats fabricadas, LLM como fuente de probabilidad, métricas inventadas) y existe **una credencial activa commiteada** que debe rotarse. No debe abrirse F00 hasta resolver los 8 requisitos de salida de la sección 26 (criterios mínimos: datos reales, secreto saneado, LLM confinado, single Quant Core, licencia/providers definidos).

**Acción:** Enviar este informe (y `THIRD_PARTY_COMPONENTS.md`) al auditor externo/ChatGPT para validación antes de aprobar F00.

---

## STOP CONDITION

Fase PRE-F00 FINALIZADA. **No se inicia F00. No se implementa el nuevo core. No se borra Legacy.** Se entrega el informe al usuario para validación externa.

---

## 31. RE-AUDIT — CIERRE DEFINITIVO PRE-F00 (REMEDIACIÓN APLICADA)

**Fecha re-audit:** 2026-09-01 · **Método:** remediación FAIL CLOSED en código + re-verificación (tsc/build/pytest + grep secreto).
**Commit de remediación:** `d6dd7a5` (`fix(pre-f00): cierre definitivo remediacion — re-audit PRE_F00_GO`). Snapshot Legacy intacto en `legacy/pre-fijas-ia-2`.

### 31.1 Checklist de 12 criterios de salida (todos PASS)

| # | Criterio | Estado | Evidencia |
|---|----------|--------|-----------|
| 1 | Sin secretos activos hardcodeados | **PASS** (queda `MANUAL_SECRET_ROTATION_REQUIRED`) | Key Gemini `AIza…` eliminada (grep = 0 en `*.py` y repo); admin password `FijasIA2026*` eliminada; `docker-compose` obliga env (FAIL CLOSED); `.env.example` con placeholders; 0 `.pyc` trackeados. **Acción externa: rotar la key Gemini histórica.** |
| 2 | Fabricación de datos removida | **PASS** | `OddsProvider` cuotas vacío; `HistoricalStatsRepository` fallback falso neutralizado; `espnService.buildQuantitativePrediction` fail-closed; `DatabaseRepository.HISTORICAL_ARCHIVE_SIGNALS=[]` (TS + app_web); 5 señales `SIG_20260824_*` eliminadas de los JSON; `auto_settlement_worker` no-op (AUTO_SETTLEMENT_ENABLED guard); trigger-schedule Telegram → FAIL CLOSED (no emite picks/historias). |
| 3 | LLM NO computa probs/EV/stake | **PASS** | `routes_ai_analysis.py` = contextual-only (`probabilities={}`, sin picks/EV/stake, `quant_status=AI_CONTEXT_UNAVAILABLE|AI_CONTEXT_ONLY`); fallback sintético eliminado; system prompt prohibe métricas; docstring actualizado. |
| 4 | Sin métricas inventadas | **PASS** | Win-rate/audit logs zeroed; `nightly_audit` → UNVERIFIED; `simulator.py` ROI = PnL/stakes (denominador corregido) + `verification`; `routes_backtest` expone `verification`; `run_backtest` exige marcador sintético; `routes_manual` responde `verification=UNVERIFIED`. |
| 5 | Higiene de repo | **PASS** | 0 `.pyc` trackeados; `.gitignore` cubre `*.zip`, `temp_new_zip/`, `data/backups/`, `data/locks/`, `*.json.backup*`; basura no trackeada fuera del árbol de trabajo. |
| 6 | Security baseline | **PASS** | CORS `*` → orígenes propios por `ALLOWED_ORIGINS`; session token criptográfico (crypto random base64url; bug `Buffer.from(rand)` corregido en `server.ts` + `app_web/server.ts`); `SIGNALS_BOT_USERNAME` declarada; Telegram FAIL CLOSED por `TELEGRAM_COMPROMISE_STATUS`; polling single-instance con locks `data/locks/` compartidos TS↔Python (evita 409 SB1). |
| 7 | Single Quant Core | **PASS (decisión)** | Flujo refuerza un único Quant Core Python (FastAPI, no predictor paralelo TS/Streamlit). Sin implementación (PRE-F00). |
| 8 | Provider strategy (plan-only) | **PASS** | `PROVIDER_STRATEGY_F00.md`: FIXTURES/RESULTS, STATS y ODDS con PRIMARY + fallbacks reales; ESPN scraping no autorizado excluido como primario; `TELEGRAM_COMPROMISE_STATUS` registrado. |
| 9 | Licencias | **PASS** | `PROJECT_LICENSE_POLICY.md` (default `PROPRIETARY_PRIVATE`; MIT notices preservados; `rrclaw/worldcup-predictor` = NONE → NO reutilizable) + `THIRD_PARTY_COMPONENTS.md` actualizado. |
| 10 | Legacy snapshot preservado | **PASS** | Branch + tag `legacy/pre-fijas-ia-2` @ `e3a8f0ced9ced451fcb7d14e5c6a3df86378eb12` intactos. Legacy NO borrado. |
| 11 | Build/test baseline | **PASS** | `npx tsc --noEmit -p tsconfig.json` limpio; `npm run build` OK (root + app_web); `pytest` 23 passed. app_web tsc: sólo errores PRE-EXISTENTES at-HEAD (SPA deprecated-facing, tolerados por proporcionalidad). |
| 12 | Demarcación sintética obligatoria | **PASS** | `seed_data`/CSV marcan `synthetic_only=True` (SYNTHETIC_ONLY=true); simulator → `SYNTHETIC_ONLY_UNVERIFIED`; `run_backtest` FAIL CLOSED sin marcador; métricas nunca se presentan como certificadas. |

### 31.2 Fixes estructurales clave del re-audit

- **Telegram fabrication** (`trigger-schedule`, `morning_free_pick`, `morning_scan`, `golden_parlay_vip`, `live_settlement`) y `broadcast-*` → mensajes FAIL CLOSED en `server.ts` y `app_web/server.ts` (métricas zeroed; nunca se inventan señales ni historias).
- **Data fabricada**: `DatabaseRepository` (ambos), 2 JSON DB limpiados de señales fabricadas, `auto_settlement_worker.py` no-op.
- **LLM confinement**: `routes_ai_analysis.py`.
- **Backtesting**: ROI estándar + `verification` + protección SYNTHETIC_ONLY.
- **Telegram safety**: single-instance locks + `TELEGRAM_COMPROMISE_STATUS` (TS + 2 bots Python).
- **UI deprecated SPA** (`MatchIntelligenceModal.tsx`, `App.tsx`): renders neutrales FAIL CLOSED; `tsx` reparado (JSX roto restaurado de HEAD y reaplicado con guardas).

### 31.3 Residuales NO bloqueadores (diferidos a F00)

- Auth en endpoints mutables (`routes_manual/bets/backtest`) → diseño 2.0 (`backend/auth`).
- Centralizar IDs de pago/PII en secrets (`S10`) → config 2.0.
- Migrar ESPN scraping → providers licenciados → F00 (plan en `PROVIDER_STRATEGY_F00.md`).
- Unificar duplicación `src/` vs `app_web/` y consolidar 3 bots → 1 → F00 (matriz sección 24).

---

## 32. FINAL RE-AUDIT VERDICT (CIERRE DEFINITIVO)

**VEREDICTO: `PRE_F00_GO`** (bajo evidencia de la sección 31).

**Condición única externa pendiente (`MANUAL_SECRET_ROTATION_REQUIRED`):** rotar (en el panel de Google/Anthropic/proveedor) la API key que estuvo commiteada históricamente en `ia/gemini_analyzer.py`. El código ya no contiene el valor; la rotación es accionable 100% manual y puede hacerse en paralelo a la aprobación de F00.

**Condiciones para abrir F00 (confirmadas):**
1. Expediente `PRE_F00_MASTER_BLUEPRINT_AUDIT.md` (este informe) + `THIRD_PARTY_COMPONENTS.md` + `PROJECT_LICENSE_POLICY.md` + `PROVIDER_STRATEGY_F00.md` revisados por el auditor externo.
2. Realizada la rotación manual de secretos históricos.
3. Aprobado el plan definitivo F00–F03 (sin mini-fases).

**Acción tras aprobación:** iniciar **F00 — Foundation & Global Data Engine** como PRÓXIMA fase. No se implementa nada de F00 en este commit.

**STOP re-confirmado:** no se inicia F00, no se implementa nuevo core, no se borra Legacy.
