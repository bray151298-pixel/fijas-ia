# Dossier Cuantitativo de Análisis Deportivo

**ID de Análisis:** `{analysis_id}`  
**Fecha y Hora:** `{timestamp}`  
**Nivel de Confianza:** `{confidence.level}` ({confidence.score}/100)

---

## 1. Datos e Integridad
- **Calidad de Datos:** {data_quality.score}/100
- **Tamaño Muestral ($N$):** {data_quality.sample_size} partidos
- **Datos Faltantes:** {data_quality.missing_data}

## 2. Hechos Comprobados (DATA)
- Rendimiento histórico registrado.
- Métricas de xG y tiros verificados en fuentes primarias.

## 3. Inferencia Estadística (INFERENCE)
- Probabilidad Poisson estimada: `{prediction.probability * 100}%`
- Cuota justa calculada: `@{prediction.fair_odds}`

## 4. Oportunidad de Valor (+EV)
- Cuota del mercado: `@{prediction.market_odds}`
- Ventaja cuantitativa detectada: `+{prediction.edge_ev}%`

## 5. Factores de Riesgo y Validación
{risk_factors}

**Estado de Validación:** `{validation_status}`
