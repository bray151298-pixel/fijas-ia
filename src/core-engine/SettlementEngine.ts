/**
 * SettlementEngine.ts
 * Evaluates the exact original SignalEntity against official verified match scores.
 * Strictly guarantees that no new markets/selections are hallucinated or mutated upon settlement.
 */

import { SignalEntity, ResultStatus } from './SignalEntity';
import { SportEvent } from './EventNormalizer';

export interface SettlementEvaluation {
  result_status: ResultStatus;
  settlement_reason: string;
  units_net: number;
  soles_net: number;
}

export class SettlementEngine {
  public static settle(signal: SignalEntity, event: SportEvent): SettlementEvaluation {
    if (event.home_score === null || event.away_score === null || event.status !== 'FINISHED') {
      return {
        result_status: 'UNRESOLVED',
        settlement_reason: 'El partido no cuenta con marcador oficial final verificado',
        units_net: 0,
        soles_net: 0
      };
    }

    const home = event.home_score;
    const away = event.away_score;
    const totalGoalsOrPoints = home + away;
    const market = signal.market_type;
    const line = signal.line ?? 0;
    const selection = signal.selection;

    let resultStatus: ResultStatus = 'LOST';
    let reason = '';

    if (signal.sport === 'football') {
      if (market === 'DOUBLE_CHANCE') {
        // 1X (Home or Draw)
        if (selection.includes('1X') || selection.toLowerCase().includes('gana o empata')) {
          if (home >= away) {
            resultStatus = 'WON';
            reason = `GANADO: ${event.home_team} (${home} - ${away}) cumplió la condición 1X (Victoria/Empate).`;
          } else {
            resultStatus = 'LOST';
            reason = `PERDIDO: ${event.away_team} ganó ${away} a ${home}. Condición 1X no cumplida.`;
          }
        } else if (selection.includes('X2')) {
          if (away >= home) {
            resultStatus = 'WON';
            reason = `GANADO: ${event.away_team} empató o ganó (${home} - ${away}). Condición X2 cumplida.`;
          } else {
            resultStatus = 'LOST';
            reason = `PERDIDO: ${event.home_team} ganó ${home} a ${away}. Condición X2 no cumplida.`;
          }
        }
      } else if (market === 'MONEYLINE') {
        if (selection.includes(event.home_team)) {
          if (home > away) {
            resultStatus = 'WON';
            reason = `GANADO: ${event.home_team} ganó el partido (${home} - ${away}).`;
          } else {
            resultStatus = 'LOST';
            reason = `PERDIDO: Marcador final ${home} - ${away}.`;
          }
        } else {
          if (away > home) {
            resultStatus = 'WON';
            reason = `GANADO: ${event.away_team} ganó de visita (${home} - ${away}).`;
          } else {
            resultStatus = 'LOST';
            reason = `PERDIDO: Marcador final ${home} - ${away}.`;
          }
        }
      } else if (market === 'OVER_UNDER_GOALS') {
        if (selection.toLowerCase().includes('más') || selection.toLowerCase().includes('over')) {
          if (totalGoalsOrPoints > line) {
            resultStatus = 'WON';
            reason = `GANADO: ${totalGoalsOrPoints} goles totales superaron la línea Over ${line}.`;
          } else {
            resultStatus = 'LOST';
            reason = `PERDIDO: ${totalGoalsOrPoints} goles totales no superaron la línea Over ${line}.`;
          }
        }
      }
    } else if (signal.sport === 'baseball') {
      if (market === 'MONEYLINE') {
        const selLower = selection.toLowerCase();
        const homeLower = event.home_team.toLowerCase();
        const homeWords = homeLower.split(' ');
        const isHome = homeWords.some(w => w.length > 3 && selLower.includes(w)) || selLower.includes(homeLower);
        
        if (isHome) {
          if (home > away) {
            resultStatus = 'WON';
            reason = `GANADO: ${event.home_team} venció ${home} a ${away} a ${event.away_team}.`;
          } else {
            resultStatus = 'LOST';
            reason = `PERDIDO: ${event.away_team} ganó ${away} a ${home}.`;
          }
        } else {
          if (away > home) {
            resultStatus = 'WON';
            reason = `GANADO: ${event.away_team} venció ${away} a ${home}.`;
          } else {
            resultStatus = 'LOST';
            reason = `PERDIDO: Marcador final ${home} a ${away}.`;
          }
        }
      } else if (market === 'OVER_UNDER_RUNS') {
        if (totalGoalsOrPoints > line) {
          resultStatus = 'WON';
          reason = `GANADO: ${totalGoalsOrPoints} carreras totales superaron la línea de ${line}.`;
        } else {
          resultStatus = 'LOST';
          reason = `PERDIDO: ${totalGoalsOrPoints} carreras no alcanzaron la línea de ${line}.`;
        }
      }
    } else if (signal.sport === 'basketball') {
      if (market === 'POINT_SPREAD') {
        const pointDiff = home - away;
        if (pointDiff > Math.abs(line)) {
          resultStatus = 'WON';
          reason = `GANADO: ${event.home_team} ganó por ${pointDiff} puntos, cubriendo el spread de ${line}.`;
        } else {
          resultStatus = 'LOST';
          reason = `PERDIDO: Diferencial de ${pointDiff} puntos no cubrió el spread de ${line}.`;
        }
      } else if (market === 'MONEYLINE') {
        if (home > away) {
          resultStatus = 'WON';
          reason = `GANADO: ${event.home_team} ganó ${home} - ${away}.`;
        } else {
          resultStatus = 'LOST';
          reason = `PERDIDO: ${event.away_team} ganó ${away} - ${home}.`;
        }
      }
    }

    // Default fallback verification
    if (!reason) {
      if (home > away && selection.includes(event.home_team)) {
        resultStatus = 'WON';
        reason = `GANADO: ${event.home_team} superó a ${event.away_team} (${home} - ${away}).`;
      } else {
        resultStatus = 'LOST';
        reason = `PERDIDO: Marcador final ${home} - ${away}. Condición no satisfecha.`;
      }
    }

    const unitsNet = resultStatus === 'WON' 
      ? Number((signal.recommended_stake_units * (signal.odds - 1)).toFixed(2))
      : resultStatus === 'LOST' 
      ? Number((-signal.recommended_stake_units).toFixed(2))
      : 0;

    const solesNet = resultStatus === 'WON'
      ? Number((signal.recommended_stake_soles * (signal.odds - 1)).toFixed(2))
      : resultStatus === 'LOST'
      ? Number((-signal.recommended_stake_soles).toFixed(2))
      : 0;

    return {
      result_status: resultStatus,
      settlement_reason: reason,
      units_net: unitsNet,
      soles_net: solesNet
    };
  }
}
