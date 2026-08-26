/**
 * SignalEntity.ts
 * Enterprise Quantitative Signal Entity for FIJAS IA Single Source of Truth
 */

import { SportCategory, MarketType } from './MarketRulesRegistry';

export type SignalEnvironment = 'PRODUCTION' | 'TEST' | 'HISTORICAL' | 'SHADOW';

export type SignalStatus = 
  | 'ANALYZED'
  | 'NO_BET'
  | 'NO_EMIT_SIGNAL'
  | 'CANDIDATE'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'PENDING'
  | 'UPCOMING'
  | 'LIVE'
  | 'FINALIZING'
  | 'WON'
  | 'LOST'
  | 'PUSH'
  | 'VOID';

export type ResultStatus = 'UNRESOLVED' | 'WON' | 'LOST' | 'PUSH' | 'VOID';

export interface SignalEntity {
  signal_id: string;              // Deterministic ID: SIG_YYYYMMDD_XXXX
  environment: SignalEnvironment; // PRODUCTION | TEST | HISTORICAL | SHADOW
  event_id: string;               // EVT_YYYYMMDD_HOME_AWAY
  provider_event_id: string;      // ESPN ID
  sport: SportCategory;
  league: string;
  home_team: string;
  away_team: string;
  event_start_utc: string;
  event_start_local: string;
  market_type: MarketType;
  selection: string;              // Exact selection text
  line: number | null;            // e.g. 1.5, 8.5, -4.5
  odds: number;                   // Real verified bookmaker odds
  fair_odds: number;              // 1 / Model Probability
  edge_percentage: number;        // e.g. +12.4%
  confidence: number;             // Model Probability in %
  risk_level: 'BAJO' | 'MEDIO' | 'ALTO';
  recommended_stake_units: number;// Dynamic Fractional Kelly Stake
  recommended_stake_soles: number;
  analysis_summary: string;
  reasoning_bullet_points: string[];
  status: SignalStatus;
  
  // Enterprise Quantitative Provenance Metadata
  model_version?: string;
  data_timestamp?: string;
  odds_timestamp?: string;
  bookmaker?: string;
  model_probability?: number;
  implied_probability?: number;
  expected_value?: number;
  data_quality_score?: number;
  historical_sample_size?: number;
  lambda_home?: number;
  lambda_away?: number;
  decision?: 'APPROVED' | 'NO_BET' | 'NO_EMIT_SIGNAL';
  decision_reason?: string;

  created_at_utc: string;
  published_at_utc: string | null;
  telegram_message_id: number | null;
  result_status: ResultStatus;
  settled_at_utc: string | null;
  actual_home_score: number | null;
  actual_away_score: number | null;
  settlement_reason: string | null;
  units_net_profit: number;
  soles_net_profit: number;
}
