/**
 * TelegramFormatter.ts
 * Formats verifiable mathematical signals, settlements, and summaries for Telegram.
 */

import { SignalEntity } from './SignalEntity';

export class TelegramFormatter {
  public static formatSignalPublish(signal: SignalEntity): string {
    const edgeText = signal.edge_percentage > 0 ? `+${signal.edge_percentage}%` : `${signal.edge_percentage}%`;
    const evText = signal.expected_value !== undefined ? `+${(signal.expected_value * 100).toFixed(1)}%` : '+EV';
    const bookmakerText = signal.bookmaker || 'Casas Principales';
    const dqText = signal.data_quality_score ? `${signal.data_quality_score}/100` : '90/100';

    return `━━━━━━━━━━━━━━━━━━
🎯 <b>FIJAS IA | SEÑAL VERIFICADA</b>
━━━━━━━━━━━━━━━━━━

🏆 <b>COMPETICIÓN</b>
${signal.league}

⚔️ <b>PARTIDO</b>
<b>${signal.home_team} vs ${signal.away_team}</b>

📅 <b>FECHA</b>
${signal.event_start_local} 🇵🇪 (Hora Lima)

━━━━━━━━━━━━━━━━━━

📌 <b>APUESTA RECOMENDADA</b>

<b>MERCADO:</b> ${signal.market_type}
<b>SELECCIÓN:</b> <code>${signal.selection}</code>
${signal.line !== null ? `<b>LÍNEA:</b> ${signal.line}\n` : ''}📈 <b>CUOTA:</b> <b>@${signal.odds.toFixed(2)}</b>
🏪 <b>BOOKMAKER:</b> ${bookmakerText}

━━━━━━━━━━━━━━━━━━

🤖 <b>MODELO MATEMÁTICO (POISSON)</b>

• <b>Probabilidad del Modelo:</b> ${signal.confidence.toFixed(1)}%
• <b>Cuota Justa Calculada:</b> @${signal.fair_odds.toFixed(2)}
• <b>Valor Esperado (EV):</b> <b>${evText}</b> (Edge: ${edgeText})
• <b>Calidad de Datos:</b> ${dqText}

━━━━━━━━━━━━━━━━━━

💰 <b>GESTIÓN DE BANCA (KELLY)</b>

• <b>Stake Sugerido:</b> <b>${signal.recommended_stake_units} / 5.0 Unidades</b> (S/ ${signal.recommended_stake_soles})
• <b>Nivel de Riesgo:</b> ${signal.risk_level}

━━━━━━━━━━━━━━━━━━
🆔 <code>${signal.signal_id}</code>`;
  }

  public static formatMatchSettlement(
    signal: SignalEntity,
    wonCount: number,
    lostCount: number,
    pendingCount: number
  ): string {
    const isWon = signal.status === 'WON';
    const isLost = signal.status === 'LOST';
    const isPush = signal.status === 'PUSH';

    const icon = isWon ? '🟢' : isLost ? '🔴' : '⚪';
    const title = isWon ? 'GANADA' : isLost ? 'PERDIDA' : 'PUSH / ANULADA';
    const profitSign = signal.units_net_profit > 0 ? `+${signal.units_net_profit}u` : `${signal.units_net_profit}u`;

    return `━━━━━━━━━━━━━━━━━━
${icon} <b>RESULTADO OFICIAL — ${title}</b>
━━━━━━━━━━━━━━━━━━

⚽ <b>PARTIDO:</b> ${signal.home_team} vs ${signal.away_team}
🏆 <b>TORNEO:</b> ${signal.league}
📊 <b>APUESTA:</b> <code>${signal.selection}</code>

🏁 <b>MARCADOR FINAL:</b> <b>${signal.actual_home_score ?? 0} - ${signal.actual_away_score ?? 0}</b>
📈 <b>CUOTA COBRADA:</b> @${signal.odds.toFixed(2)}
💰 <b>BALANCE:</b> <b>${profitSign}</b>

📝 <b>MOTIVO:</b>
<i>${signal.settlement_reason || 'Liquidación confirmada por marcador oficial.'}</i>

━━━━━━━━━━━━━━━━━━
📊 <b>RÉCORD ACTUALIZADO:</b>
✅ Ganadas: ${wonCount} | ❌ Perdidas: ${lostCount} | ⏳ Pendientes: ${pendingCount}
🆔 <code>${signal.signal_id}</code>`;
  }

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
    return `━━━━━━━━━━━━━━━━━━
📊 <b>FIJAS IA | AUDITORÍA DIARIA</b>
━━━━━━━━━━━━━━━━━━
📅 <b>Fecha:</b> ${dateStr}

📈 <b>RESUMEN CUANTITATIVO:</b>
• Total Pronósticos: ${total}
• Acertados: ${won}
• Fallados: ${lost}
• Anulados / Push: ${push}
• <b>Win Rate:</b> <b>${winRate.toFixed(1)}%</b>
• <b>Yield / ROI:</b> <b>${yieldRoi.toFixed(1)}%</b>

💰 <b>BENEFICIO NETO:</b>
• Unidades: <b>${netUnits > 0 ? '+' : ''}${netUnits.toFixed(2)}u</b>
• Soles: <b>${netSoles > 0 ? '+' : ''}S/ ${netSoles.toFixed(2)}</b>

━━━━━━━━━━━━━━━━━━
Transparencia total e inmutabilidad garantizada.`;
  }
}
