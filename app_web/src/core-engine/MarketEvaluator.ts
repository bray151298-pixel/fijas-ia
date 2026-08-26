/**
 * MarketEvaluator.ts
 * Rigorously evaluates all sports markets against Poisson probability distributions.
 * Computes Fair Odds, Expected Value (EV), Edge %, and Uncertainty for each market candidate.
 */

import { MarketType } from './MarketRulesRegistry';
import { MarketOdds } from './OddsProvider';
import { MarketProbabilities } from './ProbabilityEngine';
import { OddsNormalizer } from './OddsNormalizer';

export interface MarketCandidate {
  market_type: MarketType;
  selection: string;
  line: number | null;
  bookmaker: string;
  odds: number;
  model_probability: number;
  implied_probability: number;
  fair_odds: number;
  expected_value: number; // EV = (P_model * odds) - 1
  edge_percentage: number; // (P_model - P_implied) * 100
  confidence: number;
  uncertainty: number;
}

export class MarketEvaluator {
  public static evaluateAll(
    homeTeam: string,
    awayTeam: string,
    probs: MarketProbabilities,
    oddsList: MarketOdds[]
  ): MarketCandidate[] {
    const candidates: MarketCandidate[] = [];

    for (const item of oddsList) {
      let modelProb = 0;

      // Match model probability based on selection string
      const sel = item.selection.toLowerCase();
      if (item.market_type === 'MONEYLINE') {
        if (sel.includes(homeTeam.toLowerCase()) || sel.includes('(1)')) modelProb = probs.pHomeWin;
        else if (sel.includes('empate') || sel.includes('(x)')) modelProb = probs.pDraw;
        else if (sel.includes(awayTeam.toLowerCase()) || sel.includes('(2)')) modelProb = probs.pAwayWin;
      } else if (item.market_type === 'DOUBLE_CHANCE') {
        if (sel.includes('1x') || (sel.includes(homeTeam.toLowerCase()) && sel.includes('empate'))) modelProb = probs.pDoubleChance1X;
        else if (sel.includes('x2') || (sel.includes(awayTeam.toLowerCase()) && sel.includes('empate'))) modelProb = probs.pDoubleChanceX2;
        else if (sel.includes('12')) modelProb = probs.pDoubleChance12;
      } else if (item.market_type === 'OVER_UNDER_GOALS') {
        if (item.line === 1.5 && (sel.includes('más') || sel.includes('over'))) modelProb = probs.pOver15;
        else if (item.line === 1.5 && (sel.includes('menos') || sel.includes('under'))) modelProb = probs.pUnder15;
        else if (item.line === 2.5 && (sel.includes('más') || sel.includes('over'))) modelProb = probs.pOver25;
        else if (item.line === 2.5 && (sel.includes('menos') || sel.includes('under'))) modelProb = probs.pUnder25;
        else if (item.line === 0.5 && (sel.includes('más') || sel.includes('over'))) modelProb = probs.pOver05;
        else if (item.line === 3.5 && (sel.includes('menos') || sel.includes('under'))) modelProb = probs.pUnder35;
      } else if (item.market_type === 'BTTS') {
        if (sel.includes('sí') || sel.includes('yes')) modelProb = probs.pBttsYes;
        else if (sel.includes('no')) modelProb = probs.pBttsNo;
      }

      if (modelProb > 0 && item.odds > 1.0) {
        const impliedProb = OddsNormalizer.calculateImpliedProbability(item.odds);
        const fairOdds = Number((1 / modelProb).toFixed(2));
        const ev = Number(((modelProb * item.odds) - 1).toFixed(4));
        const edge = Number(((modelProb - impliedProb) * 100).toFixed(2));
        const confidence = Number((modelProb * 100).toFixed(1));
        const uncertainty = Number((Math.sqrt(modelProb * (1 - modelProb)) * 100).toFixed(1));

        candidates.push({
          market_type: item.market_type,
          selection: item.selection,
          line: item.line,
          bookmaker: item.bookmaker,
          odds: item.odds,
          model_probability: Number(modelProb.toFixed(4)),
          implied_probability: impliedProb,
          fair_odds: fairOdds,
          expected_value: ev,
          edge_percentage: edge,
          confidence,
          uncertainty
        });
      }
    }

    return candidates;
  }
}
