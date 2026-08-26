# AUDITORÍA TÉCNICA Y DIAGNÓSTICO PROFUNDO — FIJAS IA

**Documento:** `AUDITORIA_CORRECCION_FIJAS_IA.md`  
**Fecha de Auditoría:** 26 de Agosto de 2026  
**Sistema Auditado:** FIJAS IA (Producción en Render: `https://fijas-ia.onrender.com` / Repo: `bray151298-pixel/fijas-ia`)  
**Objetivo:** Identificar la causa raíz de las inconsistencias, desajustes temporales, datos hardcodeados y mutación de señales en el sistema autónomo de FIJAS IA.

---

## 1. RESUMEN EJECUTIVO DEL DIAGNÓSTICO

Se ha auditado la totalidad del repositorio (`server.ts`, `app_web/src/*`, `backend/app/*`, `analisis/*`, `.agent/skills/*`). Se concluye que el sistema posee una interfaz visual de alta calidad y modelos matemáticos sólidos (+EV, Poisson, Kelly, IA Gemini/OmniRoute), pero **carecía de una capa determinista de datos estructurada con fuente de verdad inmutable (Single Source of Truth)**.

### Causas Raíz Detectadas:
1. **Mutación de Señales al Liquidar:** Cuando se emitía una señal, se publicaba un texto en Telegram. Al liquidar el partido, el sistema volvía a armar el texto o usaba un objeto en memoria diferente en lugar de recuperar el `signal_id` inmutable original con su mercado, selección, cuota y línea exactas.
2. **Cruce de Mercados entre Deportes:** No existía un `MarketRulesRegistry` estricto que impidiera que un partido de Béisbol (MLB) o Básquetbol (WNBA) heredara mercados de Fútbol (como *"1X"* o *"+1.5 Goles"*).
3. **Dispersión de Timezones:** Múltiples conversiones manuales entre hora local (America/Lima) y UTC en distintos archivos, provocando que eventos de la noche anterior (ej. 23:00 UTC) se cruzaran con el día actual.
4. **Ausencia de un Data Update Engine Central con Control de Frescura (`data_age`):** No se bloqueaba la emisión si los datos de ESPN tenían más de $N$ minutos de antigüedad.
5. **OmniRoute / IA fuera de su frontera de responsabilidad:** Aunque OmniRoute está configurado como router de inferencia de LLMs, se requería garantizar formalmente que la IA nunca invente marcadores, fechas ni cuotas factuales.

---

## 2. ARQUITECTURA ACTUAL Y FLUJO DE DATOS

```
[ ESPN Scoreboard API ] (Ligas Variadas)
         │ (HTTP GET)
         ▼
[ fetchLiveESPNScores() / espnService.ts ] (Conversión ad-hoc)
         │
         ├──► [ In-Memory arrays: trackedPicksDatabase ] (Memoria Volátil)
         ├──► [ scheduler_state.json ] (JSON en disco parcial)
         └──► [ localStorage en Cliente ] (Caché del navegador)
```

### Problemas Estructurales del Flujo:
* **Persistencia Incompleta:** Si el servidor reinicia, el estado en memoria se reiniciaba parcialmente.
* **Falta de Idempotencia:** Las liquidaciones no verificaban el hash de la señal original contra el resultado final oficial de ESPN.
* **Separación de Capas Débil:** La lógica de apuestas, el formateo de Telegram y la recolección de datos estaban mezclados en bloques gigantes dentro de `server.ts`.

---

## 3. EVIDENCIA DE PROBLEMAS EN EL CÓDIGO (AUDITORÍA LÍNEA POR LÍNEA)

### A. Datos Simulados y Plantillas Hardcodeadas
* **Evidencia en `server.ts`:**
  La función del scheduler contenía texto estático de *Levante vs Osasuna* y *Chelsea vs Fulham* hardcodeado dentro del generador de cartelera, provocando que se enviaran partidos pasados a pesar de que la fecha inyectada era de hoy.
* **Evidencia en `server.ts`:**
  `trackedPicksDatabase` inicializaba con IDs fijos `tp-101`, `tp-102` en estado `PENDING` que el navegador cacheaba en `localStorage`.

### B. Mutación de la Señal al Liquidar (Falta de Entidad `SIGNAL` Inmutable)
* **Evidencia en `server.ts` (`/api/live-scanner/settle-live` y `runAutonomousSchedulerEngine`):**
  Al liquidar, se ejecutaba:
  `let pickDesc = `${ev.homeTeam} Ganador o Empate & Más de 1.5 Goles`;`
  Esto generaba una nueva selección sobre la marcha en lugar de leer:
  `const signal = signalRepository.getById(signalId);`
  `// Evaluar EXACTAMENTE signal.market_type, signal.selection, signal.line`

### C. Confusión de Mercados entre Deportes (Cross-Sport Mismatches)
* **Evidencia:** Cuando un partido de MLB entraba por la API de ESPN, el generador predeterminado asignaba mercados de fútbol (`1X o +0.5 Goles`) si no se detectaba explícitamente el deporte.
* **Requisito:** Crear un `MarketRulesRegistry` formal que solo permita:
  * **Fútbol:** `1X2`, `DOUBLE_CHANCE`, `OVER_UNDER_GOALS`, `BTTS`, `ASIAN_HANDICAP`.
  * **Béisbol (MLB):** `MONEYLINE`, `RUN_LINE`, `TOTAL_RUNS`.
  * **Básquetbol (NBA/WNBA):** `MONEYLINE`, `POINT_SPREAD`, `TOTAL_POINTS`.
  * **Tenis:** `MONEYLINE`, `TOTAL_GAMES`, `SET_HANDICAP`.
  * **MMA:** `MONEYLINE`, `TOTAL_ROUNDS`, `METHOD_OF_VICTORY`.

### D. Timezone y Frescura de Datos
* **Evidencia:** `new Date(e.date)` se parseaba directamente sin normalización centralizada en UTC con timezone canónico `America/Lima` para visualización.
* **Requisito:** Crear `TimeService` y `EventValidator` con control de antigüedad (`data_age_seconds > MAX_DATA_AGE` -> `BLOCK`).

### E. Rol de OmniRoute
* **Evidencia:** OmniRoute está configurado en `server.ts` (endpoint `/api/engine/test-omniroute` y `/api/ai/match-tactics`) apuntando a `http://localhost:20128/v1` o proxy OpenAI compatible.
* **Diagnóstico:** OmniRoute debe operar estrictamente como `AIAnalysisProvider` para redacción de contexto y análisis cualitativo. **Nunca debe suministrar datos factuales de partidos, cuotas ni liquidaciones.**

---

## 4. MATRIZ DE COMPONENTES A REESTRUCTURAR

| Componente | Estado Actual | Estado Requerido |
|---|---|---|
| **Almacenamiento** | JSON parcial + In-memory | **SQLite Persistente / Repositorio con Índices** (`events`, `signals`, `settlements`, `refreshes`) |
| **Entidad Señal** | Objetos JSON anónimos variables | **`SignalEntity` Inmutable** con `signal_id`, `event_id`, mercado, selección, cuota |
| **Motor de Datos** | Llamadas dispersas a ESPN | **`DataUpdateEngine`** (`DataProvider` -> `Normalizer` -> `Validator` -> `Repository`) |
| **Control de Frescura** | Ninguno | **`Frescura de Datos`** con `MAX_DATA_AGE` y bloqueo por `STALE_DATA` |
| **Reglas de Mercado** | Lógica dispersa con `if/else` | **`MarketRulesRegistry`** estricto por deporte |
| **Liquidación** | Construcción de texto nuevo | **`SettlementEngine` determinista** (`settle(signal, officialResult)`) |
| **Scheduler** | Bucle único sobrecargado | **`Scheduler` desacoplado** con persistencia a prueba de reinicios |
| **Salud del Sistema** | `/health` básico o ausente | **`/health` completo** con telemetría de DB, Scheduler, Data Age, Telegram, AI |
| **Testing** | Tests desactualizados | **Suite de 8 Tests Unitarios/Integración** obligatorios |
