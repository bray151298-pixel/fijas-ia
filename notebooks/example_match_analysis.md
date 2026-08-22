# Ejemplo de análisis de un partido — paso a paso

> Reproducible con: `python -m scripts.example_match_analysis`

Este notebook documenta cómo el sistema analiza un partido de principio a fin,
para que cualquier integrante del equipo entienda la lógica.

---

## 1. Datos de entrada

Para cada partido programado tomamos:
- `home_team`, `away_team`, `kickoff`, `league`
- Historial de partidos terminados de ambos equipos (solo previo al kickoff).
- Cuotas snapshot de las casas de apuestas.
- (Opcional) Lesiones, alineaciones probables, árbitro.

## 2. Construcción del vector de features

```python
from backend.app.services.feature_engineering import build_features_for_match
feats = build_features_for_match(history_df, "Liverpool", "Arsenal", kickoff)
```

Salida (ejemplo):
```python
{
  'home_form_5_pts':   11.0,
  'away_form_5_pts':    8.0,
  'home_gf_avg10':      2.10,
  'home_ga_avg10':      0.90,
  'away_gf_avg10':      1.70,
  'away_ga_avg10':      1.10,
  'home_xg_avg10':      2.05,
  'away_xg_avg10':      1.55,
  'elo_home':        1820.0,
  'elo_away':        1745.0,
  'elo_diff':          75.0,
  'home_rest_days':     7.0,
  'away_rest_days':     6.0,
  'h2h_home_winrate':   0.60,
  'home_injury_impact': 0.0,
  'away_injury_impact': 0.15,
  'league_strength':    1.0,
  'home_advantage':     1.0,
}
```

**Importante:** Solo se usan partidos con `kickoff < as_of` (anti-leakage).

## 3. Predicción

```python
from backend.app.ml.predict import Predictor
predictor = Predictor(); predictor.load()
pred = predictor.predict(feats)
# pred.p_home=0.52, p_draw=0.24, p_away=0.24
# pred.p_btts_yes=0.58, pred.p_over_25=0.55
```

Las probabilidades vienen calibradas (isotónica), así que `0.52` significa
**realmente** ~52% de éxito histórico cuando el modelo dice 0.52.

## 4. Devigging y comparación con cuotas

Cuotas reales del partido (Bookie-A): `H 1.95 | D 3.50 | A 4.10`

```
suma_implícita = 1/1.95 + 1/3.50 + 1/4.10 = 1.069  (vig = 6.9%)
p_fair_home = (1/1.95) / 1.069 = 0.480
p_fair_draw = (1/3.50) / 1.069 = 0.267
p_fair_away = (1/4.10) / 1.069 = 0.228
```

## 5. EV por selección

| Selección | p_modelo | p_fair | cuota | EV | Edge | Veredicto |
|---|---:|---:|---:|---:|---:|---|
| HOME | 52.0% | 48.0% | 1.95 | +1.4% | +4.0% | ❌ EV<5% |
| DRAW | 24.0% | 26.7% | 3.50 | -16.0% | -2.7% | ❌ edge negativo |
| AWAY | 24.0% | 22.8% | 4.10 | -1.6% | +1.2% | ❌ EV<5% |
| BTTS YES | 58.0% | 51.0% | 1.85 | +7.3% | +7.0% | ✅ **VALUE** |
| OVER 2.5 | 55.0% | 50.5% | 1.92 | +5.6% | +4.5% | ✅ **VALUE** |

## 6. Risk Manager → stake final

Para `BTTS YES`:

```
p_model = 0.58, odd = 1.85
b = 0.85
edge = 0.58 * 0.85 - 0.42 = 0.073
f_full = 0.073 / 0.85 = 0.0859    → Kelly puro: 8.59% banca
f_quarter = 0.0859 * 0.25 = 0.0215 → Quarter Kelly: 2.15%
f_capped = min(0.0215, 0.02) = 0.02 → cap 2%

Banca = 1000 €
Stake = 0.02 * 1000 = 20 €
```

El risk manager además verifica:
- Drawdown actual (si > 20% → halve stake).
- Stop-loss diario (si pnl_dia < -5% → no apostar).
- Exposición simultánea (cap 10% de banca en apuestas vivas).
- Correlación (si ya hay otra apuesta en este partido → halve stake).

## 7. Pick final emitido

```json
{
  "match": "Liverpool vs Arsenal",
  "market": "BTTS",
  "selection": "YES",
  "odd": 1.85,
  "p_model": 0.58,
  "p_fair": 0.51,
  "edge": 0.07,
  "expected_value": 0.073,
  "suggested_stake": 20.00,
  "bookmaker": "Bookie-A",
  "rationale": "p_model=58.0%, EV=+7.3%, edge=+7.0%"
}
```

Este pick se persiste en la tabla `bets` con status PENDING. Cuando el partido
termina, el resolver lo marca WON/LOST y actualiza la banca.

## 8. ¿Cómo aprende el sistema?

- Cada apuesta resuelta se guarda con su PnL real.
- El scheduler verifica condiciones de retraining (cada 200 nuevas apuestas,
  drift > 15% en Brier score, o cron semanal).
- El nuevo modelo entra en shadow mode 2 semanas: predice pero no apuesta.
- Si supera al modelo en producción en ROI simulado, se promueve.

Esto evita que un mes mediocre saque al modelo bueno de producción por ruido.
