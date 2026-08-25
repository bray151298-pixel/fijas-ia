# Guía de Arquitectura de FIJAS IA

## Integración de Componentes
1. **Frontend / Dashboard**: React 18 + Tailwind CSS + Lucide Icons (`app_web/src/`).
2. **Backend API**: Express TypeScript (`app_web/server.ts`) sirviendo endpoints `/api/matches`, `/api/live-scanner`, `/api/autopilot`.
3. **Motor Cuantitativo Python**: Algoritmos de Poisson (`analisis/poisson.py`), Kelly y Valor Cuantitativo (`analisis/value_betting.py`).
4. **Skills Engine**: Directorio `.agent/skills/` conteniendo `research`, `data-analysis`, `research-lab`, `web-research` y `fijas-ia`.
