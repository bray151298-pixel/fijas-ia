/**
 * SignalDecisionEngine.ts
 * Multi-criteria ranking, Kelly Criterion stake sizing, and final signal emission decision.
 */

import { MarketCandidate } from './MarketEvaluator';
import { ExpectedGoalsLambda } from './PoissonEngine';

export interface DecisionResult {
  decision: 'APPROVED' | 'NO_BET' | 'NO_EMIT_SIGNAL';
  decision_reason: string;
  selectedCandidate: MarketCandidate | null;
  recommendedStakeUnits: number;
  recommendedStakeSoles: number;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  analysisSummary: string;
  reasoningBulletPoints: string[];
}

export class SignalDecisionEngine {
  public static readonly MIN_EV_THRESHOLD = 0.03; // +3% Expected Value
  public static readonly MIN_CONFIDENCE_THRESHOLD = 50.0; // 50% Model Probability
  public static readonly MAX_STAKE_UNITS = 2.5; // Max 2.5 units ceiling
  public static readonly SOLES_PER_UNIT = 50.0;

  public static decide(
    candidates: MarketCandidate[],
    homeTeam: string,
    awayTeam: string,
    xg: ExpectedGoalsLambda
  ): DecisionResult {
    if (!candidates || candidates.length === 0) {
      return {
        decision: 'NO_BET',
        decision_reason: 'No se pudieron mapear candidatos de cuotas válidos contra el modelo.',
        selectedCandidate: null,
        recommendedStakeUnits: 0,
        recommendedStakeSoles: 0,
        riskLevel: 'ALTO',
        analysisSummary: 'Sin candidatos de mercado disponibles.',
        reasoningBulletPoints: []
      };
    }

    // Filter by positive EV and confidence
    const validCandidates = candidates.filter(
      c => c.expected_value >= this.MIN_EV_THRESHOLD && c.confidence >= this.MIN_CONFIDENCE_THRESHOLD
    );

    if (validCandidates.length === 0) {
      return {
        decision: 'NO_BET',
        decision_reason: `Ningún mercado superó los umbrales mínimos (+EV > ${(this.MIN_EV_THRESHOLD * 100).toFixed(0)}% y Confianza > ${this.MIN_CONFIDENCE_THRESHOLD}%).`,
        selectedCandidate: null,
        recommendedStakeUnits: 0,
        recommendedStakeSoles: 0,
        riskLevel: 'ALTO',
        analysisSummary: `Las cuotas del mercado están ajustadas eficientemente para ${homeTeam} vs ${awayTeam}; el modelo no detecta desajuste rentable.`,
        reasoningBulletPoints: [
          `Cuotas de mercado reflejan fielmente la probabilidad estimada (EV promedio: ${(candidates.reduce((a, b) => a + b.expected_value, 0) / candidates.length * 100).toFixed(1)}%).`,
          'Principio cuantitativo de preservación de capital: abstención de apuesta.'
        ]
      };
    }

    // Rank candidates by composite score: EV * 0.6 + Confidence * 0.4
    validCandidates.sort((a, b) => {
      const scoreA = (a.expected_value * 100) * 0.6 + a.confidence * 0.4;
      const scoreB = (b.expected_value * 100) * 0.6 + b.confidence * 0.4;
      return scoreB - scoreA;
    });

    const top = validCandidates[0];

    // Fractional Kelly Criterion (1/4 Kelly): (EV / (odds - 1)) * 0.25
    const kellyFraction = (top.expected_value / (top.odds - 1)) * 0.25;
    let stakeUnits = Number((kellyFraction * 10).toFixed(1));
    stakeUnits = Math.min(Math.max(stakeUnits, 1.0), this.MAX_STAKE_UNITS);
    const stakeSoles = Number((stakeUnits * this.SOLES_PER_UNIT).toFixed(1));

    const riskLevel: 'BAJO' | 'MEDIO' | 'ALTO' = 
      top.confidence >= 75 ? 'BAJO' : top.confidence >= 65 ? 'MEDIO' : 'ALTO';

    const analysisSummary = `${homeTeam} proyecta una expectativa de ${xg.lambdaHome} xG frente a ${xg.lambdaAway} xG de ${awayTeam}. Desajuste detectado en ${top.selection} con +${(top.expected_value * 100).toFixed(1)}% EV.`;

    const reasoningBulletPoints = [
      `Modelo de Poisson Dixon-Coles proyecta ${top.confidence}% de probabilidad para "${top.selection}".`,
      `Cuota ofrecida en ${top.bookmaker} (@${top.odds}) supera la cuota justa calculada (@${top.fairOdds}), generando un Edge de +${top.edge_percentage}%.`,
      `Gestión de banca: Criterio de Kelly fraccional recomienda stake conservador de ${stakeUnits} unidades (S/ ${stakeSoles}).`
    ];

    return {
      decision: 'APPROVED',
      decision_reason: `Aprobado por algoritmo cuantitativo (+EV: +${(top.expected_value * 100).toFixed(1)}%, Conf: ${top.confidence}% en ${top.bookmaker}).`,
      selectedCandidate: top,
      recommendedStakeUnits: stakeUnits,
      recommendedStakeSoles: stakeSoles,
      riskLevel,
      analysisSummary,
      reasoningBulletPoints
    };
  }
}
