# PLAN DE IMPLEMENTACIÓN Y RECONSTRUCCIÓN AUTÓNOMA — FIJAS IA

**Documento:** `PLAN_IMPLEMENTACION_FIJAS_IA.md`  
**Objetivo:** Transformar FIJAS IA en un sistema 100% autónomo, inmutable, auditable y con validación de resultados reales.

---

## 1. FASES DE EJECUCIÓN

### FASE 1: AUDITORÍA (COMPLETADA)
* Creación de `AUDITORIA_CORRECCION_FIJAS_IA.md`.
* Identificación de problemas de mutación de señales, plantillas hardcodeadas, mezcla de deportes y dispersión de timezones.

### FASE 2: NÚCLEO DETERMINISTA (CORE ENGINE)
Crear los módulos en `app_web/src/core-engine/`:
1. `TimeService.ts`: Manejo UTC centralizado y conversión a `America/Lima`.
2. `MarketRulesRegistry.ts`: Validación de mercados compatibles por deporte.
3. `SignalEntity.ts`: Tipos y creador de entidades inmutables `SIGNAL`.
4. `EventNormalizer.ts`: Normalizador de datos de proveedores (ESPN).
5. `EventValidator.ts`: Validación de frescura, fechas futuras y duplicados.
6. `DatabaseRepository.ts`: Persistencia en `data/fijas_database.json` con índices y recuperación en frío.
7. `DataUpdateEngine.ts`: Orquestador de recolección con intervalos adaptativos.
8. `AnalysisEngine.ts`: Modelado Poisson + Kelly + interfaz `AIAnalysisProvider`.
9. `SignalValidator.ts`: Verificación de 10 puntos previos a la emisión.
10. `SettlementEngine.ts`: Liquidación matemática del pick original.
11. `TelegramFormatter.ts`: Formato estandarizado para pronósticos, resultados individuales y cierre diario.
12. `HealthService.ts`: Telemetría del endpoint `/health`.
13. `TestSuite.ts`: Suite de pruebas automatizadas para los Casos 1 a 8.

### FASE 3: INTEGRACIÓN EN EL SERVIDOR (`server.ts`)
* Integrar `CoreEngine` en `server.ts`.
* Iniciar la secuencia de arranque:
  1. Conexión de base de datos y carga de señales pendientes.
  2. Inicialización de `DataUpdateEngine`.
  3. Activación de `MatchMonitorService` y `SettlementEngine`.
  4. Configuración del endpoint `/health` con telemetría en tiempo real.
  5. Enrutamiento del scheduler autónomo después de medianoche.

### FASE 4: INTEGRACIÓN EN EL DASHBOARD WEB (`App.tsx` y Componentes)
* Sincronizar la interfaz con las señales inmutables de la base de datos.
* Mostrar los estados ordenados: Próximos ➔ Hoy ➔ En Vivo ➔ Finalizados ➔ Historial.

### FASE 5: PRUEBAS OBLIGATORIAS (CASOS 1 AL 8)
* Ejecución y validación de los 8 casos de prueba.

### FASE 6: REPORTE FINAL Y DESPLIEGUE EN RENDER
* Creación de `REPORTE_FINAL_FIJAS_IA.md`.
* Compilación con `npm run build`, commit y push a GitHub (`main`).
