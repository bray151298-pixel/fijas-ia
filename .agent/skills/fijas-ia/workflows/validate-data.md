# Workflow: Validate Data

## Input Requerido
- Dataset crudo generado por `collect-data`.
- Esquema de datos esperado (`Match`, `TeamStats`, `LiveScore`).

## Validaciones
- Ausencia de valores nulos críticos (goles no definidos, cuotas $\le 1.0$).
- Validación de rango: Posesión entre 0-100%, cuotas entre 1.01 y 50.0.
- Detección de duplicados mediante hashing SHA-256.

## Proceso
1. Ejecutar script `scripts/validate_dataset.py` o módulo de validación interno.
2. Comprobar tamaño de muestra: $N \ge 5$ partidos históricos requeridos.
3. Detectar anomalías estadísticas o valores fuera de rango.

## Output
- Reporte de calidad de datos (`data_quality: { score, missing_data, sample_size }`).

## Manejo de Errores
- Si $N < 5$ o `missing_data == true`, abortar cálculo y asignar nivel `INSUFFICIENT_DATA`.

## Condiciones de Parada
- Dataset validado al 100% o emisión de alerta de datos insuficientes.
