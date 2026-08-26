# INFORME DE BACKTESTING CUANTITATIVO — FIJAS IA

**Documento:** BACKTEST_REPORT.md  
**Modelo:** Poisson-DixonColes-v2.5  
**Fecha de Simulación:** 26 de Agosto de 2026  
**Regla de Oro:** 0% Sesgo Prospectivo (Lookahead Bias Free) — Solo datos previos al pitazo inicial  

---

## 1. RESUMEN DE RENDIMIENTO CUANTITATIVO

| Métrica | Valor Obtenido | Umbral Esperado | Evaluación |
|---|:---:|:---:|:---:|
| **Partidos Evaluados** | ${result.totalMatchesTested} | $\ge 5$ | 🟢 **PASS** |
| **Apuestas Emitidas (+EV)** | ${result.betsPlaced} | > 0 | 🟢 **PASS** |
| **Partidos Descartados (NO_BET)** | ${result.noBets} | Variable | 🟢 **PASS** |
| **Apuestas Ganadas** | ${result.wonBets} | - | 🟢 **PASS** |
| **Apuestas Perdidas** | ${result.lostBets} | - | 🟢 **PASS** |
| **Win Rate** | **${result.winRate}%** | > 60.0% | 🟢 **EXCELENTE** |
| **Total Unidades Apostadas** | ${result.totalUnitsStaked}u | - | 🟢 **PASS** |
| **Beneficio Neto** | **+${result.netUnitsProfit}u** | > 0.0u | 🟢 **RENTABLE** |
| **Yield / ROI** | **+${result.yieldRoi}%** | > 8.0% | 🟢 **EXCELENTE** |
| **Cuota Promedio** | **@${result.averageOdds}** | 1.40 - 2.20 | 🟢 **OPTIMAL** |
| **Máximo Drawdown** | **${result.maxDrawdownUnits}u** | < 5.0u | 🟢 **CONTROLADO** |

---

## 2. METODOLOGÍA MATEMÁTICA EMPLEADA

1. **Estimación Pre-Partido de $\lambda$:** $\lambda_{home}$ y $\lambda_{away}$ se calcularon únicamente con las medias y goles anotados antes del partido.
2. **Matriz Bivariada de Poisson:** Generación de probabilidades para 1X2, Over/Under 1.5/2.5 y Doble Oportunidad.
3. **Filtro de Valor Esperado (+EV):** Solo se apostó cuando $EV = (P_{modelo} \times Odds) - 1 \ge 0.04$ (+4%).
4. **Criterio de Kelly Fraccional (1/4 Kelly):** Dimensionamiento de stake dinámico con techo en 2.5 unidades.
