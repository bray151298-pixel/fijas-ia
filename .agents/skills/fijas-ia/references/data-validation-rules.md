# Reglas de Validación de Datos de FIJAS IA

## 1. Reglas de Integridad Mínima
- **Tamaño Muestral Mínimo ($N$)**:
  - $N \ge 10$ partidos recientes para fútbol de clubes.
  - $N \ge 20$ juegos para béisbol MLB.
  - $N \ge 15$ encuentros para baloncesto NBA/WNBA.
  - Si $N < 5$, el análisis queda automáticamente bloqueado bajo estado `INSUFFICIENT_DATA`.

## 2. Límites de Variables Numéricas
- **Cuotas**: Rango válido $[1.01, 50.00]$.
- **xG (Goles Esperados)**: Rango por partido $[0.00, 7.50]$.
- **Posesión**: Suma local + visita $= 100\% \pm 1\%$.
- **Probabilidades**: Suma total de probabilidades de un mercado $= 100\%$.

## 3. Manejo de Valores Faltantes
- Si faltan métricas secundarias (córners, faltas), se imputa con la mediana de la liga señalándolo en `risk_factors`.
- Si faltan datos primarios (marcador, fecha, cuota oficial), la fila queda descartada.
