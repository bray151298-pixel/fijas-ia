# THIRD PARTY COMPONENTS — FIJAS IA 2.0 OPEN-SOURCE GOVERNANCE AUDIT

**Fecha de consulta:** 2026-09-01
**Estado:** PRE-F00 (auditoría, NO implementación)

> REGLAS APLICADAS:
> - "GitHub público" **NO** es autorización de uso. Solo cuenta la licencia/permiso explícito.
> - Código y dataset se evalúan **por separado**.
> - No se copia código de proyectos sin licencia compatible con el uso previsto (comercial).
> - Se documenta commit SHA consultado para trazabilidad de cada fuente.

---

## 1. Licencia del propio proyecto FIJAS IA (Legacy)

| Campo | Valor |
|------|-------|
| Repositorio | `github.com/bray151298-pixel/fijas-ia` (branch `main`) |
| Commit auditado | `e3a8f0ced9ced451fcb7d14e5c6a3df86378eb12` |
| Archivo LICENSE raíz | **NO EXISTE** (ninguno de LICENSE/LICENSE.txt/LICENSE.md) |
| package.json license | **vacío** |
| Licencia efectiva | Sin licencia → **Todos los derechos reservados** (by default) |

**Implicancia para FIJAS IA 2.0:** El propio repositorio Legacy no declara licencia. Recomendado: definir explicitamente la licencia/términos del proyecto 2.0 (p. ej. MIT o propietaria privada) antes de publicar o abrir el código. Hasta entonces, el código se considera de uso privado del propietario.

---

## 2. Referencias prioritarias (repositorios candidatos a reutilizar conceptos/código)

| # | Repositorio | URL | Licencia | Commit consultado | Fecha commit | Último cambio | Comercial | Modificar | Atribución |
|---|-------------|-----|----------|-------------------|--------------|---------------|-----------|-----------|-------------|
| 1 | `dk3yyyy/football_predictor` | https://github.com/dk3yyyy/football_predictor | MIT | `7551c515f29d94ddd958da483c1178f468b90b81` | 2026-08-01 | 2026-08-01 | ✅ | ✅ | Requerida (preservar copyright) |
| 2 | `mperi1208/value-bet-model` | https://github.com/mperi1208/value-bet-model | MIT | `e30ad7a154e8281abec4ba2b338075f013696538` | 2026-08-26 | 2026-08-26 | ✅ | ✅ | Requerida |
| 3 | `ohugonnot/golazo` | https://github.com/ohugonnot/golazo | MIT | `e163e9ad9a1183727469779d3194d155d472d688` | 2026-06-22 | 2026-08-01 | ✅ | ✅ | Requerida |
| 4 | `rrclaw/worldcup-predictor` | https://github.com/rrclaw/worldcup-predictor | **NINGUNA (NONE)** | (default repo head) | — | 2026-07-05 | **NO — sin licencia** | **NO** | N/A |
| 5 | `tupils1/worldcup2026-companion` | https://github.com/tupils1/worldcup2026-companion | MIT | `992eaff4898ff52e9a475b75bf4e548de7d3136f` | 2026-06-24 | 2026-06-24 | ✅ | ✅ | Requerida |
| 6 | `veriasia/ledger` | https://github.com/veriasia/ledger | MIT | `4db2c87d28edb1b97e05b7448533ec02b27e8fb7` | 2026-07-18 | 2026-07-18 | ✅ | ✅ | Requerida |

### 2.1 Nota crítica sobre `rrclaw/worldcup-predictor`
- **Sin archivo de licencia (license=NONE).** No hay permiso otorgado para uso, copia ni modificación.
- **NO reutilizar su código** bajo ninguna circunstancia. Solo puede usarse como referencia conceptual (idea general) si se reescribe 100% desde cero y de forma independiente, sin copiar líneas, estructuras ni comentarios.
- No se considera "GitHub público" como autorización.

---

## 3. Conceptos de interés por referencia (qué se puede inspirar, no copiar)

| Repositorio | Concepto que interesa | Código potencialmente reutilizable | Qué NO reutilizar |
|-------------|----------------------|------------------------------------|-------------------|
| `dk3yyyy/football_predictor` | Modelado de predicción de fútbol, engineered features | Fragmentos MIT con atribución; la idea de pipeline de features | Datos/weights/modelos serializados si carecen de licencia propia; lógica acoplada |
| `mperi1208/value-bet-model` | Value betting, EV/edge vs cuotas de mercado | MIT con atribución; concepto de detection de valor | Cuotas o datasets específicos que vengan del repo (revisar términos de datos) |
| `ohugonnot/golazo` | Normalización/agregación de datos deportivos | MIT con atribución; lógica de normalización | Si consume APIs, respetar los términos de la API, no del repo |
| `rrclaw/worldcup-predictor` | (concepto general de WC predictor) | **NINGUNO** | Todo — sin licencia |
| `tupils1/worldcup2026-companion` | Companion/consumidor de datos 2026 | MIT con atribución | Datos/cuotas específicos (revisar términos de fuente) |
| `veriasia/ledger` | Ledger inmutable/auditable (best-fit para PASO 16 señal/ledger) | MIT con atribución; diseño de registro con hash | Datos internos |

**Conclusión licencias:** 5 de 6 referencias son MIT (permisivas, uso comercial permitido con preservación de aviso). Una (`rrclaw/worldcup-predictor`) **no tiene licencia → NO reutilizable**. Todo código MIT reutilizado debe conservar el aviso de copyright y la licencia MIT en un archivo `NOTICE`/`LICENSE` dentro del componente.

---

## 4. Providers / Datasets candidatos (código y datos se evalúan separadamente)

> Solo se listan candidatos; la decisión final de integración es de F00. Aquí solo se registra el dictamen de licencia/permiso.

| Fuente | Tipo | Permiso/uso | Nota |
|--------|------|-------------|------|
| **ESPN Scoreboard/API pública** (usado en Legacy `src/core-engine/DataUpdateEngine.ts`, `espnService.ts`) | API pública | Scraping no autorizado de endpoints públicos XHR (`cdn.espn.com`, `site.api.espn.com`) | Riesgo legal/TOS. NO debe ser fuente primaria en 2.0; requiere evaluación de términos o provider licenciado. |
| **api-football (RapidAPI)** (usado en `maquina-predicciones-streamlit/datos/football_api.py`) | API | Requiere clave comercial / plan | Los TOS de RapidAPI rigen el uso de datos; revisar plan comercial. |
| **The Odds API / OddsJam / Pinnacle feed** (candidato cuotas) | API cuotas | Por contrato/comercial | Evaluar en F00; cuotas deben ser REALES y con timestamp. |
| **Football-Data.org (Open)** | API fixture/resultados | Gratuita con atribución para datos; ver licencia de datos | Candidato para fixtures/results. |
| **Kaggle datasets** (candidato histórico) | Dataset | Por licencia de cada dataset (muchas CC-BY / ODbL) | Evaluar cada dataset individual; no asumir libre. |
| **FBref / Understat (xG)** | Scraping | Sin API oficial; scraping contra TOS | Riesgo; no recomendado como fuente primaria sin permiso. |
| **DataHub / openfootball** | Dataset | Según repo individual (Nominatim-adjacent) | Evaluar licencia por archivo. |

### 4.1 Regla de datos
- Los términos de **API** y los términos del **dataset** se evalúan por separado.
- Una fuente con API libre no implica datos libres y viceversa.
- Todo dato de terceros debe registrar: **fuente, licencia/permiso, fecha de obtención, versión**.

---

## 5. Datos sintéticos en el Legacy (NO confundir con terceros)

| Archivo | Naturaleza | Impacto |
|---------|-----------|---------|
| `data/synthetic_matches.csv` | 6,240 filas simuladas (Poisson) — generadas por `scripts/seed_data.py` | Marcado `synthetic_only=True` (SYNTHETIC_ONLY=true). Toda ejecución queda `SYNTHETIC_ONLY_UNVERIFIED`; prohibido para métricas comerciales o backtests certificados |
| `data/fijas_database.json`, `app_web/data/fijas_database.json` | Estado persistido, **REMEDITADO PRE-F00**: `HISTORICAL_ARCHIVE_SIGNALS` vaciado (FAIL CLOSED) y 5 señales fabricadas `SIG_20260824_*` eliminadas de los JSON | Histórico real (ESPN) conservado; sin señales inventadas que contaminen métricas |
| `src/core-engine/HistoricalStatsRepository.ts` | Tabla hardcode de stats | No es dato real de terceros; es fabricación interna — incluirla como NO verificada o eliminarla del flujo cuantitativo |

---

## 6. Decisión de gobernanza open-source recomendada (para FIJAS IA 2.0)

1. Definir licencia del proyecto 2.0 (recomendado: **propietaria/privada** si es comercial 24/7 con ventas VIP; o MIT si se quiere abrir).
2. Mantener un `THIRD_PARTY.md`/`NOTICE` vivo con cada dependencia, licencia y commit consultado.
3. **No** incorporar código de `rrclaw/worldcup-predictor` (sin licencia).
4. Todo código MIT reutilizado: preservar aviso de copyright y licencia.
5. No usar scraping no autorizado de ESPN como fuente primaria; migrar a providers licenciados/comerciales en F00.
6. Datos y código de terceros rastrearse por separado (regla 4.1).
