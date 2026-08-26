# ARQUITECTURA TÉCNICA DEL SISTEMA AUTÓNOMO — FIJAS IA

**Documento:** `ARQUITECTURA_FIJAS_IA.md`  
**Versión:** 5.0 (Capa Determinista & Fuente Única de Verdad)

---

## 1. PRINCIPIOS DE DISEÑO

1. **Fuente Única de Verdad (Single Source of Truth):** Toda señal emitida es un registro inmutable con `signal_id`. Nunca se modifica ni se regenera la selección al momento de liquidar.
2. **Separación Estricta de Capas:**
   * **Capa de Datos Deportivos (Sports Data Layer):** ESPN / Sports APIs $\rightarrow$ Normalización y Validación.
   * **Capa Cuantitativa & Matemática:** Poisson, Valor Esperado (+EV), Criterio de Kelly.
   * **Capa de Inteligencia Artificial (AI Layer / OmniRoute):** Análisis contextual, síntesis táctica e inferencia asistida. La IA nunca inventa datos factuales.
   * **Capa de Validación de Señales:** `MarketRulesRegistry` y `SignalValidator` deterministas.
   * **Capa de Publicación & Telegram:** Formatos claros y auditables.
   * **Capa de Liquidación (Settlement Engine):** Resolución del pick original contra el resultado oficial verificado.
   * **Capa de Persistencia:** Base de datos con recuperación automática tras reinicios.

---

## 2. DIAGRAMA DE FLUJO END-TO-END

```
[ Proveedor Deportivo (ESPN / APIs) ]
                  │
                  ▼
         [ EventNormalizer ] (Unifica formato JSON estándar)
                  │
                  ▼
         [ EventValidator ] (Control de frescura, fecha UTC, no duplicados)
                  │
                  ▼
         [ EventRepository ] ◄── Persistencia en Base de Datos
                  │
                  ▼
         [ AnalysisEngine ] (Poisson + xG + Kelly + OmniRoute AI Context)
                  │
                  ▼
         [ SignalValidator ] (Reglas de mercado por deporte + Odds + Confianza)
                  │
                  ▼
         [ SignalRepository ] ◄── Guarda SIGNAL inmutable (Estado: PUBLISHED)
                  │
                  ├──► [ TelegramFormatter ➔ Canales VIP & Free ]
                  │
                  ▼
         [ MatchMonitorService ] (Monitoreo PENDING ➔ LIVE ➔ FINISHED)
                  │
                  ▼
         [ ResultVerificationService ] (Verifica marcadores oficiales)
                  │
                  ▼
         [ SettlementEngine ] (Recupera SIGNAL original y evalúa WON/LOST)
                  │
                  ├──► [ Telegram: Resultado individual con PICK ORIGINAL ]
                  └──► [ Database: Actualiza balance, yield y estadísticas ]
```

---

## 3. ESQUEMA DE ENTIDADES PRINCIPALES

### A. `SportEvent` (Evento Deportivo Normalizado)
```typescript
interface SportEvent {
  event_id: string;             // EVT_YYYYMMDD_HOME_AWAY
  provider: string;             // 'espn'
  provider_event_id: string;    // ID oficial del proveedor
  sport: 'football' | 'baseball' | 'basketball' | 'tennis' | 'mma';
  league: string;
  home_team: string;
  away_team: string;
  start_time_utc: string;       // ISO 8601 UTC
  start_time_local: string;     // America/Lima
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  home_score: number | null;
  away_score: number | null;
  period_detail: string;        // '90+3'', 'Bottom 7th', 'Q4 2:15'
  last_updated_utc: string;
  data_age_seconds: number;
}
```

### B. `SignalEntity` (Señal Inmutable de Pronóstico)
```typescript
interface SignalEntity {
  signal_id: string;            // SIG_20260826_001
  event_id: string;
  provider_event_id: string;
  sport: 'football' | 'baseball' | 'basketball' | 'tennis' | 'mma';
  league: string;
  home_team: string;
  away_team: string;
  event_start_utc: string;
  event_start_local: string;
  market_type: 'MONEYLINE' | 'DOUBLE_CHANCE' | 'OVER_UNDER_GOALS' | 'OVER_UNDER_RUNS' | 'OVER_UNDER_POINTS' | 'SPREAD_HANDICAP' | 'BTTS';
  selection: string;            // Texto exacto seleccionado
  line: number | null;          // Ej: 1.5, 8.5, -4.5
  odds: number;                 // Ej: 1.75
  fair_odds: number;
  edge_percentage: number;      // Ej: +12.4%
  confidence: number;           // 0 - 100%
  risk_level: 'BAJO' | 'MEDIO' | 'ALTO';
  recommended_stake_units: number;
  recommended_stake_soles: number;
  analysis_summary: string;
  reasoning_bullet_points: string[];
  status: 'PENDING' | 'UPCOMING' | 'LIVE' | 'FINALIZING' | 'WON' | 'LOST' | 'PUSH' | 'VOID';
  created_at_utc: string;
  published_at_utc: string | null;
  telegram_message_id: number | null;
  result_status: 'UNRESOLVED' | 'WON' | 'LOST' | 'PUSH' | 'VOID';
  settled_at_utc: string | null;
  actual_home_score: number | null;
  actual_away_score: number | null;
  settlement_reason: string | null;
  units_net_profit: number;
  soles_net_profit: number;
}
```

---

## 4. MATRIZ DE MERCADOS POR DEPORTE (`MarketRulesRegistry`)

| Deporte | Mercados Permitidos | Mercados Prohibidos (Rechazo Inmediato) |
|---|---|---|
| ⚽ **Fútbol** | `1X2`, `DOUBLE_CHANCE`, `OVER_UNDER_GOALS`, `BTTS`, `ASIAN_HANDICAP` | `TOTAL_RUNS`, `INNINGS`, `QUARTERS` |
| ⚾ **Béisbol (MLB)** | `MONEYLINE`, `RUN_LINE` (-1.5 / +1.5), `TOTAL_RUNS` (Over/Under) | `1X (Empate)`, `GOALS`, `BTTS` |
| 🏀 **Básquetbol (NBA/WNBA)** | `MONEYLINE`, `POINT_SPREAD`, `TOTAL_POINTS` | `1X (Empate)`, `GOALS`, `CORNER_KICKS` |
| 🎾 **Tenis** | `MONEYLINE`, `TOTAL_GAMES`, `SET_HANDICAP` | `GOALS`, `RUNS`, `DOUBLE_CHANCE` |
| 🥊 **MMA / UFC** | `MONEYLINE`, `TOTAL_ROUNDS`, `METHOD_OF_VICTORY` | `GOALS`, `POINTS`, `RUNS` |

---

## 5. OBSERVABILIDAD Y CONTROL DE FRESURA

* **`MAX_DATA_AGE_SECONDS`**: $900$ segundos (15 minutos). Si $\text{data\_age} > 900$, el sistema bloquea la emisión de señales y genera log estructurado `STALE_DATA_BLOCKED`.
* **Endpoint de Salud (`/health`):** Devuelve estado general (`healthy` / `degraded` / `critical`), antigüedad de datos deportivos, estado de base de datos, conexión de Telegram y proveedor de IA.
