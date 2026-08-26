/**
 * ParlayEngine.ts
 * Enterprise Quantitative Parlay (Combinadas) Engine for FIJAS IA.
 * Mathematically constructs independent, high-+EV 2-leg combinadas with joint probability models.
 */

import { SignalEntity, SignalEnvironment } from './SignalEntity';
import { TimeService } from './TimeService';

export interface ParlayLeg {
  signal_id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  event_start_local: string;
  selection: string;
  odds: number;
  model_probability: number;
  bookmaker: string;
}

export interface ParlayEntity {
  parlay_id: string;               // e.g. PARLAY_20260826_01
  environment: SignalEnvironment;
  title: string;                   // "COMBINADA FÚTBOL +EV" | "COMBINADA DE ORO VIP"
  legs: ParlayLeg[];
  total_odds: number;
  joint_probability: number;       // P(A) * P(B)
  fair_odds: number;               // 1 / Joint Probability
  expected_value: number;          // (Joint Prob * Total Odds) - 1
  edge_percentage: number;
  recommended_stake_units: number; // Conservative Kelly for parlays (0.75u - 1.0u)
  recommended_stake_soles: number;
  risk_level: 'BAJO' | 'MEDIO' | 'ALTO';
  status: 'PENDING' | 'UPCOMING' | 'LIVE' | 'WON' | 'LOST' | 'VOID';
  created_at_utc: string;
}

export class ParlayEngine {
  public static readonly MAX_PARLAY_STAKE_UNITS = 1.0;
  public static readonly MIN_PARLAY_EV = 0.05; // Min +5% Joint EV
  public static readonly SOLES_PER_UNIT = 50.0;

  /**
   * Generates optimal +EV parlays from approved single signals
   */
  public static generateOptimalParlays(
    signals: SignalEntity[], 
    env: SignalEnvironment = 'PRODUCTION'
  ): ParlayEntity[] {
    const validSignals = signals.filter(s => 
      s.odds > 1.20 && 
      s.odds <= 2.20 && 
      (s.expected_value || 0) >= 0.02 && 
      s.confidence >= 55.0
    );

    if (validSignals.length < 2) return [];

    const parlays: ParlayEntity[] = [];
    const todayStr = TimeService.getLimaDateIsoFormat(TimeService.nowUtc());

    // 1. Check for Soccer Double (Fútbol + Fútbol)
    const soccerSignals = validSignals.filter(s => s.sport === 'football');
    if (soccerSignals.length >= 2) {
      const legA = soccerSignals[0];
      const legB = soccerSignals[1];
      
      const pA = (legA.model_probability || legA.confidence / 100);
      const pB = (legB.model_probability || legB.confidence / 100);
      const jointProb = Number((pA * pB).toFixed(4));
      const totalOdds = Number((legA.odds * legB.odds).toFixed(2));
      const fairOdds = Number((1 / jointProb).toFixed(2));
      const ev = Number(((jointProb * totalOdds) - 1).toFixed(4));
      const edge = Number(((jointProb - (1 / totalOdds)) * 100).toFixed(1));

      if (ev >= this.MIN_PARLAY_EV) {
        parlays.push({
          parlay_id: `PARLAY_${todayStr}_FUTBOL`,
          environment: env,
          title: 'COMBINADA FÚTBOL +EV',
          legs: [this.toLeg(legA), this.toLeg(legB)],
          total_odds: totalOdds,
          joint_probability: jointProb,
          fair_odds: fairOdds,
          expected_value: ev,
          edge_percentage: edge,
          recommended_stake_units: 1.0,
          recommended_stake_soles: 50.0,
          risk_level: 'MEDIO',
          status: 'PENDING',
          created_at_utc: TimeService.nowUtc()
        });
      }
    }

    // 2. Check for Multi-Sport Gold Parlay (Cross-Sport)
    const nonSoccer = validSignals.filter(s => s.sport !== 'football');
    if (soccerSignals.length >= 1 && nonSoccer.length >= 1) {
      const legA = soccerSignals[0];
      const legB = nonSoccer[0];

      const pA = (legA.model_probability || legA.confidence / 100);
      const pB = (legB.model_probability || legB.confidence / 100);
      const jointProb = Number((pA * pB).toFixed(4));
      const totalOdds = Number((legA.odds * legB.odds).toFixed(2));
      const fairOdds = Number((1 / jointProb).toFixed(2));
      const ev = Number(((jointProb * totalOdds) - 1).toFixed(4));
      const edge = Number(((jointProb - (1 / totalOdds)) * 100).toFixed(1));

      if (ev >= this.MIN_PARLAY_EV) {
        parlays.push({
          parlay_id: `PARLAY_${todayStr}_ORO`,
          environment: env,
          title: 'COMBINADA DE ORO MULTI-DEPORTE',
          legs: [this.toLeg(legA), this.toLeg(legB)],
          total_odds: totalOdds,
          joint_probability: jointProb,
          fair_odds: fairOdds,
          expected_value: ev,
          edge_percentage: edge,
          recommended_stake_units: 0.75,
          recommended_stake_soles: 37.5,
          risk_level: 'MEDIO',
          status: 'PENDING',
          created_at_utc: TimeService.nowUtc()
        });
      }
    }

    return parlays;
  }

  private static toLeg(sig: SignalEntity): ParlayLeg {
    return {
      signal_id: sig.signal_id,
      sport: sig.sport,
      league: sig.league,
      home_team: sig.home_team,
      away_team: sig.away_team,
      event_start_local: sig.event_start_local,
      selection: sig.selection,
      odds: sig.odds,
      model_probability: sig.model_probability || (sig.confidence / 100),
      bookmaker: sig.bookmaker || 'Bet365'
    };
  }
}
