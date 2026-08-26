# AUDITORÍA TÉCNICA DEL MOTOR PREDICTIVO Y PLAN DE REFACTORIZACIÓN

**Documento:** `PREDICTIVE_ENGINE_REFACTOR_AUDIT.md`  
**Proyecto:** FIJAS IA  
**Rol:** Equipo de Auditoría Cuantitativa, Arquitectura de Software y Engineering  
**Fecha:** 26 de Agosto de 2026  

---

## 1. INVENTARIO EXHAUSTIVO DE VALORES HARDCODEADOS EN EL RUNTIME

| ARCHIVO | LÍNEA | VALOR HARDCODEADO | IMPACTO | ACCIÓN NECESARIA |
|---|:---:|---|---|---|
| `app_web/src/core-engine/AnalysisEngine.ts` | **L45** | `const odds = 1.75;` | Cuota ficticia para fútbol sin bookmaker real. | Reemplazar por consulta dinámica a `OddsProvider` real. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L46** | `const fairOdds = 1.55;` | Cuota justa artificial; no deriva de matriz Poisson. | Calcular cuota justa como $1 / P(E)$ desde `PoissonEngine`. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L47** | `const edge = Number((((odds / fairOdds) - 1) * 100).toFixed(1));` | Edge artificial derivado de constantes fijas. | Calcular $EV = (P_{modelo} \times Odds_{real}) - 1$. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L48** | `const confidence = 75.5;` | Nivel de confianza hardcodeado al 75.5%. | Calcular probabilidad exacta de Poisson de la selección. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L51-53** | `DOUBLE_CHANCE: ${home_team} 1X & +1.5 Goles` | Mercado único repetitivo para cualquier partido. | Implementar `MarketEvaluator` que clasifique 1X2, Over/Under, BTTS, DC. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L59-60** | `stake_units: 2.0`, `stake_soles: 100.0` | Stake estático de 2 unidades para todo pick. | Implementar Criterio de Kelly Fraccional dinámico con techo. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L61** | `"ventaja de 2.15 xG"` | Texto con valor numérico de xG inventado. | Calcular $\lambda_{home}$ y $\lambda_{away}$ reales desde histórico. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L63** | `"promedia 1.85 goles anotados"` | Texto con promedio de goles inventado. | Calcular media de goles local/visita desde `HistoricalStatsRepository`. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L71-74** | Béisbol: `odds: 1.72`, `fair: 1.54`, `conf: 73.0%` | Cuotas y confianza estáticas en MLB. | Consultar cuotas reales de ESPN/Odds API para Moneyline béisbol. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L97-100** | Básquetbol: `odds: 1.90`, `fair: 1.70`, `conf: 71.0%` | Cuotas y spread estáticos en WNBA/NBA. | Conectar odds reales de líneas y spread. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L123-126** | Tenis: `odds: 1.80`, `fair: 1.60`, `conf: 74.0%` | Cuotas fijas en Tenis ATP/WTA. | Conectar cuotas de Moneyline reales o `NO_EMIT_SIGNAL`. |
| `app_web/src/core-engine/AnalysisEngine.ts` | **L147-150** | MMA: `odds: 1.85`, `fair: 1.62`, `conf: 76.0%` | Cuotas fijas en MMA UFC. | Conectar cuotas reales de Rounds o `NO_EMIT_SIGNAL`. |

---

## 2. EVALUACIÓN DE MÓDULOS PYTHON EXISTENTES EN EL REPOSITORIO

| Módulo Python | Estado Actual | Lógica Reutilizable | Decisión de Arquitectura |
|---|:---:|---|---|
| `analisis/poisson.py` | Desconectado del server Node.js | Modelo Dixon-Coles, cálculo de xG por ataque/defensa, matriz de probabilidades de marcadores hasta 7x7, cálculo de 1X2, Over/Under 1.5/2.5/3.5, BTTS. | **Portar matemáticamente a TypeScript (`PoissonEngine.ts`)**: Ejecución síncrona en microsegundos, sin dependencias de procesos externos ni cuellos de botella en Render. |
| `analisis/value_betting.py` | Desconectado | Conversión de cuota a probabilidad implícita ($1/Odds$), cálculo de EV ($P \times Odds - 1$), Edge %, filtrado por umbral mínimo. | **Portar a TypeScript (`ValueBetEngine.ts`)**: Integración directa con `MarketEvaluator.ts`. |
| `backend/app/services/odds_aggregator.py` | Desconectado | Normalización de snapshots multi-bookmaker, eliminación del margen del bookmaker (devigging), selección de mejor cuota. | **Portar a TypeScript (`OddsNormalizer.ts`)**: Normalización y devigging en memoria. |
| `backend/app/services/data_provider.py` | Desconectado | Token bucket rate limiter, integración RapidAPI / API-Sports, parsing de mercados 1X2, Over/Under y BTTS. | **Portar a TypeScript (`OddsProvider.ts`)**: Soporte modular para The Odds API / API-Football / Fallbacks reales. |

---

## 3. ARQUITECTURA DEL REAL DATA PIPELINE EN TYPESCRIPT

```
               [ESPN Fastly CDN] ─── Fixtures & Resultados Reales
                       │
                       ▼
          [HistoricalStatsRepository] ─── Medias reales de goles, xG, H2H y forma
                       │
                       ▼
               [PoissonEngine] ─── Dixon-Coles: λ_home, λ_away ─── Matriz Marcadores 7x7
                       │
                       ▼
              [ProbabilityEngine] ─── P(1X2), P(Over/Under 0.5-3.5), P(BTTS), P(DC)
                       │
  [OddsProvider] ──────┴────── [OddsNormalizer] ─── Cuotas Reales + Devigging
                       │
                       ▼
               [MarketEvaluator] ─── Fair Odds = 1/P, EV = (P × Odds) - 1, Edge %
                       │
                       ▼
             [DataQualityValidator] ─── Score 0-100 (Freshness, Sample Size, Completeness)
                       │
             ┌─────────┴─────────┐
             │ Score < 70        │ Score >= 70 & EV > 5% & Conf > 60%
             ▼                   ▼
      [NO_EMIT_SIGNAL]      [SignalDecisionEngine] ─── Ranking de Mercados + Kelly Fraccional
                                 │
                                 ▼
                         [SignalEntity] (Guardado en PostgreSQL + Telegram)
```

---

## 4. REGLA FUNDAMENTAL DE DEGRADACIÓN (`NO_EMIT_SIGNAL`)
* Si no hay cuotas de mercado reales $\rightarrow$ **`NO_EMIT_SIGNAL`** (Razón: `MISSING_REAL_ODDS`).
* Si las cuotas tienen más de 30 minutos de antigüedad $\rightarrow$ **`NO_EMIT_SIGNAL`** (Razón: `STALE_ODDS`).
* Si no hay historial estadístico suficiente para calcular $\lambda$ $\rightarrow$ **`NO_EMIT_SIGNAL`** (Razón: `INSUFFICIENT_HISTORICAL_SAMPLE`).
* **NUNCA emitir un pronóstico si no se demuestra matemáticamente un Valor Esperado Positivo (+EV) con datos 100% verificables.**
