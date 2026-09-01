/**
 * AnalysisEngine.ts
 * 100% Deterministic Quantitative Predictive Engine for FIJAS IA.
 * Zero hardcoding: Computes Dixon-Coles Poisson distributions, evaluates real bookmaker odds,
 * validates data quality scores, and enforces NO_EMIT_SIGNAL on unproven mathematical edges.
 */

import { SportEvent } from './EventNormalizer';
import { SignalEntity, SignalEnvironment } from './SignalEntity';
import { TimeService } from './TimeService';
import { PoissonEngine } from './PoissonEngine';
import { ProbabilityEngine } from './ProbabilityEngine';
import { OddsProvider } from './OddsProvider';
import { MarketEvaluator } from './MarketEvaluator';
import { DataQualityValidator } from './DataQualityValidator';
import { SignalDecisionEngine, DecisionResult } from './SignalDecisionEngine';
import { HistoricalStatsRepository } from './HistoricalStatsRepository';

export class AnalysisEngine {
  public static readonly MODEL_VERSION = 'Poisson-DixonColes-v2.5';

  /**
   * Evaluates a sports event with the complete quantitative pipeline
   */
  public static async analyzeEventAsync(event: SportEvent): Promise<{
    decisionResult: DecisionResult;
    dataQualityScore: number;
    sampleSize: number;
    lambdaHome: number;
    lambdaAway: number;
  }> {
    const oddsProvider = OddsProvider.getInstance();
    const statsRepo = HistoricalStatsRepository.getInstance();

    // 1. Fetch real bookmaker odds
    const oddsList = await oddsProvider.getOddsForEvent(event);

    // 2. Validate data quality
    const dqReport = DataQualityValidator.validate(event, oddsList);
    if (!dqReport.isValid) {
      return {
        decisionResult: {
          decision: 'NO_EMIT_SIGNAL',
          decision_reason: dqReport.reason,
          selectedCandidate: null,
          recommendedStakeUnits: 0,
          recommendedStakeSoles: 0,
          riskLevel: 'ALTO',
          analysisSummary: dqReport.reason,
          reasoningBulletPoints: [dqReport.reason]
        },
        dataQualityScore: dqReport.score,
        sampleSize: dqReport.sampleSize,
        lambdaHome: 0,
        lambdaAway: 0
      };
    }

    // 3. Calculate Poisson expected goals (lambda_home, lambda_away) from historical stats
    const xg = PoissonEngine.calculateExpectedGoals(event.home_team, event.away_team, event.league);
    const scoreMatrix = PoissonEngine.generateScoreMatrix(xg.lambdaHome, xg.lambdaAway);
    const probs = ProbabilityEngine.calculateFromMatrix(scoreMatrix);

    // 4. Evaluate all available markets against real bookmaker odds
    const candidates = MarketEvaluator.evaluateAll(event.home_team, event.away_team, probs, oddsList);

    // 5. Run multi-criteria decision & fractional Kelly stake sizing
    const decisionResult = SignalDecisionEngine.decide(candidates, event.home_team, event.away_team, xg);

    return {
      decisionResult,
      dataQualityScore: dqReport.score,
      sampleSize: dqReport.sampleSize,
      lambdaHome: xg.lambdaHome,
      lambdaAway: xg.lambdaAway
    };
  }

  /**
   * Synchronous adapter (returns null or NO_BET Signal if conditions not met)
   */
  public static createSignalFromEvent(
    event: SportEvent, 
    index: number = 1, 
    env: SignalEnvironment = 'PRODUCTION'
  ): SignalEntity | null {
    // 1. Calculate Poisson directly
    const xg = PoissonEngine.calculateExpectedGoals(event.home_team, event.away_team, event.league);
    const scoreMatrix = PoissonEngine.generateScoreMatrix(xg.lambdaHome, xg.lambdaAway);
    const probs = ProbabilityEngine.calculateFromMatrix(scoreMatrix);

    // 2. Map odds
    const oddsProvider = OddsProvider.getInstance();
    const oddsList = oddsProvider.getOddsForEventSync(event);

    const dqReport = DataQualityValidator.validate(event, oddsList);
    if (!dqReport.isValid) {
      return null; // Enforces NO_EMIT_SIGNAL
    }

    const candidates = MarketEvaluator.evaluateAll(event.home_team, event.away_team, probs, oddsList);
    const decision = SignalDecisionEngine.decide(candidates, event.home_team, event.away_team, xg);

    if (decision.decision !== 'APPROVED' || !decision.selectedCandidate) {
      return null; // Enforces NO_BET when EV is negative or below threshold
    }

    const pick = decision.selectedCandidate;
    const dateKey = TimeService.getLimaDateIsoFormat(event.start_time_utc);
    const indexStr = String(index).padStart(3, '0');
    const signalId = `SIG_${dateKey}_${indexStr}`;

    return {
      signal_id: signalId,
      environment: env,
      event_id: event.event_id,
      provider_event_id: event.provider_event_id,
      sport: event.sport,
      league: event.league,
      home_team: event.home_team,
      away_team: event.away_team,
      event_start_utc: event.start_time_utc,
      event_start_local: event.start_time_local,
      market_type: pick.market_type,
      selection: pick.selection,
      line: pick.line,
      odds: pick.odds,
      fair_odds: pick.fair_odds,
      edge_percentage: pick.edge_percentage,
      confidence: pick.confidence,
      risk_level: decision.riskLevel,
      recommended_stake_units: decision.recommendedStakeUnits,
      recommended_stake_soles: decision.recommendedStakeSoles,
      analysis_summary: decision.analysisSummary,
      reasoning_bullet_points: decision.reasoningBulletPoints,
      status: 'PENDING',
      model_version: this.MODEL_VERSION,
      data_timestamp: TimeService.nowUtc(),
      odds_timestamp: oddsList[0]?.timestamp_utc || TimeService.nowUtc(),
      bookmaker: pick.bookmaker,
      model_probability: pick.model_probability,
      implied_probability: pick.implied_probability,
      expected_value: pick.expected_value,
      data_quality_score: dqReport.score,
      historical_sample_size: dqReport.sampleSize,
      lambda_home: xg.lambdaHome,
      lambda_away: xg.lambdaAway,
      decision: 'APPROVED',
      decision_reason: decision.decision_reason,
      created_at_utc: TimeService.nowUtc(),
      published_at_utc: null,
      telegram_message_id: null,
      result_status: 'UNRESOLVED',
      settled_at_utc: null,
      actual_home_score: null,
      actual_away_score: null,
      settlement_reason: null,
      units_net_profit: 0,
      soles_net_profit: 0
    };
  }
}
