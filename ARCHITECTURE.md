# Arquitectura del Sistema — Tipster IA

Documento técnico con el diseño completo. Lectura obligada antes de modificar el sistema.

---

## 1. Principios de diseño

1. **Calibración > Precisión.** Para apuestas, una probabilidad reportada del 70%
   debe acertar el 70% del tiempo. Un modelo con AUC alta pero descalibrado
   produce ruina. Por eso aplicamos `CalibratedClassifierCV` (isotónica).
2. **EV+ es el único filtro que importa.** Acertar mucho con cuotas malas pierde dinero.
3. **Modular y desacoplado.** Cada capa (datos, features, modelo, decisión, riesgo)
   puede reemplazarse sin tocar las demás.
4. **Reproducibilidad.** Semillas fijas, versionado de modelos, persistencia de
   features. Cada predicción guarda el hash del modelo que la generó.
5. **Conservador por defecto.** Mejor dejar pasar value bets dudosos que apostarlos.

---

## 2. Capas del sistema

### 2.1 Capa de ingesta (`backend/app/services/`)

- **`data_provider.py`** — Adaptador para API-Football. Implementa:
  - Rate limiting (token bucket).
  - Retries con backoff exponencial + jitter.
  - Cache local (SQLite/Redis en prod) con TTL diferenciado:
    - Fixtures futuros: 5 min
    - Stats históricas: 24 h
    - Lesiones / alineaciones: 30 min
    - Resultados terminados: infinito
  - Normalización a un esquema interno (`MatchDTO`, `TeamStatsDTO`).
- **`odds_aggregator.py`** — Recolecta cuotas de N casas y devuelve la mejor para
  cada selección, además de calcular el `vig` (margen del bookmaker).

**Patrón:** Strategy + Adapter. Permite cambiar de proveedor sin tocar el resto.

### 2.2 Capa de persistencia (`backend/app/models/`)

SQLAlchemy 2.0. Tablas principales:

- `matches` — fixture_id, liga, fecha, home/away, status, score
- `team_stats` — features históricas pre-computadas por equipo y fecha
- `odds` — cuotas snapshot por casa, mercado, momento
- `predictions` — output del modelo (prob_home, prob_draw, prob_away, btts, ou25)
- `bets` — apuestas recomendadas y resueltas (stake, odd, resultado, PnL)
- `model_versions` — metadatos de cada modelo entrenado (hash, métricas, fecha)

**Postgres en prod** (índices en `match_id`, `kickoff`, `bet_id`).
**SQLite en dev** para arrancar sin infraestructura.

### 2.3 Capa de features (`backend/app/services/feature_engineering.py`)

Features calculadas antes del kickoff:

| Feature | Descripción |
|---|---|
| `home_form_5` | Puntos en últimos 5 partidos local |
| `away_form_5` | Puntos en últimos 5 partidos visitante |
| `home_goals_for_avg` | Promedio goles a favor (rolling 10) |
| `home_goals_against_avg` | Promedio goles en contra (rolling 10) |
| `away_goals_for_avg`, `away_goals_against_avg` | Idem para visitante |
| `elo_home`, `elo_away`, `elo_diff` | Rating ELO actualizado por partido |
| `xg_home_avg`, `xg_away_avg` | xG promedio (cuando disponible) |
| `h2h_home_winrate` | Winrate histórico H2H del local |
| `injury_impact_home` | Pérdida de valor de plantilla (suma de minutos*rating) |
| `rest_days_home`, `rest_days_away` | Días desde último partido |
| `is_derby` | Bool |
| `league_strength` | Coeficiente UEFA / Elo medio liga |
| `referee_card_avg` | Tarjetas promedio del árbitro |

Todas se materializan en `team_stats` para evitar recálculo y permitir
backtesting determinístico.

### 2.4 Capa de modelos (`backend/app/ml/`)

Tres modelos especializados (un solo modelo multi-cabeza es más frágil):

| Mercado | Modelo | Etiqueta |
|---|---|---|
| 1X2 | `XGBClassifier` multiclass + isotónica | `{0:home, 1:draw, 2:away}` |
| BTTS | `XGBClassifier` binary + isotónica | `1 si ambos marcan` |
| Over 2.5 | `XGBClassifier` binary + isotónica | `1 si total > 2.5` |
| Handicap Asiático | (extensible) regresión sobre línea | margen de victoria |

**Hiperparámetros base** (en `ml/train.py`, ajustables):
- `n_estimators=400`, `max_depth=4`, `learning_rate=0.05`
- `early_stopping_rounds=30` con validación temporal (no random K-fold).
- `class_weight` balanceado para 1X2 (empate sub-representado).

**Validación temporal:** split por fecha, NO random — evita data leakage.

**Calibración:** `CalibratedClassifierCV(method='isotonic', cv=TimeSeriesSplit(5))`.

**Persistencia:** modelos serializados con `joblib` en `backend/app/ml/artifacts/`.
Cada artefacto incluye:
- el pipeline (preprocesado + modelo)
- metadatos (fecha de entrenamiento, ventana, métricas, hash de features)

### 2.5 Capa de detección de valor (`backend/app/ml/value_detector.py`)

Para cada selección con cuota `o`:

1. **Probabilidad implícita cruda:** `p_imp = 1/o`
2. **Devigging.** El bookmaker incluye margen. Para 1X2 con cuotas `o_h, o_d, o_a`:
   ```
   raw_sum = 1/o_h + 1/o_d + 1/o_a   # > 1
   p_fair_i = (1/o_i) / raw_sum      # normalizado, suma = 1
   ```
3. **Edge / EV:**
   ```
   p_model  = probabilidad del modelo
   o_taken  = mejor cuota disponible (ya sin margen no — usamos la cuota real)
   EV       = p_model * (o_taken - 1) - (1 - p_model)
   edge     = p_model - p_fair    # comparable entre selecciones
   ```
4. **Filtro:** solo es value bet si `EV ≥ EV_MIN` (5% default) y `p_model ≥ P_MIN`.

### 2.6 Capa de decisión (`backend/app/tipster/decision_engine.py`)

Pipeline para cada partido:

```
match → features → predicciones → cuotas → value_detector → reglas → recomendación
```

Reglas de exclusión:
- Liga no soportada (calidad de datos baja → confianza baja).
- Cuota < 1.40 (favoritos extremos: Kelly recomienda stake enorme y poco margen).
- Cuota > 8.0 (long shots: ruido alto).
- Lesiones masivas (>3 titulares clave): se excluye o se aplica penalización.
- Modelo no calibrado para esa liga (verificable con Brier score histórico).

### 2.7 Capa de gestión de riesgo (`backend/app/tipster/risk_manager.py`)

```python
def kelly_fraction(p, o, frac=0.25, cap=0.02):
    """
    p: probabilidad real estimada por el modelo (calibrada).
    o: cuota decimal.
    frac: 0.25 = quarter Kelly (recomendado).
    cap: máximo 2% de banca por apuesta (hard cap).
    """
    b = o - 1
    edge = p * b - (1 - p)
    if edge <= 0:
        return 0.0
    f_full = edge / b
    return min(f_full * frac, cap)
```

**Capas de protección:**

1. **Kelly fraccional 0.25.** Reduce volatilidad ~16× vs Kelly puro.
2. **Hard cap 2%** por apuesta.
3. **Exposición simultánea ≤ 10%** de la banca total (suma de apuestas vivas).
4. **Stop-loss diario:** -5% → pausa hasta 00:00.
5. **Drawdown guard:** si banca < 80% del peak histórico, stake *= 0.5
   hasta recuperar 90% del peak.
6. **Correlación:** si dos picks son del mismo partido o liga, su exposición
   conjunta no excede 1.5× el cap.

### 2.8 Capa de aprendizaje continuo

- **Trigger 1 (data-driven):** cada N=200 nuevas apuestas resueltas → reentrenamiento.
- **Trigger 2 (drift):** Brier score rolling 30 días sube >15% sobre baseline → alerta + retraining.
- **Trigger 3 (cron):** retraining semanal automático.
- **Champion/Challenger:** el modelo nuevo entra en shadow mode 2 semanas
  (predice pero no apuesta). Si supera en ROI simulado, se promueve.

### 2.9 Capa de presentación

- **API FastAPI** con OpenAPI auto-generado (`/docs`).
- Endpoints:
  - `GET /api/predictions/today` — partidos del día con probabilidades.
  - `GET /api/bets/recommended` — picks filtrados por EV+ y umbral.
  - `GET /api/dashboard/metrics` — ROI, winrate, drawdown, banca.
  - `POST /api/bets/{id}/settle` — marcar apuesta como ganada/perdida.
  - `GET /api/backtest/run` — disparar backtest sobre rango de fechas.
- **Telegram bot** (opcional): envía alertas de picks recomendados.
- **Dashboard** mínimo HTML/JS en `frontend/`. Extensible a React.

---

## 3. Flujo de datos completo (request a recomendación)

```
[09:00] Cron job dispara fetch_today
  └─> data_provider.get_fixtures(date=today)
       └─> upsert matches
[09:15] Para cada match sin features:
  └─> feature_engineering.build_features(match)
       └─> upsert team_stats
[09:30] odds_aggregator.snapshot(match_ids)
  └─> upsert odds
[10:00] decision_engine.scan_today()
  ├─> ml.predict(features) → probs
  ├─> value_detector(probs, odds) → edges
  ├─> risk_manager.size(banca, edges) → stakes
  └─> filtra y persiste en bets (status=PENDING)
[10:01] alerts.telegram.broadcast(top_picks)
[FT  ] cron resolver:
  └─> data_provider.get_results
       └─> bets.settle() actualiza PnL y banca
[Domingo 03:00] retrain_scheduler.maybe_retrain()
```

---

## 4. Gestión de riesgo (sección crítica)

### 4.1 Por qué la mayoría de tipsters quiebran

1. **Stakes basados en "confianza" subjetiva.** No tiene base estadística.
2. **Persiguen pérdidas.** Después de un mal día, suben stakes para recuperar.
3. **No filtran por EV.** Apuestan a un favorito al 1.30 con probabilidad real 70%
   (EV = 0.70*0.30 - 0.30 = -0.09 → pierden a largo plazo).
4. **Modelos descalibrados.** "85% de probabilidad" que en realidad es 60%.
5. **Varianza ignorada.** Una racha de 10 perdidas es estadísticamente normal.

### 4.2 Cómo este sistema lo evita

| Riesgo | Mitigación |
|---|---|
| Stakes excesivos | Kelly fraccional 0.25 + cap 2% |
| Persecución de pérdidas | Stop-loss diario + drawdown guard |
| Apuestas sin EV | Filtro EV ≥ 5% obligatorio |
| Descalibración | `CalibratedClassifierCV` + monitoreo Brier |
| Concentración | Cap de exposición simultánea 10% |
| Overfitting | Validación temporal + early stopping |
| Data leakage | Features se calculan con datos previos al kickoff únicamente |
| Sesgo de selección | Tracking honesto de TODAS las predicciones, no solo aciertos |

### 4.3 Métricas que monitoreamos

- **ROI** = PnL / total apostado
- **Winrate** = apuestas ganadas / total
- **Yield** = PnL / total apostado (sinónimo de ROI en betting)
- **Brier score** (calibración) = Σ(p - outcome)² / N
- **Log loss** (calibración alternativa)
- **Max drawdown** desde peak
- **Sharpe ratio** = retorno medio / desviación estándar
- **CLV (Closing Line Value)** = ¿cogimos cuotas mejores que el cierre?
  → mejor predictor de rentabilidad a largo plazo que el ROI a corto.

---

## 5. Decisiones técnicas y trade-offs

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| XGBoost | Red neuronal | Datos tabulares, dataset moderado, mejor calibración con menos data |
| Tres modelos | Un modelo multi-cabeza | Mercados independientes, más fácil debug |
| FastAPI | Flask | Async nativo, OpenAPI auto, validación Pydantic |
| Postgres | MongoDB | Datos relacionales (matches ↔ odds ↔ bets), JOINs frecuentes |
| Isotonic | Platt | Mejor con datasets grandes y distribuciones no-paramétricas |
| Kelly fraccional | Stake fijo | Mejor crecimiento esperado con varianza controlada |
| Validación temporal | K-fold | Evita data leakage en series temporales |

---

## 6. Roadmap

- [ ] Integración real con The Odds API para multi-bookmaker.
- [ ] Modelo bayesiano para incertidumbre (intervalos de confianza en p).
- [ ] In-play model: features dinámicas (posesión, tiros, xG vivo).
- [ ] Detección de arbitraje cross-bookmaker.
- [ ] UI React con drill-down por partido.
- [ ] AB testing de estrategias (Kelly vs Half Kelly vs flat).
- [ ] Soporte multi-deporte (tenis, basket).
