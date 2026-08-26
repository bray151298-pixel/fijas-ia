/**
 * DataQualityValidator.ts
 * Evaluates the empirical quality and completeness of data before signal generation.
 * Enforces NO_EMIT_SIGNAL on missing odds, stale data, or insufficient historical sample sizes.
 */

import { SportEvent } from './EventNormalizer';
import { MarketOdds } from './OddsProvider';
import { HistoricalStatsRepository } from './HistoricalStatsRepository';
import { TimeService } from './TimeService';

export interface DataQualityReport {
  score: number; // 0 to 100
  isValid: boolean;
  sampleSize: number;
  oddsFreshnessSeconds: number;
  reason: string;
}

export class DataQualityValidator {
  public static readonly MIN_QUALITY_SCORE = 70;
  public static readonly MAX_ODDS_AGE_SECONDS = 1800; // 30 minutes
  public static readonly MIN_SAMPLE_MATCHES = 5;

  public static validate(event: SportEvent, odds: MarketOdds[]): DataQualityReport {
    // 1. Odds availability check
    if (!odds || odds.length === 0) {
      return {
        score: 0,
        isValid: false,
        sampleSize: 0,
        oddsFreshnessSeconds: 0,
        reason: 'NO_EMIT_SIGNAL: No se encontraron cuotas de mercado reales verificables para este evento.'
      };
    }

    // 2. Odds freshness check
    const newestOdd = odds[0];
    const oddsAge = TimeService.getAgeSeconds(newestOdd.timestamp_utc);
    if (oddsAge > this.MAX_ODDS_AGE_SECONDS) {
      return {
        score: 30,
        isValid: false,
        sampleSize: 0,
        oddsFreshnessSeconds: oddsAge,
        reason: `NO_EMIT_SIGNAL: Cuotas desactualizadas (${oddsAge}s supera límite de ${this.MAX_ODDS_AGE_SECONDS}s).`
      };
    }

    // 3. Historical sample size check
    const statsRepo = HistoricalStatsRepository.getInstance();
    const homeStats = statsRepo.getTeamStats(event.home_team, event.league);
    const awayStats = statsRepo.getTeamStats(event.away_team, event.league);

    const homeSample = homeStats ? homeStats.matchesPlayed : 0;
    const awaySample = awayStats ? awayStats.matchesPlayed : 0;
    const minSample = Math.min(homeSample, awaySample);

    if (minSample < this.MIN_SAMPLE_MATCHES) {
      return {
        score: 45,
        isValid: false,
        sampleSize: minSample,
        oddsFreshnessSeconds: oddsAge,
        reason: `NO_EMIT_SIGNAL: Muestra histórica insuficiente (${minSample} partidos < ${this.MIN_SAMPLE_MATCHES}).`
      };
    }

    // Score calculation
    let score = 70; // Base score for having valid odds & stats
    if (minSample >= 15) score += 15;
    else if (minSample >= 10) score += 10;

    if (oddsAge < 300) score += 15; // Under 5 min freshness
    else if (oddsAge < 900) score += 10;

    return {
      score: Math.min(score, 100),
      isValid: score >= this.MIN_QUALITY_SCORE,
      sampleSize: minSample,
      oddsFreshnessSeconds: oddsAge,
      reason: 'OK: Datos de alta calidad para análisis cuantitativo.'
    };
  }
}
