/**
 * TelegramFormatter.ts
 * Formats standardized messages for Signal Publication, Match Settlement, and Daily Recap.
 */

import { SignalEntity } from './SignalEntity';
import { TimeService } from './TimeService';

export class TelegramFormatter {
  public static formatSignalPublish(signal: SignalEntity): string {
    const { dateStr, timeStr } = TimeService.formatForTelegram(signal.event_start_utc);
    const updatedTime = TimeService.getLimaTimeString(signal.created_at_utc);
    
    const confidenceBar = this.getConfidenceBar(signal.confidence);
    const bullets = signal.reasoning_bullet_points.map(b => `• ${b}`).join('\n');

    return `━━━━━━━━━━━━━━━━━━
🎯 <b>FIJAS IA | PRONÓSTICO +EV</b>
━━━━━━━━━━━━━━━━━━

🏆 <b>COMPETICIÓN</b>
${signal.league}

⚔️ <b>PARTIDO</b>
<b>${signal.home_team} vs ${signal.away_team}</b>

📅 <b>FECHA</b>
${dateStr}

🕐 <b>HORA</b>
${timeStr} 🇵🇪 (Hora Lima)

━━━━━━━━━━━━━━━━━━

📌 <b>APUESTA RECOMENDADA</b>

<b>MERCADO:</b> ${signal.market_type}
<b>SELECCIÓN:</b> <b>${signal.selection}</b>
<b>CUOTA APUESTA TOTAL:</b> <b>@${signal.odds.toFixed(2)}</b> (Cuota Justa: @${signal.fair_odds.toFixed(2)})
<b>VENTAJA MATEMÁTICA:</b> <b>+${signal.edge_percentage.toFixed(1)}%</b>

💰 <b>STAKE SUGERIDO:</b> <b>${signal.recommended_stake_units.toFixed(1)} Unidades (S/. ${signal.recommended_stake_soles.toFixed(0)})</b>

━━━━━━━━━━━━━━━━━━

📊 <b>CONFIANZA</b>
${confidenceBar} ${signal.confidence.toFixed(1)}%

⚠️ <b>RIESGO:</b> <b>${signal.risk_level}</b>

━━━━━━━━━━━━━━━━━━

🧠 <b>ANÁLISIS CUANTITATIVO</b>

${bullets}

━━━━━━━━━━━━━━━━━━

🆔 <b>ID DE SEÑAL:</b> <code>${signal.signal_id}</code>
⏱️ <b>DATOS ACTUALIZADOS:</b> ${updatedTime} 🇵🇪
📊 <b>ESTADO:</b> 🟢 <b>PENDIENTE</b>

━━━━━━━━━━━━━━━━━━
👑 <i>Atención y Activación VIP: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
  }

  public static formatMatchSettlement(signal: SignalEntity, accumulatedWon: number, accumulatedLost: number, accumulatedPending: number): string {
    const isWon = signal.result_status === 'WON';
    const statusHeader = isWon ? '🟢 PRONÓSTICO GANADO' : '🔴 PRONÓSTICO PERDIDO';
    const scoreStr = `${signal.home_team} ${signal.actual_home_score ?? 0} - ${signal.actual_away_score ?? 0} ${signal.away_team}`;

    return `━━━━━━━━━━━━━━━━━━
🏁 <b>FIJAS IA | RESULTADO OFICIAL</b>
━━━━━━━━━━━━━━━━━━

🆔 <code>${signal.signal_id}</code>
⚔️ <b>${signal.home_team} vs ${signal.away_team}</b> (${signal.league})

━━━━━━━━━━━━━━━━━━

📌 <b>PRONÓSTICO ORIGINAL</b>
<b>Mercado:</b> ${signal.market_type}
<b>Selección:</b> <b>${signal.selection}</b>
<b>Cuota:</b> <b>@${signal.odds.toFixed(2)}</b>

━━━━━━━━━━━━━━━━━━

🏆 <b>RESULTADO FINAL VERIFICADO</b>
<b>${scoreStr} (FINAL)</b>

━━━━━━━━━━━━━━━━━━

${statusHeader}
💰 <b>Balance Pick:</b> <b>${signal.units_net_profit >= 0 ? `+${signal.units_net_profit.toFixed(2)}u (+S/. ${signal.soles_net_profit.toFixed(2)})` : `${signal.units_net_profit.toFixed(2)}u (S/. ${signal.soles_net_profit.toFixed(2)})`}</b>
📝 <i>${signal.settlement_reason}</i>

━━━━━━━━━━━━━━━━━━

📈 <b>ESTADO ACUMULADO DEL DÍA:</b>
• 🟢 Ganadas: <b>${accumulatedWon}</b>
• 🔴 Perdidas: <b>${accumulatedLost}</b>
• 🟡 Pendientes: <b>${accumulatedPending}</b>

━━━━━━━━━━━━━━━━━━
🏦 <i>Bankroll auditado automáticamente en la base de datos de FIJAS IA.</i>`;
  }

  public static formatDailySummary(
    dateStr: string,
    totalSignals: number,
    wonCount: number,
    lostCount: number,
    pushCount: number,
    winRate: number,
    yieldRoi: number,
    netUnits: number,
    netSoles: number
  ): string {
    return `━━━━━━━━━━━━━━━━━━
📊 <b>FIJAS IA | CIERRE DEL DÍA AUDITADO</b>
━━━━━━━━━━━━━━━━━━

📅 <b>FECHA:</b> <b>${dateStr}</b>

📋 <b>TOTAL DE SEÑALES LIQUIDADAS:</b> <b>${wonCount + lostCount + pushCount}</b>
• 🟢 <b>GANADAS:</b> <b>${wonCount}</b>
• 🔴 <b>PERDIDAS:</b> <b>${lostCount}</b>
• ⚪ <b>PUSH / ANULADAS:</b> <b>${pushCount}</b>

━━━━━━━━━━━━━━━━━━

🎯 <b>WIN RATE OFICIAL</b>
<b>${winRate.toFixed(2)}%</b>

━━━━━━━━━━━━━━━━━━

📈 <b>RENDIMIENTO FINANCIERO (YIELD & ROI)</b>
• 🚀 <b>Yield / ROI:</b> <b>+${yieldRoi.toFixed(2)}%</b>
• 💰 <b>Unidades Netas:</b> <b>${netUnits >= 0 ? `+${netUnits.toFixed(2)}u` : `${netUnits.toFixed(2)}u`}</b>
• 💵 <b>Ganancia Neta:</b> <b>${netSoles >= 0 ? `+S/. ${netSoles.toFixed(2)}` : `S/. ${netSoles.toFixed(2)}`}</b>

━━━━━━━━━━━━━━━━━━
🛡️ <i>Auditoría inmutable respaldada por registros oficiales de FIJAS IA.</i>`;
  }

  private static getConfidenceBar(confidence: number): string {
    const totalBars = 10;
    const filled = Math.min(10, Math.max(0, Math.round(confidence / 10)));
    const empty = totalBars - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
}
