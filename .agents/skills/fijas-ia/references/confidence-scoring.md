# Sistema de Puntuación de Confianza (Confidence Scoring)

## Fórmula Ponderada de Confianza

El score de confianza (0 - 100) se calcula como:

$$Score = 0.30 	imes C_{datos} + 0.25 	imes C_{muestra} + 0.25 	imes C_{calibracion} + 0.20 	imes C_{edge}$$

Donde:
1. **$C_{datos}$ (Calidad de Datos, 0-100)**: 100 si no hay missing data y las fuentes son oficiales (ESPN/Opta).
2. **$C_{muestra}$ (Tamaño Muestral, 0-100)**: $\min(100, rac{N}{15} 	imes 100)$.
3. **$C_{calibracion}$ (Ajuste del Modelo, 0-100)**: Ajuste Poisson y coherencia táctica.
4. **$C_{edge}$ (Ventaja +EV, 0-100)**: Proporcional a la ventaja matemática ($+12\% ightarrow 100$).

## Niveles Oficiales
- **`HIGH`** ($\ge 80$): Autorizado para Cartelera Oficial y Picks VIP.
- **`MEDIUM`** ($60 - 79$): Autorizado para monitoreo o Pronósticos Destacados Gratuitos.
- **`LOW`** ($40 - 59$): No recomendado para apuestas; requiere mayor consolidación.
- **`INSUFFICIENT_DATA`** ($< 40$): Bloqueado para cualquier emisión.
