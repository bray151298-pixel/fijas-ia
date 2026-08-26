/**
 * ProbabilityEngine.ts
 * Translates score probability matrices into standard sports betting market probabilities:
 * 1X2, Over/Under (0.5 - 3.5), BTTS (Yes/No), and Double Chance (1X, X2, 12).
 */

import { PoissonEngine } from './PoissonEngine';

export interface MarketProbabilities {
  pHomeWin: number;
  pDraw: number;
  pAwayWin: number;
  pDoubleChance1X: number;
  pDoubleChanceX2: number;
  pDoubleChance12: number;
  pOver05: number;
  pUnder05: number;
  pOver15: number;
  pUnder15: number;
  pOver25: number;
  pUnder25: number;
  pOver35: number;
  pUnder35: number;
  pBttsYes: number;
  pBttsNo: number;
}

export class ProbabilityEngine {
  public static calculateFromMatrix(matrix: number[][]): MarketProbabilities {
    let pHomeWin = 0;
    let pDraw = 0;
    let pAwayWin = 0;

    let pOver05 = 0;
    let pOver15 = 0;
    let pOver25 = 0;
    let pOver35 = 0;

    let pBttsYes = 0;

    const maxG = matrix.length - 1;

    for (let h = 0; h <= maxG; h++) {
      for (let a = 0; a <= maxG; a++) {
        const p = matrix[h][a] || 0;
        const totalGoals = h + a;

        if (h > a) pHomeWin += p;
        else if (h === a) pDraw += p;
        else pAwayWin += p;

        if (totalGoals > 0.5) pOver05 += p;
        if (totalGoals > 1.5) pOver15 += p;
        if (totalGoals > 2.5) pOver25 += p;
        if (totalGoals > 3.5) pOver35 += p;

        if (h > 0 && a > 0) pBttsYes += p;
      }
    }

    const pUnder05 = Number((1 - pOver05).toFixed(4));
    const pUnder15 = Number((1 - pOver15).toFixed(4));
    const pUnder25 = Number((1 - pOver25).toFixed(4));
    const pUnder35 = Number((1 - pOver35).toFixed(4));
    const pBttsNo = Number((1 - pBttsYes).toFixed(4));

    const pDoubleChance1X = Number((pHomeWin + pDraw).toFixed(4));
    const pDoubleChanceX2 = Number((pDraw + pAwayWin).toFixed(4));
    const pDoubleChance12 = Number((pHomeWin + pAwayWin).toFixed(4));

    return {
      pHomeWin: Number(pHomeWin.toFixed(4)),
      pDraw: Number(pDraw.toFixed(4)),
      pAwayWin: Number(pAwayWin.toFixed(4)),
      pDoubleChance1X,
      pDoubleChanceX2,
      pDoubleChance12,
      pOver05: Number(pOver05.toFixed(4)),
      pUnder05,
      pOver15: Number(pOver15.toFixed(4)),
      pUnder15,
      pOver25: Number(pOver25.toFixed(4)),
      pUnder25,
      pOver35: Number(pOver35.toFixed(4)),
      pUnder35,
      pBttsYes: Number(pBttsYes.toFixed(4)),
      pBttsNo
    };
  }
}
