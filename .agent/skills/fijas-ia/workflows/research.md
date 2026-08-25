# Workflow: Research

## Input Requerido
- Entidad deportiva (Equipos, Jugadores, Torneo).
- Pregunta de investigación (ej. "¿Cuál es el rendimiento de Osasuna como local frente a bloques bajos?").
- Contexto temporal (Temporada actual y últimos 10 encuentros).

## Validaciones
- Confirmar que las fuentes primarias sean oficiales (Sitio de la Liga, ESPN, Opta, Transfermarkt).
- Descartar rumores o fuentes de opinión no corroboradas.

## Proceso
1. Invocar la skill `research` para rastrear fuentes primarias.
2. Identificar bajas confirmadas, suspensiones y sanciones disciplinarias.
3. Consultar la skill `web-research` para verificar cambios climáticos o arbitraje asignado.
4. Documentar hallazgos con citas directas.

## Output
- Archivo estructurado con resumen de antecedentes, bajas verificadas y contexto táctico.

## Manejo de Errores
- Si la información sobre alineaciones no está disponible, reportar estado "Alineación Probable" con factor de riesgo.

## Condiciones de Parada
- Conclusión con al menos 2 fuentes primarias concordantes.
