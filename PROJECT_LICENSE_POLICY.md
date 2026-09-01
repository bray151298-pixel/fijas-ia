# PROJECT LICENSE POLICY — FIJAS IA

**Estado:** PRE-F00 (política vigente; no cambia con remediaciones)
**Última actualización:** 2026-09-01

---

## 1. Licencia por defecto del proyecto: PROPRIETARY_PRIVATE

`PROJECT_LICENSE_POLICY = PROPRIETARY_PRIVATE`

- El código, datos y activos de FIJAS IA 2.0 son **privados** salvo decisión explícita
  del propietario. Términos de uso/venta regidos por el propietario (Bray Yusman Quispe
  Atao — Yape/Plin `901326470`).
- Mientras no exista un archivo `LICENSE` raíz con licencia explícita, aplica
  **"todos los derechos reservados"**. NO publicar ni abrir el repositorio sin decidir esto.

## 2. Componentes de terceros

- Toda dependencia/toolchain mantiene **sus propias licencias** (MIT, ISC, Apache-2.0, BSD,
  etc.) según los manifiestos (`package-lock.json`, `requirements.txt`, etc.).
- El inventario de terceros consultado y sus dictámenes viven en `THIRD_PARTY_COMPONENTS.md`.
- **MIT notices se conservan:** todo fragmento MIT reutilizado debe preservar el aviso de
  copyright y la licencia (sección `NOTICE`/`LICENSE` del componente).

## 3. Repositorios externos de referencia

| Referencia | Licencia | Uso permitido |
|------------|----------|---------------|
| `dk3yyyy/football_predictor`, `mperi1208/value-bet-model`, `ohugonnot/golazo`, `tupils1/worldcup2026-companion`, `veriasia/ledger` | MIT | Uso comercial permitido **con atribución** |
| `rrclaw/worldcup-predictor` | **NINGUNA (NONE)** | **NO reutilizable** — sin permiso otorgado. Solo referencia conceptual reescrita 100% desde cero |

Regla: **"GitHub público" NO es autorización de uso.**

## 4. Datos

- Código y datasets se evalúan **por separado**; los términos de API y de dataset no se
  implican mutuamente.
- Datos sintéticos (SYNTHETIC_ONLY=true) y fabricación interna NUNCA se presentan como
  "datos reales", "métricas certificadas" o "verificados".
- En F00, toda fuente de datos debe registrar: fuente, licencia/permiso, fecha de obtención, versión.

## 5. Fuentes de datos primarias (plan F00 — solo planificación)

- FIXTURES/RESULTS: provider licenciado (p. ej. Football-Data.org Open con atribución o
  api-football por contrato). ESPN scraping NO autorizado no es fuente primaria.
- STATS: provider con términos aprobados (revisar xG/FBref/Understat — scraping contra TOS no).
- ODDS: feed comercial con timestamp real (The Odds API / OddsJam / Pinnacle feed).
- Orden de prelación y fallbacks reales: ver `PROVIDER_STRATEGY_F00.md`.

## 6. Vigilancia

- Cualquier incorporación de código/datos de terceros debe pasar por `THIRD_PARTY_COMPONENTS.md`
  (dictamen de licencia + commit SHA) antes de integrarse.
- Esta policy es condicionante del estado PRE_F00 en el audit master (`PRE_F00_MASTER_BLUEPRINT_AUDIT.md`).