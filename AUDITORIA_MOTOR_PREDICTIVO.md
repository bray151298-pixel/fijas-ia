# AUDITORÍA PROFUNDA DEL MOTOR DE GENERACIÓN DE SEÑALES — FIJAS IA

**Documento:** `AUDITORIA_MOTOR_PREDICTIVO.md`  
**Fecha:** 26 de Agosto de 2026  
**Tipo de Reporte:** Auditoría de Integridad Cuantitativa y Trazabilidad de Código  
**Clasificación Global:** 🔴 **CRITICAL MODEL INTEGRITY ISSUE**  
**Estado:** ⚠️ **SISTEMA EN AUDITORÍA — NO APTO PARA CERTIFICACIÓN FULL CUANTITATIVA**

---

## 1. HECHOS VERIFICADOS Y TRAZABILIDAD EXACTA DE CÓDIGO

### A. Trazabilidad de la Cuota (`odds = 1.75`)
* **Archivo:** [`app_web/src/core-engine/AnalysisEngine.ts`](file:///d:/tipster/app_web/src/core-engine/AnalysisEngine.ts) (y su espejo en [`src/core-engine/AnalysisEngine.ts`](file:///d:/tipster/src/core-engine/AnalysisEngine.ts))
* **Línea Exacta:** **Línea 45**
* **Código Fuente Real:**
  ```typescript
  // AnalysisEngine.ts - Líneas 44-48
  private static analyzeFootball(event: SportEvent): QuantitativeOutput {
    const odds = 1.75;
    const fairOdds = 1.55;
    const edge = Number((((odds / fairOdds) - 1) * 100).toFixed(1)); // +12.9%
    const confidence = 75.5;
  ```
* **Veredicto:** La cuota `@1.75` **NO proviene de una API de apuestas en vivo**; es una constante fija hardcodeada en el archivo.

---

### B. Trazabilidad de Otras Disciplinas Deportivas en `AnalysisEngine.ts`

| Deporte | Método | Línea | Cuota Hardcodeada (`odds`) | Cuota Justa (`fairOdds`) | Confianza Fija | Mercado Fijo |
|---|---|:---:|:---:|:---:|:---:|---|
| **Fútbol** | `analyzeFootball` | L44-48 | `@1.75` | `@1.55` | `75.5%` | `DOUBLE_CHANCE (1X & +1.5 Goles)` |
| **Béisbol** | `analyzeBaseball` | L70-74 | `@1.72` | `@1.54` | `73.0%` | `MONEYLINE (Ganador)` |
| **Básquetbol** | `analyzeBasketball` | L96-100 | `@1.90` | `@1.70` | `71.0%` | `POINT_SPREAD (-4.5 Puntos)` |
| **Tenis** | `analyzeTennis` | L122-125 | `@1.80` | `@1.60` | `74.0%` | `MONEYLINE (Ganador)` |
| **MMA** | `analyzeMMA` | L146-149 | `@1.85` | `@1.62` | `76.0%` | `OVER_UNDER_ROUNDS (+1.5 Rounds)` |

---

### C. Trazabilidad del Mercado (`DOUBLE_CHANCE 1X & +1.5 Goles`)
* **Archivo:** [`app_web/src/core-engine/AnalysisEngine.ts`](file:///d:/tipster/app_web/src/core-engine/AnalysisEngine.ts), Líneas 51-53
* **Causa Raíz:** En la migración del pipeline a TypeScript, `analyzeFootball` fue configurado con una plantilla fija estática que concatena el nombre del equipo local con `"Ganador o Empate (1X) & Más de 1.5 Goles"`. No evalúa de forma dinámica entre mercados 1X2, Over/Under 2.5, BTTS o Hándicap Asiático en tiempo de ejecución.

---

### D. Trazabilidad de los Datos Estadísticos de Entrada (xG y Goles)
* **Archivo:** [`app_web/src/core-engine/AnalysisEngine.ts`](file:///d:/tipster/app_web/src/core-engine/AnalysisEngine.ts), Líneas 61-66
* **Código Fuente:**
  ```typescript
  analysis_summary: `${event.home_team} presenta una ventaja de 2.15 xG en condición de local frente a ${event.away_team} con solidez en transiciones defensivas.`,
  reasoning_bullet_points: [
    `${event.home_team} promedia 1.85 goles anotados en sus últimos 6 compromisos oficiales.`,
    `Modelo de Poisson proyecta 75.5% de probabilidad para doble oportunidad 1X y línea over 1.5 goles.`,
    `Cuota de mercado (@${odds}) ofrece un desajuste positivo (+EV) del ${edge > 0 ? edge : 11.5}% contra cuota justa (@${fairOdds}).`
  ]
  ```
* **Veredicto:** Los valores `2.15 xG` y `1.85 goles` son **cadenas de texto plantilla estáticas**. No se calculan a partir de la media real de goles del equipo local o visitante para ese partido específico.

---

## 2. AUDITORÍA MATEMÁTICA COMPARATIVA

Tomando 3 señales reales generadas actualmente en PostgreSQL:

### Caso 1: `SIG_20260826_001` (River Plate vs Independiente Santa Fe)
* **Probabilidad Implícita de la Cuota:** $P_{imp} = \frac{1}{1.75} = 57.14\%$
* **Probabilidad Asignada por el Modelo:** $75.5\%$ ($P_{fair} = \frac{1}{1.55} = 64.52\%$)
* **Expected Value ($EV$) Reportado:** $\frac{1.75}{1.55} - 1 = +12.90\%$
* **Edge Reportado:** $+12.9\%$
* **Estado:** **Ficticio en origen de datos**. Aunque la fórmula matemática de $EV$ es correcta algebraicamente, tanto `odds` (`1.75`) como `fair_odds` (`1.55`) son constantes literales no derivadas de datos reales de River Plate.

### Caso 2: `SIG_20260828_004` (Boca Juniors vs Lanús)
* **Probabilidad Implícita:** $57.14\%$
* **Probabilidad del Modelo:** $75.5\%$
* **Expected Value ($EV$):** $+12.90\%$
* **Estado:** **Idéntico al Caso 1** (Replicación de plantilla hardcodeada).

### Caso 3: `SIG_20260829_007` (Vasco da Gama vs Cruzeiro)
* **Probabilidad Implícita:** $57.14\%$
* **Probabilidad del Modelo:** $75.5\%$
* **Expected Value ($EV$):** $+12.90\%$
* **Estado:** **Idéntico al Caso 1** (Replicación de plantilla hardcodeada).

---

## 3. COMPARATIVA: DATOS REALES VS DATOS NO DISPONIBLES

| Parámetro | ¿Existe en el Runtime Actual? | Fuente |
|---|:---:|---|
| **Nombres de Equipos (`home_team`, `away_team`)** | ✅ **SÍ** | ESPN Scoreboard API en vivo |
| **Competición / Liga (`league`)** | ✅ **SÍ** | ESPN Scoreboard API en vivo |
| **Hora de Inicio (`start_time_utc`)** | ✅ **SÍ** | ESPN Scoreboard API en vivo |
| **Marcador Oficial Final (`scores`)** | ✅ **SÍ** | ESPN Scoreboard API en vivo |
| **Cuotas de Mercado Reales de Bookmaker** | ❌ **NO** | ESPN Scoreboard no entrega cuotas para ligas Conmebol/Latam |
| **xG Real Calculado por Equipo** | ❌ **NO** | Reemplazado por string template fijo (`2.15 xG`) |
| **Goles a Favor / En Contra Históricos** | ❌ **NO CONECTADO** | Módulo Python `analisis/poisson.py` no invocado desde `server.ts` |
| **Alineaciones / Lesiones** | ❌ **NO DISPONIBLE** | No conectado |

---

## 4. MATRIZ DE PROBLEMAS DETECTADOS Y CLASIFICACIÓN

| # | Problema Detectado | Clasificación | Impacto |
|:---:|---|:---:|---|
| **P1** | **Cuotas fijas hardcodeadas (`odds = 1.75`) en `AnalysisEngine.ts`** | 🔴 **CRITICAL** | Genera pronósticos con cuotas no contrastadas contra el mercado real. |
| **P2** | **Cálculo de +EV sobre cuota justa artificial (`fairOdds = 1.55`)** | 🔴 **CRITICAL** | Se etiqueta como "+EV" una selección cuya ventaja matemática no ha sido demostrada contra cuotas de casas de apuestas. |
| **P3** | **Selección de mercado fija (`DOUBLE_CHANCE 1X & +1.5 Goles`)** | 🟠 **HIGH** | El motor no discrimina entre partidos equilibrados, favoritos claros o tendencias de pocos goles. |
| **P4** | **Strings de razonamiento estáticos con números fijos (`2.15 xG`, `1.85 goles`)** | 🟠 **HIGH** | Muestra justificaciones cuantitativas no calculadas con los datos de los equipos reales. |
| **P5** | **Desconexión entre el backend matemático Python (`analisis/poisson.py`) y el server Node.js** | 🟡 **MEDIUM** | El motor Poisson avanzado de Dixon-Coles escrito en Python no estaba siendo consumido por la API de TypeScript. |

---

## 5. PROPUESTA DE MODO DEGRADADO (`NO_EMIT_SIGNAL`)

*(Propuesta diseñada para implementación futura, no activada actualmente según directiva)*

```
                       [Evento Deportivo ESPN]
                                  ↓
                  ¿Existen Cuotas de Mercado Reales?
                                  │
                 ┌────────────────┴────────────────┐
                 │ NO                              │ SÍ
                 ↓                                 ↓
      [NO_EMIT_SIGNAL]               ¿Existen datos de goles para Poisson?
      Motivo: "Sin cuota de mercado               │
      verificable para calcular EV"       ┌────────┴────────┐
                                          │ NO              │ SÍ
                                          ↓                 ↓
                                  [NO_EMIT_SIGNAL]    [CALCULAR POISSON]
                                  Motivo: "Goles      xG_local / xG_visit
                                  insuficientes"            ↓
                                                      Matriz de Marcadores
                                                            ↓
                                                      EV = (Prob × Odds) - 1
                                                            ↓
                                                      ¿EV > 5% & Conf > 65%?
                                                            │
                                                   ┌────────┴────────┐
                                                   │ NO              │ SÍ
                                                   ↓                 ↓
                                            [NO_EMIT_SIGNAL]   [EMITIR SEÑAL +EV]
```

---

## 📊 RESUMEN EJECUTIVO DE LA AUDITORÍA

1. **Persistencia e Infraestructura:** 🟢 **FUNCIONANDO** (Render, PostgreSQL `fijas-ia-db`, scheduler 24/7, endpoint `/health`, Fastly CDN).
2. **Motor Predictivo Cuantitativo:** 🔴 **REQUIERE CORRECCIÓN MATEMÁTICA** (Las cuotas `@1.75` y el mercado `DOUBLE_CHANCE` provienen de constantes estáticas en `AnalysisEngine.ts` L45-66).
3. **Certificación:** **NO DECLARAR `PRODUCTION_READY` CUANTITATIVO** hasta que las cuotas provengan de fuentes verificables y el modelo de Poisson se calcule dinámicamente con los datos de cada equipo.
