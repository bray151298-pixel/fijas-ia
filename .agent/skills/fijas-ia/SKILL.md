---
name: fijas-ia
description: Master quantitative sports analytics, research, data verification, feature engineering, and statistical prediction orchestrator. Integrates and orchestrates research, data-analysis, research-lab, and web-research skills for rigorous, evidence-grounded decision making.
version: 2.0.0
tags:
  - quantitative-analysis
  - sports-analytics
  - predictive-modeling
  - data-validation
  - value-betting
---

# FIJAS IA — Master Quantitative Sports Analytics Orchestrator

## Overview

`fijas-ia` is the primary orchestrating agent skill for the **FIJAS IA Quantitative Sports Analytics Platform**. It provides an end-to-end, evidence-grounded workflow to ingest, clean, validate, analyze, model, and audit multi-sport data (Football, Baseball MLB, Basketball NBA/WNBA, Tennis).

This skill strictly forbids intuition-only or ungrounded model outputs. Every prediction, report, or signal must pass rigorous mathematical and empirical validation gates.

---

## Complete Orchestration Pipeline

The master pipeline consists of 9 strictly sequential stages:

```
┌───────────────────────────────────────────────────────────┐
│                      1. RESEARCH                          │
│   (Domain inquiry, baseline rules via 'research' skill)   │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                   2. DATA COLLECTION                      │
│ (ESPN API, SQLite tipster.db, web feeds, CSV/JSON sources) │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                   3. DATA VALIDATION                      │
│ (Data cleaning, schema check, missing data & sample size)  │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    4. DATA ANALYSIS                       │
│ (Descriptive stats, distributions, temporal series, trends)│
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                 5. FEATURE ENGINEERING                    │
│   (xG delta, offensive/defensive ratings, rest, form)     │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                  6. PATTERN DETECTION                     │
│    (Statistical anomalies, +EV discrepancies vs books)    │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                   7. MODEL ANALYSIS                       │
│    (Poisson Distribution, Kelly Criterion, ML Scoring)    │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                 8. CONFIDENCE SCORING                     │
│ (HIGH / MEDIUM / LOW / INSUFFICIENT_DATA classification)  │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    9. FINAL REPORT                        │
│   (Structured JSON schema & Markdown evidence dossier)    │
└───────────────────────────────────────────────────────────┘
```

---

## Core External Skills Orchestration

`fijas-ia` coordinates the following specialized agent skills installed in `.agent/skills/`:

1. **`research`**: Investigates primary sources (official league regulations, squad depth, verified news) and cites claims.
2. **`data-analysis`**: Loads, cleans, and computes statistical summaries, correlations, regressions, and dataset audits using `validate_dataset.py`.
3. **`research-lab`**: Structures the scientific decision process:
   `PREGUNTA ➔ HIPÓTESIS ➔ DATOS DISPONIBLES ➔ INVESTIGACIÓN ➔ ALTERNATIVAS ➔ COMPARACIÓN ➔ DECISIÓN ➔ VALIDACIÓN`.
4. **`web-research`**: Performs targeted schema-driven external web checks to confirm line-ups, weather conditions, referee assignments, and sudden roster changes.

---

## Strict Validation & Anti-Hallucination Rules

1. **Never conclude from AI model output alone**: A machine learning or neural prediction is only an indicator, not a final proof.
2. **Strict Data Separation**:
   - **DATA (Hechos Comprobados)**: Real historical scores, actual recorded shots/xG, verified odds.
   - **INFERENCE (Inferencia Estadística)**: Poisson probabilities, calculated goal expectancies.
   - **HYPOTHESIS (Hipótesis de Valor)**: Market inefficiency (+EV) or tactical matchup thesis.
3. **Never fabricate missing data**: If data is incomplete or sample size is below threshold ($N < 5$), declare `INSUFFICIENT_DATA` immediately.
4. **Risk Factor Identification**: Always report potential invalidating factors (e.g., weather storms, manager changes, key player injury, extreme variance).

---

## Standard Output Schema

Every quantitative analysis executed by `fijas-ia` must produce a structured output conforming to:

```json
{
  "analysis_id": "ANL-20260824-001",
  "timestamp": "2026-08-24T23:15:00Z",
  "data_quality": {
    "score": 95,
    "missing_data": false,
    "sample_size": 28
  },
  "model": {
    "name": "Poisson-Kelly Neural Ensemble",
    "version": "4.2.0"
  },
  "prediction": {
    "outcome": "Osasuna 1X & Under 3.5",
    "probability": 0.74,
    "fair_odds": 1.35,
    "market_odds": 1.75,
    "edge_ev": 12.4
  },
  "confidence": {
    "score": 88,
    "level": "HIGH"
  },
  "risk_factors": [
    "Possible tactical rotation in second half"
  ],
  "validation_status": "PASSED"
}
```

Confidence Levels:
- **`HIGH`** (Score $\ge 80$): Sample size $\ge 15$, missing data $= 0$, clear edge $\ge 10\%$, Poisson/Kelly calibrated.
- **`MEDIUM`** (Score $60-79$): Sample size $8-14$, minor uncertainty, edge $6-9.9\%$.
- **`LOW`** (Score $40-59$): High variance, sample size $5-7$, marginal edge $< 6\%$.
- **`INSUFFICIENT_DATA`** (Score $< 40$): Sample size $< 5$, unverified starting lineups, high missingness.

---

## Workflows Index

- [`workflows/research.md`](./workflows/research.md): Research methodology.
- [`workflows/collect-data.md`](./workflows/collect-data.md): Data ingestion procedures.
- [`workflows/validate-data.md`](./workflows/validate-data.md): Integrity and missingness checks.
- [`workflows/analyze-data.md`](./workflows/analyze-data.md): Statistical modeling and temporal distributions.
- [`workflows/feature-engineering.md`](./workflows/feature-engineering.md): Sports feature extraction.
- [`workflows/detect-patterns.md`](./workflows/detect-patterns.md): Market discrepancy detection.
- [`workflows/evaluate-model.md`](./workflows/evaluate-model.md): Calibration and backtesting validation.
- [`workflows/generate-report.md`](./workflows/generate-report.md): Final audit report generation.
