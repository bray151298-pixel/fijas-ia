# Workflow: Analyze Data

## Input Requerido
- Dataset validado y limpio.
- Parámetros de distribución y series temporales.

## Validaciones
- Normalidad o ajuste de distribución de Poisson/Gaussiana para el deporte específico.

## Proceso
1. Invocar skill `data-analysis` para calcular métricas descriptivas (media, mediana, desviación estándar, IQR).
2. Calcular series temporales de rendimiento (racha de local vs visita).
3. Construir matriz de correlación entre xG generado y goles concedidos.

## Output
- Resumen estadístico multivariable y parámetros de dispersión.

## Manejo de Errores
- En caso de alta dispersión ($\sigma > 2.5$), marcar la varianza como factor de riesgo.

## Condiciones de Parada
- Métricas estadísticas calculadas y tabuladas sin valores infinitos o NaN.
