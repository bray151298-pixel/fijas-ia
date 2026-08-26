/**
 * OddsNormalizer.ts
 * Normalizes bookmaker odds, calculates implied probabilities, and performs devigging.
 */

import { MarketOdds } from './OddsProvider';

export class OddsNormalizer {
  /**
   * Calculates implied probability: 1 / odds
   */
  public static calculateImpliedProbability(odds: number): number {
    if (odds <= 1.0) return 0;
    return Number((1 / odds).toFixed(4));
  }

  /**
   * Devigs a 2-way or 3-way market to remove bookmaker margin:
   * P_fair = (1 / odds_k) / sum(1 / odds_i)
   */
  public static devigOdds(oddsList: number[]): number[] {
    const rawSum = oddsList.reduce((acc, o) => acc + (o > 1 ? 1 / o : 0), 0);
    if (rawSum <= 0) return oddsList.map(() => 0);
    return oddsList.map(o => o > 1 ? Number(((1 / o) / rawSum).toFixed(4)) : 0);
  }
}
