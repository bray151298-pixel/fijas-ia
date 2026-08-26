/**
 * TelegramFormatter.ts
 * Formats clean, concise, high-converting, professional mathematical signals for Telegram VIP.
 * Removes visual clutter, embeds discreet tracking IDs, and highlights key actionable betting data.
 */

import { SignalEntity } from './SignalEntity';

export class TelegramFormatter {
  /**
   * Compact, High-Impact VIP Signal Format
   */
  public static formatSignalPublish(signal: SignalEntity): string {
    const bookmakerText = signal.bookmaker ? ` (${signal.bookmaker})` : '';
    const evText = signal.expected_value !== undefined 
      ? `+${(signal.expected_value * 100).toFixed(1)}% EV` 
      : `+${signal.edge_percentage}% Edge`;
    
    const sportIcon = signal.sport === 'football' ? '⚽' 
      : signal.sport === 'baseball' ? '⚾' 
      : signal.sport === 'basketball' ? '🏀' 
      : signal.sport === 'tennis' ? '🎾' : '🥊';

    const shortTime = signal.event_start_local.replace(/\s*🇵🇪.*/, '');

    return `💎 <b>FIJAS IA | PICK VIP +EV</b>

${sportIcon} <b>${signal.home_team} vs ${signal.away_team}</b>
🏆 ${signal.league} • ${shortTime} 🇵🇪

🎯 <b>Pick:</b> <code>${signal.selection}</code>
📈 <b>Cuota:</b> <b>@${signal.odds.toFixed(2)}</b>${bookmakerText}
💰 <b>Stake:</b> <b>${signal.recommended_stake_units}u</b> (S/ ${signal.recommended_stake_soles}) • ${signal.risk_level}

📊 <b>Modelo Poisson:</b> ${signal.confidence.toFixed(1)}% prob | <b>${evText}</b>
━━━━━━━━━━━━━━━━━━
<code>#${signal.signal_id}</code>`;
  }

  /**
   * Compact, Ultra-Clean Settlement / Result Message
   */
  public static formatMatchSettlement(
    signal: SignalEntity,
    wonCount: number,
    lostCount: number,
    pendingCount: number
  ): string {
    const isWon = signal.status === 'WON';
    const isLost = signal.status === 'LOST';
    const icon = isWon ? '🟢' : isLost ? '🔴' : '⚪';
    const title = isWon ? 'GANADA' : isLost ? 'PERDIDA' : 'ANULADA';
    const profitSign = signal.units_net_profit > 0 ? `+${signal.units_net_profit.toFixed(2)}u` : `${signal.units_net_profit.toFixed(2)}u`;
    const scoreText = (signal.actual_home_score !== null && signal.actual_away_score !== null)
      ? ` (${signal.actual_home_score} - ${signal.actual_away_score})`
      : '';

    return `${icon} <b>RESULTADO OFICIAL — ${title}</b>

⚽ <b>${signal.home_team} vs ${signal.away_team}</b>${scoreText}
🎯 <b>Pick:</b> <code>${signal.selection}</code>
📈 <b>Cuota:</b> @${signal.odds.toFixed(2)} • <b>Balance:</b> <b>${profitSign}</b>

📊 <b>Récord:</b> ✅ ${wonCount}W - ❌ ${lostCount}L | ⏳ ${pendingCount} Pendientes
━━━━━━━━━━━━━━━━━━
<code>#${signal.signal_id}</code>`;
  }

  /**
   * Daily Executive Summary
   */
  public static formatDailySummary(
    dateStr: string,
    total: number,
    won: number,
    lost: number,
    push: number,
    winRate: number,
    yieldRoi: number,
    netUnits: number,
    netSoles: number
  ): string {
    const profitSign = netUnits >= 0 ? `+${netUnits.toFixed(2)}u` : `${netUnits.toFixed(2)}u`;
    const solesSign = netSoles >= 0 ? `+S/ ${netSoles.toFixed(2)}` : `S/ ${netSoles.toFixed(2)}`;

    return `📊 <b>RESUMEN OFICIAL DEL DÍA</b>
📅 ${dateStr}

• <b>Récord:</b> ${won} Ganadas | ${lost} Perdidas | ${push} Push
• <b>Win Rate:</b> <b>${winRate.toFixed(1)}%</b>
• <b>ROI / Yield:</b> <b>+${yieldRoi.toFixed(1)}%</b>
💰 <b>Balance Neto:</b> <b>${profitSign}</b> (${solesSign})
━━━━━━━━━━━━━━━━━━
Transparencia e inmutabilidad garantizada.`;
  }
}
