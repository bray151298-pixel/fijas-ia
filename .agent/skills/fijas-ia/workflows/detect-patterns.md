# Workflow: Detect Patterns

## Input Requerido
- Vector de características y líneas de cuotas del mercado (Apuesta Total).

## Validaciones
- Las cuotas del mercado deben ser cuotas de apertura o en vivo verificadas.

## Proceso
1. Comparar la probabilidad estimada por el modelo contra la probabilidad implícita de la casa:
   $$Edge = (Prob_{modelo} 	imes Cuota_{mercado}) - 1$$
2. Filtrar desajustes cuantitativos donde $Edge \ge +10.0\%$.
3. Verificar si el patrón se sostiene en backtesting histórico.

## Output
- Lista de oportunidades +EV clasificadas por nivel de urgencia.

## Manejo de Errores
- Si la cuota justa calculada es mayor a la cuota del mercado ($Edge \le 0$), descartar la selección inmediatamente.

## Condiciones de Parada
- Identificación de oportunidades válidas o confirmación de mercado eficiente (sin jugada recomendada).
