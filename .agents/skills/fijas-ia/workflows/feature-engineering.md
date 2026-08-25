# Workflow: Feature Engineering

## Input Requerido
- Métricas estadísticas procesadas por `analyze-data`.

## Validaciones
- Consistencia matemática en los ratios derivados.

## Proceso
1. Calcular **Diferencial xG**: $\Delta xG = xG_{generado} - xG_{concedido}$.
2. Calcular **Índice de Presión Ofensiva (OPI)**: Ponderación de ataques peligrosos y tiros al arco.
3. Calcular **Factor Fatiga / Descanso**: Días transcurridos desde el último partido oficial.
4. Calcular **Ratio H2H Ponderado**: Eficacia histórica frente a rivales con esquema táctico similar.

## Output
- Vector de características normalizado para los modelos cuantitativos.

## Manejo de Errores
- Si faltan datos de descanso, asumir valor neutral de 3 días con nota de advertencia.

## Condiciones de Parada
- Todas las variables predictivas calculadas y acotadas entre 0.0 y 1.0.
