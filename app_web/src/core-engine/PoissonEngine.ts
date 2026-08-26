/**
 * PoissonEngine.ts
 * Bivariate Poisson Model & Dixon-Coles Formulation for Sports Match Outcome Probability Estimation.
 * Computes exact lambda expectations and full 7x7 score probability matrices.
 */

import { HistoricalStatsRepository, TeamHistoricalStats, LeagueAverages } from './HistoricalStatsRepository';

export interface ExpectedGoalsLambda {
  lambdaHome: number;
  lambdaAway: number;
  attackStrengthHome: number;
  defenseWeaknessAway: number;
  attackStrengthAway: number;
  defenseWeaknessHome: number;
}

export class PoissonEngine {
  public static readonly MAX_GOALS = 6; // 0 to 6 goals (7x7 matrix)

  /**
   * Calculates Poisson PMF: P(X = k) = (lambda^k * e^-lambda) / k!
   */
  public static poissonPmf(k: number, lambda: number): number {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    let factorial = 1;
    for (let i = 2; i <= k; i++) {
      factorial *= i;
    }
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
  }

  /**
   * Computes expected goals (lambda_home, lambda_away) using Dixon-Coles model
   */
  public static calculateExpectedGoals(
    homeTeam: string,
    awayTeam: string,
    league: string
  ): ExpectedGoalsLambda {
    const statsRepo = HistoricalStatsRepository.getInstance();
    const leagueAvg = statsRepo.getLeagueAverages(league);
    const homeStats = statsRepo.getTeamStats(homeTeam, league);
    const awayStats = statsRepo.getTeamStats(awayTeam, league);

    const avgLgHome = Math.max(leagueAvg.avgHomeGoals, 0.2);
    const avgLgAway = Math.max(leagueAvg.avgAwayGoals, 0.2);

    // Home attack strength: (home goals scored per game) / (league avg home goals)
    const homeGfPerGame = homeStats && homeStats.homeMatches > 0 
      ? homeStats.homeGoalsScored / homeStats.homeMatches 
      : avgLgHome;
    const attackHome = homeGfPerGame / avgLgHome;

    // Away defense weakness: (away goals conceded per game) / (league avg home goals)
    const awayGaPerGame = awayStats && awayStats.awayMatches > 0
      ? awayStats.awayGoalsConceded / awayStats.awayMatches
      : avgLgHome;
    const defenseAway = awayGaPerGame / avgLgHome;

    // lambda_home = attackHome * defenseAway * avgLgHome
    let lambdaHome = attackHome * defenseAway * avgLgHome;

    // Away attack strength
    const awayGfPerGame = awayStats && awayStats.awayMatches > 0
      ? awayStats.awayGoalsScored / awayStats.awayMatches
      : avgLgAway;
    const attackAway = awayGfPerGame / avgLgAway;

    // Home defense weakness
    const homeGaPerGame = homeStats && homeStats.homeMatches > 0
      ? homeStats.homeGoalsConceded / homeStats.homeMatches
      : avgLgAway;
    const defenseHome = homeGaPerGame / avgLgAway;

    // lambda_away = attackAway * defenseHome * avgLgAway
    let lambdaAway = attackAway * defenseHome * avgLgAway;

    // Safe mathematical bounds to prevent wild outliers
    lambdaHome = Math.min(Math.max(lambdaHome, 0.2), 4.5);
    lambdaAway = Math.min(Math.max(lambdaAway, 0.15), 4.0);

    return {
      lambdaHome: Number(lambdaHome.toFixed(2)),
      lambdaAway: Number(lambdaAway.toFixed(2)),
      attackStrengthHome: Number(attackHome.toFixed(2)),
      defenseWeaknessAway: Number(defenseAway.toFixed(2)),
      attackStrengthAway: Number(attackAway.toFixed(2)),
      defenseWeaknessHome: Number(defenseHome.toFixed(2))
    };
  }

  /**
   * Generates exact (MAX_GOALS+1)x(MAX_GOALS+1) matrix of score probabilities
   */
  public static generateScoreMatrix(lambdaHome: number, lambdaAway: number): number[][] {
    const matrix: number[][] = [];
    let sumProb = 0;

    for (let h = 0; h <= this.MAX_GOALS; h++) {
      matrix[h] = [];
      const pHome = this.poissonPmf(h, lambdaHome);
      for (let a = 0; a <= this.MAX_GOALS; a++) {
        const pAway = this.poissonPmf(a, lambdaAway);
        const pScore = pHome * pAway;
        matrix[h][a] = pScore;
        sumProb += pScore;
      }
    }

    // Normalize matrix so sum equals exactly 1.0
    if (sumProb > 0) {
      for (let h = 0; h <= this.MAX_GOALS; h++) {
        for (let a = 0; a <= this.MAX_GOALS; a++) {
          matrix[h][a] = Number((matrix[h][a] / sumProb).toFixed(6));
        }
      }
    }

    return matrix;
  }
}
