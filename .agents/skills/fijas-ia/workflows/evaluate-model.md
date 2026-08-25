# Workflow: Evaluate Model

## Input Requerido
- Modelo de Poisson (`analisis/poisson.py`), Criterio de Kelly y Ensamble Cuantitativo.

## Validaciones
- Calibración de Brier Score y prueba de probabilidad de Poisson.

## Proceso
1. Simular la matriz de probabilidades de resultados (ej. 0-0, 1-0, 2-1).
2. Calcular el stake óptimo fraccionario mediante Criterio de Kelly (máximo 2.5 unidades / 5% del bankroll).
3. Evaluar robustez frente a escenarios adversos (sensibilidad a un gol temprano).

## Output
- Probabilidad calibrada, cuota justa matemática y stake exacto sugerido.

## Manejo de Errores
- Si el Kelly óptimo sugiere $> 2.5u$, truncar forzosamente a 2.0u por política de gestión de riesgo.

## Condiciones de Parada
- Evaluación completada con métricas de calibración satisfactorias.
