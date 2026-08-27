# OPENCODE CONTINUITY AUDIT — FIJAS IA

> Continuity audit for autonomous agent sessions. Update this file whenever significant
> findings, root causes, or architectural decisions are discovered. Empty state sections
> mean "not applicable / nothing configured this session".

**Última actualización:** 2026-08-27

**Estado final de esta sesión:** `DEGRADED`

**Prompt objetivo resumido:** Invertigar por qué la señal de ayer (26/08, `SIG_20260826_101`)
nunca se liquidó y por qué hoy (27/08) no se generaron señales; corregir solo bugs confirmados,
añadir pruebas, mejorar observabilidad, documentar y hacer commit+push a `origin/main`.

---

## 1. Situación inicial (hechos)

- Fecha del sistema mientras se trabajó: **27 agosto 2026**.
- Señal de "ayer": **26 agosto 2026**, `SIG_20260826_101`, MONEYLINE local "River Plate Ganador (1)".
- Endpoint producción verificado: `https://fijas-ia.onrender.com/api/health` (solo `{status:"ok",...}`, sin telemetría).
- `/health` de producción sí devuelve telemetría: scheduler running, postgres connected, data fresh, `production_total:0`.
- `/api/signals/all`: 5 señales HISTORICAL (WON) hardcodeadas.
- `/api/tests/run`: 13/13 PASS antes de esta sesión.
- **Resultado oficial real** (verificado vía `cdn.espn.com`): **River Plate 1 - 1 Independiente Santa Fe**, state=post FT-Pens, fecha 2026-08-27T00:30Z. La señal MONEYLINE local "River Plate Ganador (1)" con empate 1-1 ⇒ debe ser **LOST**.

## 2. Root cause de la señal no liquidada (`SIG_20260826_101`)

El equipo constata (con varias líneas de evidencia) que **el root de deploy de producción es `app_web/`**,
no la raíz `D:\tipster`:

1. `server.ts` raíz importa `./src/support-engine/*` (plansCatalog, intentClassifier, objectionsEngine, faqEngine,
   fraudDetector, customerMemory, inviteManager, renewalScheduler, salesAnalytics, persistentStore), pero **esos módulos
   NO existen en `src/` raíz** (`Test-Path src\support-engine` = False). El server raíz es **incompilable/inoperable**.
2. Esos módulos SÍ existen en `app_web/src/support-engine/`. `app_web/package.json` tiene los scripts `build`/`start`/`dev`
   y un `app_web/dist` ya generado ⇒ `app_web/` es la app desplegable.
3. `run_tests.ts` importa `TestSuite` desde `./app_web/src/core-engine/TestSuite` ⇒ la copia operativa es `app_web/`.
4. `app_web/` **NO tiene directorio `data/`**. `DatabaseRepository` carga `data/fijas_database.json`; al no existir en
   el deploy, arranca solo con las 5 señales HISTORICAL hardcodeadas ⇒ coincide con que producción muestre solo 5 señales
   y `production_total:0`.

**Cadena causal de la señal no liquidada:**
- En producción, `process.cwd()` = `app_web/`, sin `data/fijas_database.json` ⇒ el estado in-memory de `DatabaseRepository`
  nunca contiene las señales PRODUCTION emitidas en sesiones previas (solo las 5 HISTORICAL hardcodeadas).
- La señal `SIG_20260826_101` fue persistida en PostgreSQL, pero **el scheduler in-memory no la veía** porque
  `getPendingSignals()` lee `state.signals` (local), no Postgres.
- Por tanto el bucle de settlement iteraba 0 señales pendientes ⇒ jamás consultó el marcador de River ⇒ la señal quedó
  PENDING/UNRESOLVED indefinidamente (no se liquidó ni como WON ni como LOST).
- No hubo ningún retry con metadata; no había telemetría que lo evidenciara.

**Por qué hoy (27/08) no se generaron señales:**
- `DataUpdateEngine.fetchRealEvents()` solo trae el feed del día en curso; diagnóstico `temp_diag_today.ts` retornó
  0 eventos para el 27/08 (Lima). Sin partidos hoy sin cuotas reales verificables ⇒ `NO_EMIT_SIGNAL`.
- Independientemente, el flujo de broadcast diario requiere que `getAllSignals()`/estado local tenga datos frescos; en
  producción sin JSON local solo quedarían las 5 históricas y el guard `existingSignalEventIds`/frescura bloquearía emisión.

## 3. Correcciones aplicadas (solo bugs confirmados)

Aplicadas de forma **simétrica** en `app_web/` (fuente de producción) y en la raíz `src/` (legacy) para mantenerlas en sync:

1. **`@undefined` (camelCase) — bug confirmado:** `SignalDecisionEngine.ts:88` y `TestSuite.ts` usaban `top.fairOdds`
   / `candidate.fairOdds` (camelCase) sobre un objeto con `fair_odds` (snake_case) ⇒ `@undefined` en la decisión final.
   Corregido a `fair_odds`.
2. **Settlement loop — bug confirmado (causa raíz):** en `app_web/server.ts` el bucle de settlement se reescribió (FASE 8/9)
   para: (a) `await db.syncFromPostgres('PRODUCTION')` cada tick (recupera señales PENDING de Postgres), (b) fallback a
   `db.getEvent()` cuando el evento no está en el feed del día, (c) incremento/persistencia de `settlement_attempts` /
   `last_settlement_attempt` / `last_settlement_error`, (d) `EVENT_NOT_FOUND` ⇒ PENDING (nunca LOST forzado), (e) no FINISHED
   ⇒ PENDING, (f) UNRESOLVED ⇒ PENDING con motivo, (g) no re-liquidación vía `settledMatchesRegistry`, (h) envío Telegram en
   try/catch (persistencia ya hecha).
3. **Campos de retry/settlement en `SignalEntity.ts`:** `settlement_attempts`, `last_settlement_attempt`, `last_settlement_error`.
4. **PostgresRepository:** columnas nuevas + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` idempotente en la tabla `signals`;
   `saveSignal` persiste `$34,$35,$36` y `mapRowToSignal` los lee.
5. **`stats.*` flattening bug — confirmado:** `server.ts` y `app_web/server.ts` usaban `stats.wonCount`, `stats.totalSignals`,
   etc., sobre el objeto anidado de `getAuditStatistics()` (que expone `{production,historical,test,all}`) ⇒ undefined en los
   mensajes de settlement y resumen diario. Corregido a `stats.production.*`.
6. **`ParlayEngine` sin importar — confirmado:** `server.ts`/`app_web/server.ts` llamaban `ParlayEngine.generateOptimalParlays`
   sin importarlo ⇒ `ReferenceError` cuando la sección de parlay VIP intentaba generarse (quedaba atrapada en try/catch y el
   parlay oficial nunca salía). Añadido al import.
7. **Observabilidad (`/api/health`):** expone telemetría del scheduler (last_tick, last_successful_tick, seconds_since_last_tick,
   ticks, last_settlement_attempt/error), del data engine, database/postgres status, recuento de señales pendientes y estado de
   Telegram. Se añadieron contadores `schedulerTelemetry` globales actualizados en cada tick y en los puntos de settlement/Telegram.

## 4. Pruebas

- Suite `app_web/src/core-engine/TestSuite.ts` ampliada (CASO_1 a **CASO_20**), ahora `async`.
- `run_tests.ts` actualizado (await, 20 casos).
- Resultado: **20/20 PASS**, incluyendo:
  - `CASO_14` (regresión del incidente): River 1-1 MONEYLINE local ⇒ **LOST**.
  - `CASO_15` doble chance 1X con empate ⇒ WON.
  - `CASO_16/17` no FINISHED / sin marcador ⇒ UNRESOLVED (nunca LOST forzado).
  - `CASO_18` persistencia de `settlement_attempts`.
  - `CASO_19` `syncFromPostgres` resiliente sin Postgres.
  - `CASO_20` señal ya liquidada excluida de pendientes (no re-liquidación tras reinicio).
- Validación de bundle: `esbuild server.ts` en `app_web` compila (exit=0, ~317 KB).

## 5. Estado de PostgreSQL

- Producción: Postgres conectado (`postgres_status: connected`). No se tiene el `DATABASE_URL` de producción desde este entorno
  (local es SQLite `tipster.db`), por lo que **no se pudo inspeccionar directamente** la tabla `signals` de producción.
- Hipótesis/acción: la señal `SIG_20260826_101` vive en Postgres; con `syncFromPostgres` en el tick, el scheduler la recuperará
  y liquidará como LOST en el próximo deploy.

## 6. Estado final y riesgos residuales (por qué `DEGRADED` y no HEALTHY)

- **`syncFromPostgres` no validado en producción** (no accesible el Postgres real desde aquí) ⇒ la corrección central depende de
  que Postgres contenga la señal y de un redeploy + tick.
- **Datos hardcodeados:** `OddsProvider.bookmakerOddsMap` (solo 4 partidos) y `HistoricalStatsRepository` (perfiles de equipos)
  violan las reglas de integridad del proyecto (sin cuotas/xG inventados). **Pendiente de reemplazo por fuente real**.
- **Raíz legacy `src/` + `server.ts` inoperable** (faltan módulos `support-engine`); sin migrar a `app_web` como única fuente se
  mantiene una copia rota en el repo.
- **Sin Postgres local / sin acceso a dashboard Render** ⇒ no se validó el flujo end-to-end en producción.
- Se corrigieron bugs confirmados; no se reescribió ni se inventó nada. Resta: deploy, validación en producción y telemetría
  post-deploy (`/api/health`).

## 7. Configuración / credenciales (NO comitear)

- `.env` local: `DATABASE_URL=sqlite:///./tipster.db` (dev), `TELEGRAM_CHAT_ID=@FijasIAOficial`,
  `TELEGRAM_VIP_CHAT_ID=-1004358917232`, `ENVIRONMENT=development`.
- No se comitean secretos.

## 8. Pendientes para la próxima sesión

1. Hacer deploy de `app_web/` y validar `SIG_20260826_101` → LOST vía `/api/signals/all` y `/api/health` (settlement telemetry).
2. Confirmar `production_total` > 0 tras `syncFromPostgres`.
3. Reemplazar `OddsProvider`/`HistoricalStatsRepository` hardcodeados por datos reales; eliminar raíz legacy si procede.
4. Considerar unificar `src/` y `app_web/` en una sola fuente.
