# Workflow: Collect Data

## Input Requerido
- ID de evento, competición o fecha a consultar.
- Fuentes de datos configuradas: ESPN Scoreboard API, SQLite `tipster.db`, Catálogo de cuotas de Apuesta Total.

## Validaciones
- Conexión activa a internet o disponibilidad de base de datos local.
- Estructura JSON/SQL válida sin corrupción de payload.

## Proceso
1. Ejecutar consulta de extracción a `fetchLiveESPNScores()` o base de datos `tipster.db`.
2. Extraer métricas clave: Goles/Puntos/Carreras, Tiros totales, Tiros al arco, xG, Posesión, Córners, Faltas.
3. Almacenar el dataset en formato normalizado JSON/DataFrame.

## Output
- Dataset tabular estructurado listo para limpieza e inspección.

## Manejo de Errores
- Si la API externa no responde, activar fallback local a `tipster.db` o caché histórica.

## Condiciones de Parada
- Dataset completo con al menos 5 partidos previos por equipo.
