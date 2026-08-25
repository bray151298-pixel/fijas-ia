# Workflow: Generate Report

## Input Requerido
- Outputs de todos los workflows anteriores (Research, Data, Validation, Features, Patterns, Model).

## Validaciones
- Verificar que el schema JSON de salida esté completo y no contenga campos `null`.

## Proceso
1. Asignar `analysis_id` único con timestamp ISO.
2. Calcular el `confidence_score` final (0 a 100) y clasificar nivel (`HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT_DATA`).
3. Listar de 1 a 3 factores de riesgo específicos.
4. Generar el reporte final en formato JSON y Markdown técnico.

## Output
- Archivo `analysis_output.json` y dossier Markdown con evidencia completa.

## Manejo de Errores
- Si el score de confianza es `INSUFFICIENT_DATA`, el reporte debe indicar explícitamente: "No se recomienda operar por falta de evidencia estadística suficiente".

## Condiciones de Parada
- Dossier generado y validado contra el esquema oficial de FIJAS IA.
