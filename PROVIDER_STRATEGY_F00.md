# PROVIDER STRATEGY — F00 (PLAN-ONLY)

**Estado:** PLAN-ONLY para F00. Aquí NO se integra código ni se cambia runtime.
**Última actualización:** 2026-09-01

> Esta estrategia define **cómo se elegirán los providers cuando se implemente el
> Motor Cuantitativo certificado (F00)**. Pre-F00 no hay ingestión nueva.

---

## 1. Principios

1. **Datos REALES con trazabilidad**: fuente, licencia/permiso, fecha de obtención, versión.
2. **FAIL CLOSED**: sin provider disponible → no hay métricas (nada se inventa).
3. **Prelación explícita + fallbacks reales** (nunca "fallback = datos fabricados").
4. **Contratación de términos antes de uso comercial** (ver `PROJECT_LICENSE_POLICY.md`).

## 2. Estrategia por dominio

| Dominio | PRIMARY | Fallback real (1) | Fallback real (2) | Prohibido |
|---------|---------|-------------------|-------------------|-----------|
| FIXTURES / RESULTS | Provider de fixtures contratado (Football-Data.org Open *con atribución*, o api-football por contrato) | Segundo provider oficial del país/liga | Agregadores con TOS API explícitos | Scraping no autorizado (p. ej. endpoints XHR de ESPN) como fuente primaria |
| STATS (xG, form, H2H) | Provider licenciado de stats (contrato/comercial) | Estadísticas oficiales por liga (sitios con API) | — | Scraping contra TOS (FBref/Understat) sin permiso |
| ODDS | Feed de cuotas comercial con timestamp real (The Odds API / OddsJam / Pinnacle feed) | Segundo bookmaker/feed oficial con API | — | Cuotas estáticas/manuales sin timestamp verificable |

## 3. Orden de prelación (ejecución F00)

Para cada fixture: **odds reales** → si no llegan a tiempo, **fixture se procesa sin odds**
(no se fuerza cuota fantasma); si el partido no tiene datos verificados → **se omite** del
pipeline cuantitativo (FAIL CLOSED).

## 4. Validación de datos en F00

- Criterios de check-in obligatorios: fixture_id checksum, rango de cuotas, consistencia
  1/X/2 (suma inversa dentro de margen), antigüedad máx. del snapshot, ausencia de
  marcadores `SYNTHETIC_ONLY`.
- Todo evento ingerido se guarda con `source`, `fetched_at`, `license`.
- La métrica sólo se emite con `verification` correcto (`VERIFIED` / `SYNTHETIC_ONLY_UNVERIFIED`).

## 5. TELEGRAM COMPROMISE STATUS (registro)

| Clave | Valor vigente | Descripción |
|-------|---------------|-------------|
| `TELEGRAM_COMPROMISE_STATUS` | `OK` (default en código) | Si se detecta compromiso de tokens/canales → `COMPROMISED` en env → **FAIL CLOSED**: ningún bot arranca (getMe/deleteWebhook/polling) ni broadcasting. Registrado en `server.ts`, `app_web/server.ts`, `telegram_sales_bot.py`, `international_engine.py`. |
| `TELEGRAM_LOCK_DIR` | `data/locks` (default) | Dir de locks single-instance de polling (compartido TS↔Python). Uno solo poller por bot evita 409. |