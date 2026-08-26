/**
 * BacktestEngine.ts
 * Backtesting Engine for FIJAS IA Quantitative Prediction Engine.
 * Tests mathematical Poisson models on historical fixtures without lookahead bias.
 */

import { PoissonEngine } from './PoissonEngine';
import { ProbabilityEngine } from './ProbabilityEngine';
import { MarketEvaluator, MarketCandidate } from './MarketEvaluator';
import { SignalDecisionEngine } from './SignalDecisionEngine';
import { MarketOdds } from './OddsProvider';

export interface BacktestMatchRecord {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  actualHomeScore: number;
  actualAwayScore: number;
  preMatchOdds: MarketOdds[];
}

export interface BacktestResult {
  totalMatchesTested: number;
  betsPlaced: number;
  noBets: number;
  wonBets: number;
  lostBets: number;
  pushBets: number;
  winRate: number;
  totalUnitsStaked: number;
  netUnitsProfit: number;
  yieldRoi: number;
  averageOdds: number;
  maxDrawdownUnits: number;
}

export class BacktestEngine {
  public static runSimulation(matches: BacktestMatchRecord[]): BacktestResult {
    let betsPlaced = 0;
    let noBets = 0;
    let wonBets = 0;
    let lostBets = 0;
    let pushBets = 0;
    let totalUnitsStaked = 0;
    let netUnitsProfit = 0;
    let oddsSum = 0;
    let peakUnits = 0;
    let maxDrawdown = 0;

    for (const match of matches) {
      // 1. Calculate xG strictly from historical pre-match priors
      const xg = PoissonEngine.calculateExpectedGoals(match.homeTeam, match.awayTeam, match.league);
      const matrix = PoissonEngine.generateScoreMatrix(xg.lambdaHome, xg.lambdaAway);
      const probs = ProbabilityEngine.calculateFromMatrix(matrix);

      // 2. Evaluate markets against pre-match odds
      const candidates = MarketEvaluator.evaluateAll(match.homeTeam, match.awayTeam, probs, match.preMatchOdds);
      const decision = SignalDecisionEngine.decide(candidates, match.homeTeam, match.awayTeam, xg);

      if (decision.decision !== 'APPROVED' || !decision.selectedCandidate) {
        noBets++;
        continue;
      }

      betsPlaced++;
      const pick = decision.selectedCandidate;
      const stake = decision.recommendedStakeUnits;
      totalUnitsStaked += stake;
      oddsSum += pick.odds;

      // 3. Settle outcome deterministically against actual score
      const isWon = this.evaluateOutcome(pick, match.actualHomeScore, match.actualAwayScore, match.homeTeam, match.awayTeam);
      if (isWon) {
        wonBets++;
        const profit = stake * (pick.odds - 1);
        netUnitsProfit += profit;
      } else {
        lostBets++;
        netUnitsProfit -= stake;
      }

      if (netUnitsProfit > peakUnits) {
        peakUnits = netUnitsProfit;
      }
      const dd = peakUnits - netUnitsProfit;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
    }

    const settledCount = wonBets + lostBets;
    const winRate = settledCount > 0 ? Number(((wonBets / settledCount) * 100).toFixed(2)) : 0;
    const yieldRoi = totalUnitsStaked > 0 ? Number(((netUnitsProfit / totalUnitsStaked) * 100).toFixed(2)) : 0;
    const averageOdds = betsPlaced > 0 ? Number((oddsSum / betsPlaced).toFixed(2)) : 0;

    return {
      totalMatchesTested: matches.length,
      betsPlaced,
      noBets,
      wonBets,
      lostBets,
      pushBets,
      winRate,
      totalUnitsStaked: Number(totalUnitsStaked.toFixed(2)),
      netUnitsProfit: Number(netUnitsProfit.toFixed(2)),
      yieldRoi,
      averageOdds,
      maxDrawdownUnits: Number(maxDrawdown.toFixed(2))
    };
  }

  private static evaluateOutcome(
    pick: MarketCandidate, 
    homeScore: number, 
    awayScore: number,
    homeTeam: string,
    awayTeam: string
  ): boolean {
    const sel = pick.selection.toLowerCase();
    if (pick.market_type === 'MONEYLINE') {
      if (sel.includes(homeTeam.toLowerCase()) || sel.includes('(1)')) return homeScore > awayScore;
      if (sel.includes('empate') || sel.includes('(x)')) return homeScore === awayScore;
      if (sel.includes(awayTeam.toLowerCase()) || sel.includes('(2)')) return awayScore > homeScore;
    }
    if (pick.market_type === 'DOUBLE_CHANCE') {
      if (sel.includes('1x')) return homeScore >= awayScore;
      if (sel.includes('x2')) return awayScore >= homeScore;
      if (sel.includes('12')) return homeScore !== awayScore;
    }
    if (pick.market_type === 'OVER_UNDER_GOALS' && pick.line !== null) {
      const total = homeScore + awayScore;
      if (sel.includes('más') || sel.includes('over')) return total > pick.line;
      if (sel.includes('menos') || sel.includes('under')) return total < pick.line;
    }
    if (pick.market_type === 'BTTS') {
      const btts = homeScore > 0 && awayScore > 0;
      if (sel.includes('sí') || sel.includes('yes')) return btts;
      if (sel.includes('no')) return !btts;
    }
    return false;
  }
}
