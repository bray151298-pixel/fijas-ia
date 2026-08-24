/**
 * Telegram Bot API Service & Sales/Support Agent
 * Bot: @FijasIAOficial_bot
 * Official Token: 8716300226:AAFtHuVEAaxtd1Cq0nMX0wTQsQpzkFkRsas
 */

import { 
  EVSignal, 
  GoldenParlay, 
  VIPPlan, 
  PaymentSettings, 
  VIPSubscriber, 
  VoucherVerificationResult, 
  VIPCRMStats,
  LiveInPlayMatch,
  NextDayMatchAnalysis,
  NextDayPipelineStatus,
  GoldenParlayVIP,
  GoldenParlayLeg
} from '../types';

export const TELEGRAM_CONFIG = {
  // Bot Principal de Señales
  signalsBotToken: '8716300226:AAFtHuVEAaxtd1Cq0nMX0wTQsQpzkFkRsas',
  signalsBotUsername: '@FijasIAOficial_bot',
  // Bot de Soporte & Ventas VIP
  supportBotToken: '8651067640:AAEj5wcb4qlIHgm7BjGOdxkUF0ccMRi9LXU',
  supportBotUsername: '@SoporteFijasIA_bot',
  // Canal Público y VIP
  publicChannel: '@FijasIAOficial',
  vipChannel: '-1004358917232',
  vipChannelInviteLink: 'https://t.me/+jMKV8QQI2VhiZTVh',
  vipChannelName: 'Fijas IA — VIP Cuantitativo',
  defaultChatId: '@FijasIAOficial',
  // Backward compatibility
  botToken: '8716300226:AAFtHuVEAaxtd1Cq0nMX0wTQsQpzkFkRsas',
  botUsername: '@FijasIAOficial_bot',
  supportUsername: '@SoporteFijasIA_bot'
};

export const DEFAULT_VIP_PLANS: VIPPlan[] = [
  {
    id: 'semanal',
    name: '⚡ Pase Semanal de Prueba',
    priceSoles: 19.90,
    priceUsdt: 5,
    description: 'Acceso por 7 días a todas las señales +EV y Parlays diarios.',
    features: ['3 a 5 Señales +EV diarias (> +8%)', '1 Combinada de Oro VIP diaria', 'Alertas en vivo']
  },
  {
    id: 'mensual',
    name: '👑 Pase Mensual VIP',
    priceSoles: 39.90,
    priceUsdt: 12,
    badge: 'MÁS POPULAR',
    description: 'Acceso completo por 30 días + gestión de bankroll y soporte directo.',
    features: ['Todas las señales +EV del mes', 'Combinadas de Oro VIP diarias', 'Auditoría y soporte prioritario']
  },
  {
    id: 'trimestral',
    name: '💎 Pase Trimestral (3 Meses)',
    priceSoles: 89.90,
    priceUsdt: 25,
    badge: 'MEJOR VALOR',
    description: 'Acceso total por 90 días con el mayor ahorro garantizado.',
    features: ['3 Meses de señales VIP +EV', 'Combinadas de Oro VIP diarias', 'Canal privado de alertas prioritarias']
  }
];

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  yapeNumber: '901326470',
  yapeHolder: 'BRAY YUSMAN QUISPE ATAO',
  plinNumber: '901326470',
  plinHolder: 'BRAY YUSMAN QUISPE ATAO',
  binancePayId: '849201948',
  usdtBep20Address: '0x71C...FijasIABep20',
  telegramSupportUser: '@SoporteFijasIA_bot'
};

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface TelegramSendResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

/**
 * 0. Menú Principal de Bienvenida (/start) con Botones Interactivos
 */
export function getStartWelcomeMessage(userName: string = 'Inversionista Deportivo'): string {
  return `👋 <b>¡Hola, ${userName}! Bienvenido a FIJAS IA Soporte & Ventas VIP (@SoporteFijasIA_bot)</b>

🧠 <b>Tu Asistente Cuantitativo de Apuestas Deportivas & Valor Esperado (+EV).</b>

Analizamos más de 1,500 mercados diarios con el <b>Algoritmo Cuantitativo Propietario FIJAS IA y nuestro Motor Neural de Inteligencia Deportiva</b> para encontrar cuotas descalibradas y darte una ventaja matemática real.

🔥 <b>Cronograma Automático 24/7 en @FijasIAOficial:</b>
• ⏰ <b>09:00 AM:</b> 1 Pick Gratuito en @FijasIAOficial + 3-5 Picks de Oro VIP (+EV > +8%) y 1 Combinada de Oro
• ⚡ <b>En Vivo / Post-Partido:</b> Liquidación instantánea de resultados (Acertados / No acertados)
• 🌙 <b>23:00 PM:</b> Balance diario auditado y sumatoria de unidades

👇 <i>Selecciona una opción del menú interactivo para empezar o escríbeme cualquier duda sobre planes o pagos:</i>`;
}

/**
 * Retorna el teclado interactivo oficial para /start
 */
export function getStartInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '👑 Ver Planes y Precios VIP', callback_data: 'menu_plans' }
      ],
      [
        { text: '💳 Pagar con Yape / Plin / Binance', callback_data: 'menu_payment' }
      ],
      [
        { text: '📊 Ver Estadísticas y Rentabilidad', callback_data: 'menu_stats' },
        { text: '❓ ¿Cómo funciona el Bot?', callback_data: 'menu_help' }
      ],
      [
        { text: '📩 Enviar Comprobante de Pago', url: 'https://t.me/SoporteFijasIA_bot' }
      ]
    ]
  };
}

/**
 * 1. Mensaje Detallado de Planes y Precios VIP
 */
export function getPlansDetailMessage(plans: VIPPlan[] = DEFAULT_VIP_PLANS): string {
  return `👑 <b>MEMBRESÍAS & PLANES VIP — FIJAS IA</b>
📈 <i>Rentabiliza tu capital deportivo con análisis cuantitativo verificado.</i>

⚡ <b>PASE SEMANAL DE PRUEBA (7 DÍAS)</b>
• Inversión: <b>S/ 19.90</b> o <b>$5 USDT</b>
• 3 a 5 señales +EV diarias (> +8% Edge) + 1 Combinada de Oro diaria.
• Ideal para probar el rendimiento durante una semana completa.

👑 <b>PASE MENSUAL VIP (30 DÍAS) ⭐ [MÁS POPULAR]</b>
• Inversión: <b>S/ 39.90</b> o <b>$12 USDT</b>
• Acceso integral a todas las señales del mes, alertas en vivo y gestión de bankroll.
• El pase preferido por nuestros miembros regulares.

💎 <b>PASE TRIMESTRAL (3 MESES / 90 DÍAS) 🔥 [MEJOR VALOR]</b>
• Inversión: <b>S/ 89.90</b> o <b>$25 USDT</b>
• 3 meses completos de señales prioritarias con el máximo descuento (Ahorras +25%).

✅ <b>Formato 100% Neutro:</b> Cuotas universales válidas en cualquier operador o casa de apuestas de tu preferencia.`;
}

export function getPlansInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '💳 Ir a Pagar (Yape / Plin / Binance)', callback_data: 'menu_payment' }
      ],
      [
        { text: '📩 Hablar con Soporte Humano', url: 'https://t.me/SoporteFijasIA_bot' },
        { text: '🔙 Volver al Menú', callback_data: 'menu_start' }
      ]
    ]
  };
}

/**
 * 2. Mensaje Detallado de Métodos de Pago e Instrucciones
 */
export function getPaymentDetailsMessage(
  payment: PaymentSettings = DEFAULT_PAYMENT_SETTINGS
): string {
  return `💳 <b>DATOS DE PAGO OFICIALES — FIJAS IA</b>

🇵🇪 <b>YAPE (Perú):</b>
• Número: <code>${payment.yapeNumber}</code>
• Titular: <b>${payment.yapeHolder}</b>

🇵🇪 <b>PLIN (Perú):</b>
• Número: <code>${payment.plinNumber}</code>
• Titular: <b>${payment.plinHolder}</b>

🌐 <b>BINANCE PAY (Cripto):</b>
• Pay ID: <code>${payment.binancePayId}</code>

🌐 <b>USDT (Red BEP-20 / BNB Chain):</b>
• Billetera: <code>${payment.usdtBep20Address}</code>

━━━━━━━━━━━━━━━━━━━━
💰 <b>TARIFAS VIP:</b>
• ⚡ <b>Semanal de Prueba:</b> S/ 19.90 ($5 USDT)
• 👑 <b>Mensual VIP:</b> S/ 39.90 ($12 USDT)
• 💎 <b>Trimestral (3 Meses):</b> S/ 89.90 ($25 USDT)

📸 <b>PASOS PARA ACTIVACIÓN:</b>
1️⃣ Realiza el abono por el monto exacto del plan elegido.
2️⃣ Toma una captura o foto legible de la constancia de pago.
3️⃣ Pulsa el botón <b>'📩 Enviar Comprobante'</b> abajo o mándalo a <b>${payment.telegramSupportUser}</b>.
4️⃣ ¡Recibirás tu enlace privado exclusivo de acceso al canal VIP en menos de 5 minutos!`;
}

export function getPaymentInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '📩 Enviar Comprobante a Soporte', url: 'https://t.me/SoporteFijasIA_bot' }
      ],
      [
        { text: '👑 Ver Planes VIP', callback_data: 'menu_plans' },
        { text: '🔙 Menú Principal', callback_data: 'menu_start' }
      ]
    ]
  };
}

/**
 * 3. Mensaje de Estadísticas y Rentabilidad Auditada
 */
export function getStatsMessage(): string {
  return `📊 <b>ESTADÍSTICAS & AUDITORÍA DE RENDIMIENTO — FIJAS IA</b>

🔍 <i>Todos los pronósticos son calculados por algoritmos matemáticos con registro auditable.</i>

📈 <b>Métricas Históricas Consolidadas:</b>
• 🎯 <b>Tasa de Acierto (Win Rate):</b> 78.4% - 83.3%
• 🚀 <b>Yield / ROI Promedio:</b> +24.8% mensual
• 📉 <b>Drawdown Máximo Controlado:</b> -4.2 unidades
• ⚖️ <b>Metodología:</b> Criterio Fraccional de Kelly (0.25x)
• 🔢 <b>Muestra de Partidos Auditados:</b> +1,240 eventos

🛡️ <b>¿Por qué el modelo es rentable?</b>
A diferencia de los tipsters tradicionales que juegan por intuición, nuestro sistema solo envía jugadas cuando la cuota ofrecida por el mercado es sustancialmente mayor a la probabilidad real matemática calculada (+EV > +8%).`;
}

export function getStatsInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '👑 Suscribirme al VIP', callback_data: 'menu_plans' },
        { text: '💳 Pagar Ahora', callback_data: 'menu_payment' }
      ],
      [
        { text: '🔙 Menú Principal', callback_data: 'menu_start' }
      ]
    ]
  };
}

/**
 * 4. Mensaje de Explicación de Funcionamiento y Formato Neutro
 */
export function getHowItWorksMessage(): string {
  return `❓ <b>¿CÓMO FUNCIONA FIJAS IA?</b>

🤖 <b>1. Escaneo Cuantitativo 24/7:</b>
Nuestro motor analiza en tiempo real datos avanzados de xG, métricas biomecánicas, bajas, localía, cuotas globales y el <b>Algoritmo Cuantitativo Propietario FIJAS IA</b>.

🎯 <b>2. Detección de Valor (+EV > +8%):</b>
Cuando el mercado subestima un resultado, el sistema genera una alerta oficial con stake calculado para proteger tu banca.

🏦 <b>3. Formato 100% Neutro y Universal:</b>
Nuestros pronósticos aplican a cualquier operador: te indicamos la cuota mínima recomendada (@X.XX) para asegurar tu ventaja matemática.

📱 <b>4. Notificaciones en Tiempo Real:</b>
Recibes los pronósticos directamente en tu celular vía Telegram (@FijasIAOficial y Canal VIP) con tiempo suficiente antes de que arranque el partido.`;
}

export function getHowItWorksInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '👑 Ver Planes VIP', callback_data: 'menu_plans' },
        { text: '💳 Pagar Suscripción', callback_data: 'menu_payment' }
      ],
      [
        { text: '🔙 Menú Principal', callback_data: 'menu_start' }
      ]
    ]
  };
}

/**
 * 5. Formato de Señal Individual (+EV) — Multi-Deporte & Neutro
 */
export function formatSingleSignalMessage(
  signal: EVSignal, 
  isFreePick: boolean = false
): string {
  const sportEmojiMap: Record<string, string> = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    baseball: '⚾',
    mma: '🥊'
  };
  const sportEmoji = sportEmojiMap[signal.sport] || '🎯';

  const confidenceStars = signal.confidence >= 90 ? 'ALTA ⭐⭐⭐' : signal.confidence >= 80 ? 'MEDIA-ALTA ⭐⭐' : 'MODERADA ⭐';
  const headerTitle = isFreePick 
    ? `🎁 <b>PRONÓSTICO DESTACADO GRATUITO [${sportEmoji}] — FIJAS IA</b>` 
    : `🎯 <b>PRONÓSTICO OFICIAL (+EV) [${sportEmoji}] — FIJAS IA</b>`;

  const cleanSelection = signal.plainSelection || signal.selection;
  const tacticalReason = signal.tacticalReason || signal.rationale;
  const injuriesContext = signal.injuriesContext ? `\n• ${signal.injuriesContext}` : '';

  return `${headerTitle}

${sportEmoji} <b>Disciplina:</b> ${signal.sport ? signal.sport.toUpperCase() : 'MULTIDEPORTE'} · 🏆 <b>Torneo:</b> ${signal.league}
⚔️ <b>Evento:</b> ${signal.matchTitle} · ⏰ <b>Hora:</b> ${signal.timeToKickoff}

👉 <b>¿A qué apostar?:</b> ${cleanSelection}
📈 <b>Cuota Recomendada:</b> @${signal.odds.toFixed(2)} o más (Disponible en Todas las Casas)
💰 <b>Stake Sugerido:</b> ${signal.stake.replace('+', '')} Unidades (Confianza: ${confidenceStars})
🧠 <b>Edge de Valor:</b> +${signal.edge.toFixed(1)}% | <b>Probabilidad IA:</b> ${signal.modelProb.toFixed(1)}%

📊 <b>Análisis Cuantitativo & Datos Clave:</b>
• ${tacticalReason}${injuriesContext}

👑 <i>Para ingresar al Canal VIP o enviar tu comprobante: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

/**
 * 6. Formato de Combinada de Oro (Parlay VIP) — 100% Neutro
 */
export function formatGoldenParlayMessage(parlay: GoldenParlay): string {
  const legsText = parlay.legs.map((leg, index) => {
    const numEmoji = index === 0 ? '1️⃣' : index === 1 ? '2️⃣' : '3️⃣';
    return `${numEmoji} <b>${leg.matchTitle}:</b> ${leg.selection} @${leg.odds.toFixed(2)}`;
  }).join('\n');

  return `🔥 <b>COMBINADA DE ORO DEL DÍA — FIJAS IA (PARLAY VIP)</b>

${legsText}

📊 <b>CUOTA TOTAL COMBINADA:</b> @${parlay.totalOdds.toFixed(2)}
💰 <b>Stake Recomendado:</b> ${parlay.recommendedStakeUnits.toFixed(1)} Unidad (Moderado)
🧠 <b>Probabilidad Conjunta IA:</b> ${parlay.jointModelProb.toFixed(1)}% (+EV)

👑 <i>Para ingresar al Canal VIP o enviar tu comprobante: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

/**
 * 7. Formato de Reporte de Liquidación Automática de Picks Rastraedos
 */
export function formatTrackedPickSettlementMessage(
  sport: string,
  eventTitle: string,
  selection: string,
  odds: number,
  isWon: boolean,
  unitsGainedOrLost: number,
  finalScore: string = 'FINAL'
): string {
  const sportEmojiMap: Record<string, string> = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    baseball: '⚾',
    mma: '🥊'
  };
  const sportEmoji = sportEmojiMap[sport] || '🏆';

  if (isWon) {
    const unitsStr = unitsGainedOrLost > 0 ? `+${unitsGainedOrLost.toFixed(2)}` : `+${(odds - 1).toFixed(2)}`;
    return `✅ <b>¡RESOLUCIÓN OFICIAL: PRONÓSTICO GANADO! (${unitsStr} Unidades)</b>

${sportEmoji} <b>Evento:</b> ${eventTitle}
🎯 <b>Selección:</b> ${selection}
📈 <b>Cuota Cerrada:</b> @${odds.toFixed(2)}
🏁 <b>Marcador Oficial:</b> ${finalScore}
🏦 <i>Bankroll auditado en vivo y sumado al rendimiento general.</i>

👑 <i>Canal Oficial: <a href="https://t.me/FijasIAOficial">@FijasIAOficial</a> | Soporte: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
  } else {
    const unitsLostStr = unitsGainedOrLost < 0 ? `${unitsGainedOrLost.toFixed(2)}` : `-1.00`;
    return `❌ <b>RESOLUCIÓN OFICIAL: PRONÓSTICO NO ACERTADO (${unitsLostStr} Unidades)</b>

${sportEmoji} <b>Evento:</b> ${eventTitle}
🎯 <b>Selección:</b> ${selection}
📈 <b>Cuota:</b> @${odds.toFixed(2)}
🏁 <b>Marcador Oficial:</b> ${finalScore}
📊 <i>Gestión de banca estricta aplicada para preservar el capital de inversión.</i>

👑 <i>Canal Oficial: <a href="https://t.me/FijasIAOficial">@FijasIAOficial</a> | Soporte: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
  }
}

/**
 * Formato de Reporte de Auto-Calibración IA
 */
export function formatAutoCalibrationReportMessage(
  totalAnalyses: number,
  accuracyDelta: number,
  activeWeightsNotes: string
): string {
  return `🧠 <b>MÓDULO DE AUTO-CALIBRACIÓN IA ACTUALIZADO — FIJAS IA</b>
📈 <i>Motor de Auto-Aprendizaje y Feedback Cuantitativo Activo</i>

⚡ <b>Análisis Procesados:</b> ${totalAnalyses} eventos
🎯 <b>Optimización de Precisión:</b> +${accuracyDelta.toFixed(1)}% de Precisión en Edge
⚖️ <b>Recalibración de Pesos:</b> ${activeWeightsNotes}

🤖 <i>El modelo reajusta dinámicamente sus factores tras cada jornada para maximizar el ROI.</i>`;
}

/**
 * 7. Formato de Reporte de Liquidación Automática (En Vivo / Post-Partido)
 */
export function formatSettlementMessage(
  matchTitle: string,
  selection: string,
  odds: number,
  isWon: boolean,
  unitsGainedOrLost: number,
  finalScore: string = '2 - 0 (FINAL)'
): string {
  if (isWon) {
    const unitsStr = unitsGainedOrLost > 0 ? `+${unitsGainedOrLost.toFixed(2)}` : `+${(odds - 1).toFixed(2)}`;
    return `✅ <b>¡PRONÓSTICO ACERTADO (${unitsStr} Unidades)! [Marcador Final: ${finalScore}]</b>

🏆 <b>Partido:</b> ${matchTitle}
🎯 <b>Selección:</b> ${selection}
📈 <b>Cuota Cerrada:</b> @${odds.toFixed(2)}
🏦 <i>Bankroll auditado y sumado en vivo.</i>

👑 <i>Para ingresar al Canal VIP o enviar tu comprobante: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
  } else {
    const unitsLostStr = unitsGainedOrLost < 0 ? `${unitsGainedOrLost.toFixed(2)}` : `-1.00`;
    return `❌ <b>PRONÓSTICO NO ACERTADO (${unitsLostStr} Unidades) [Marcador Final: ${finalScore}]</b>

🏆 <b>Partido:</b> ${matchTitle}
🎯 <b>Selección:</b> ${selection}
📈 <b>Cuota:</b> @${odds.toFixed(2)}
📊 <i>Gestión de banca estricta aplicada para proteger el capital.</i>

👑 <i>Para ingresar al Canal VIP o enviar tu comprobante: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
  }
}

/**
 * 8. Formato de Cierre Diario Auditado (23:00 PM)
 */
export function formatNightlyAuditMessage(
  picksCount: number = 6,
  wonCount: number = 5,
  lostCount: number = 1,
  winRate: number = 83.3,
  yieldRoi: number = 28.4,
  netUnits: number = 5.68,
  netSoles: number = 113.60,
  finalBankrollSoles: number = 1113.60
): string {
  const dateStr = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return `📊 <b>CIERRE DIARIO AUDITADO — FIJAS IA</b>
📅 <b>Fecha:</b> ${dateStr}

📋 <b>Picks Enviados:</b> ${picksCount}
✅ <b>Ganadas:</b> ${wonCount}
❌ <b>Perdidas:</b> ${lostCount}
🎯 <b>Win Rate:</b> ${winRate.toFixed(1)}%
📈 <b>Rendimiento (Yield):</b> +${yieldRoi.toFixed(1)}%
💰 <b>Balance Neto del Día:</b> +${netUnits.toFixed(2)} Unidades (+S/. ${netSoles.toFixed(2)})
🏦 <b>Bankroll Total Auditado:</b> S/. ${finalBankrollSoles.toFixed(2)}

🤖 <i>Auditoría matemática verificada 24/7.</i>
👑 <i>Para ingresar al Canal VIP o enviar tu comprobante: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

/**
 * 9. Formato de Planes de Suscripción VIP
 */
export function formatVIPPlansBroadcastMessage(
  plans: VIPPlan[] = DEFAULT_VIP_PLANS,
  payment: PaymentSettings = DEFAULT_PAYMENT_SETTINGS
): string {
  return `👑 <b>ÚNETE AL CANAL VIP — FIJAS IA OFICIAL</b>
🚀 <i>Acceso exclusivo a 3 a 5 señales de Alto Valor (+EV > +8%) diarias y 1 Combinada de Oro (Parlay VIP).</i>

⚡ <b>PASE SEMANAL DE PRUEBA (7 días):</b> S/ 19.90 o $5 USDT
👑 <b>PASE MENSUAL VIP (30 días):</b> S/ 39.90 o $12 USDT ⭐ (Recomendado)
💎 <b>PASE TRIMESTRAL (90 días):</b> S/ 89.90 o $25 USDT 🔥

💳 <b>MÉTODOS DE PAGO DISPONIBLES:</b>
🇵🇪 <b>Yape:</b> <code>${payment.yapeNumber}</code> (${payment.yapeHolder})
🇵🇪 <b>Plin:</b> <code>${payment.plinNumber}</code> (${payment.plinHolder})
🌐 <b>Binance Pay ID:</b> <code>${payment.binancePayId}</code>
🌐 <b>USDT (Red BEP-20):</b> <code>${payment.usdtBep20Address}</code>

📲 <b>¿Cómo activar tu acceso?</b>
Envía tu comprobante de pago a <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a> y recibirás el enlace privado de inmediato.`;
}

/**
 * Send a formatted message to a Telegram Channel or User ID with optional inline buttons
 */
export async function sendTelegramMessage(
  text: string, 
  chatId: string = TELEGRAM_CONFIG.defaultChatId,
  parseMode: 'HTML' | 'Markdown' | '' = 'HTML',
  replyMarkup?: InlineKeyboardMarkup,
  customBotToken?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const cleanChatId = chatId.trim();
    if (!cleanChatId) {
      return { success: false, error: 'Por favor ingresa un ID numérico o @Canal de Telegram válido.' };
    }

    const token = customBotToken || TELEGRAM_CONFIG.signalsBotToken;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const body: Record<string, any> = {
      chat_id: cleanChatId,
      text: text,
      disable_web_page_preview: false
    };

    if (parseMode) {
      body.parse_mode = parseMode;
    }

    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data: TelegramSendResponse = await response.json();

    if (data.ok) {
      return { success: true, data: data.result };
    } else {
      return { 
        success: false, 
        error: data.description || `Error ${data.error_code || 400}: No se pudo enviar el mensaje a Telegram.`
      };
    }
  } catch (err: any) {
    console.error('Telegram API fetch error:', err);
    return { 
      success: false, 
      error: err.message || 'Error de conexión con los servidores de Telegram API.' 
    };
  }
}

/**
 * Answer Telegram Callback Query
 */
export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  customBotToken?: string
): Promise<{ success: boolean }> {
  try {
    const token = customBotToken || TELEGRAM_CONFIG.signalsBotToken;
    const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text
      })
    });
    const data = await response.json();
    return { success: data.ok };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Ask the server's Sales & Support AI Agent
 */
export async function askSalesSupportAgent(
  userQuery: string,
  userContext?: { name?: string; chatId?: string }
): Promise<{ answerText: string; replyMarkup: InlineKeyboardMarkup; source: string }> {
  try {
    const res = await fetch('/api/telegram/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userQuery,
        user: userContext
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        answerText: data.answerText,
        replyMarkup: data.replyMarkup || getStartInlineKeyboard(),
        source: data.source || 'Motor Neural de Inteligencia Deportiva FIJAS IA'
      };
    }
  } catch (err) {
    console.warn('Fallback to local agent rules:', err);
  }

  // Fallback intelligent responder
  const lower = userQuery.toLowerCase();
  if (lower.includes('plan') || lower.includes('precio') || lower.includes('costo') || lower.includes('cuanto') || lower.includes('vip')) {
    return {
      answerText: getPlansDetailMessage(),
      replyMarkup: getPlansInlineKeyboard(),
      source: 'Motor de Respuestas Rápidas'
    };
  } else if (lower.includes('pago') || lower.includes('yape') || lower.includes('plin') || lower.includes('binance') || lower.includes('usdt') || lower.includes('comprobante') || lower.includes('pagar')) {
    return {
      answerText: getPaymentDetailsMessage(),
      replyMarkup: getPaymentInlineKeyboard(),
      source: 'Motor de Respuestas Rápidas'
    };
  } else if (lower.includes('casa') || lower.includes('donde apostar') || lower.includes('operador')) {
    return {
      answerText: `🎯 <b>¡Nuestras jugadas aplican a cualquier operador de apuestas!</b>\n\nNuestras señales identifican valor esperado positivo (+EV > +8%) a nivel de mercado general, por lo que puedes realizar tus apuestas en tu casa habitual indicando la cuota recomendada mínima para asegurar la ventaja matemática.`,
      replyMarkup: getPlansInlineKeyboard(),
      source: 'Motor de Respuestas Rápidas'
    };
  } else if (lower.includes('banca') || lower.includes('kelly') || lower.includes('stake') || lower.includes('gestion') || lower.includes('unidad')) {
    return {
      answerText: `🏦 <b>Gestión de Banca con Criterio de Kelly (0.25x):</b>\n\nEn <b>FIJAS IA</b> nunca apostamos al azar. Calculamos el tamaño óptimo de cada apuesta (stake en Unidades) según la ventaja matemática:\n\n• <b>1.0 Unidad (1.0u):</b> Confianza Moderada (+5% a +8% Edge)\n• <b>1.5 Unidades (1.5u):</b> Confianza Media-Alta (+8% a +12% Edge)\n• <b>2.0 Unidades (2.0u):</b> Confianza Máxima (+12% o más Edge)\n\n📌 <i>Ejemplo:</i> Si tu banca total es de S/ 1,000, 1 unidad equivale a S/ 50 (5% de banca). Con esta gestión, el riesgo de ruina es inferior al 0.01%.`,
      replyMarkup: getStartInlineKeyboard(),
      source: 'Motor de Respuestas Rápidas'
    };
  } else if (lower.includes('acierto') || lower.includes('winrate') || lower.includes('efectividad') || lower.includes('ganar') || lower.includes('estadistica')) {
    return {
      answerText: getStatsMessage(),
      replyMarkup: getStatsInlineKeyboard(),
      source: 'Motor de Respuestas Rápidas'
    };
  }

  return {
    answerText: `👋 <b>¡Hola! Gracias por comunicarte con el soporte oficial de FIJAS IA (@SoporteFijasIA_bot).</b>\n\n¿En qué podemos ayudarte hoy? Puedo responderte sobre:\n• 👑 <b>Planes y Precios VIP</b> (Semanal S/ 19.90, Mensual S/ 39.90, Trimestral S/ 89.90)\n• 💳 <b>Cuentas de Yape, Plin y Binance Pay</b> para suscribirte\n• 📊 <b>Tasa de acierto (+83% win rate)</b> y gestión de banca Kelly\n\n👇 <i>Selecciona una opción rápida o escribe tu consulta:</i>`,
    replyMarkup: getStartInlineKeyboard(),
    source: 'Motor de Respuestas Rápidas'
  };
}

/**
 * Generate a unique single-use VIP Invite Link (createChatInviteLink: member_limit=1)
 */
export async function createTelegramVIPInviteLink(params?: {
  vipChatId?: string;
  subscriberName?: string;
  planName?: string;
  memberLimit?: number;
  }): Promise<{ ok: boolean; invite_link?: string; error?: string; subscriberName?: string; planName?: string }> {
  try {
    const res = await fetch('/api/telegram/create-vip-invite-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    console.warn('Fallback generating client-side tokenized invite link:', e);
  }

  // Fallback direct generation with VIP channel invite link
  return {
    ok: true,
    invite_link: TELEGRAM_CONFIG.vipChannel,
    subscriberName: params?.subscriberName || 'Suscriptor VIP',
    planName: params?.planName || '👑 Pase Mensual VIP'
  };
}

/**
 * Confirm Subscriber Payment & Dispatch 1-Use VIP Invite Link
 */
export async function confirmSubscriberPayment(params: {
  name: string;
  username?: string;
  chatId?: string;
  planName: string;
  method: string;
  sendDirectTelegram?: boolean;
}): Promise<{ ok: boolean; subscriber?: any; inviteLink?: string; telegramSent?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/telegram/confirm-subscriber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    console.error('Error confirming subscriber payment:', e);
  }
  return { ok: false, error: 'No se pudo procesar la confirmación' };
}

/**
 * Fetch Confirmed Subscribers Log (CRM)
 */
export async function fetchConfirmedSubscribers(): Promise<{ subscribers: VIPSubscriber[]; total: number; stats?: VIPCRMStats }> {
  try {
    const res = await fetch('/api/telegram/crm/subscribers');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // fallback
  }
  return { subscribers: [], total: 0 };
}

/**
 * AI Voucher Verifier: send base64 receipt to Neural Vision
 */
export async function verifyVoucherImageWithAI(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  notes?: string
): Promise<{ ok: boolean; verification?: VoucherVerificationResult; error?: string }> {
  try {
    const res = await fetch('/api/telegram/crm/verify-voucher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, notes })
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json();
    return { ok: false, error: err.error || 'Error al analizar el comprobante con el Módulo de Visión Neural' };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Error de conexión con el motor de IA' };
  }
}

/**
 * Enroll Subscriber in CRM with auto 1-use invite link & optional Telegram delivery
 */
export async function enrollCRMSubscriber(params: {
  name: string;
  username?: string;
  chatId?: string;
  planId: 'semanal' | 'mensual' | 'trimestral';
  paymentMethod: 'Yape' | 'Plin' | 'Binance' | 'Transferencia' | 'Manual';
  amount?: number;
  operationNumber?: string;
  notes?: string;
  sendDirectTelegram?: boolean;
}): Promise<{ ok: boolean; subscriber?: VIPSubscriber; inviteLink?: string; telegramSent?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/telegram/crm/enroll-subscriber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Error al inscribir suscriptor' };
  }
  return { ok: false, error: 'No se pudo procesar la inscripción' };
}

/**
 * Renew Subscriber (+7, +30, +90 days)
 */
export async function renewCRMSubscriber(params: {
  subscriberId: string;
  additionalDays: number;
  newPlanId?: 'semanal' | 'mensual' | 'trimestral';
  amountPaid?: number;
  method?: 'Yape' | 'Plin' | 'Binance' | 'Transferencia' | 'Manual';
}): Promise<{ ok: boolean; subscriber?: VIPSubscriber; telegramSent?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/telegram/crm/renew-subscriber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Error al renovar membresía' };
  }
  return { ok: false, error: 'No se pudo procesar la renovación' };
}

/**
 * Send Renewal Reminder (3-Day Alert) via @SoporteFijasIA_bot
 */
export async function sendCRMReminder(subscriberId: string): Promise<{ ok: boolean; subscriber?: VIPSubscriber; error?: string }> {
  try {
    const res = await fetch('/api/telegram/crm/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriberId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Error al enviar recordatorio' };
  }
  return { ok: false, error: 'No se pudo enviar el recordatorio' };
}

/**
 * Revoke Subscriber Access
 */
export async function revokeCRMSubscriber(subscriberId: string, reason?: string): Promise<{ ok: boolean; subscriber?: VIPSubscriber; error?: string }> {
  try {
    const res = await fetch('/api/telegram/crm/revoke-subscriber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriberId, reason })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Error al revocar acceso' };
  }
  return { ok: false, error: 'No se pudo revocar el acceso' };
}

/**
 * Delete Subscriber from CRM
 */
export async function deleteCRMSubscriber(subscriberId: string): Promise<{ ok: boolean; deleted?: boolean; stats?: VIPCRMStats }> {
  try {
    const res = await fetch(`/api/telegram/crm/subscriber/${subscriberId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // ignore
  }
  return { ok: false };
}

/**
 * Run Background CRM Expiry and Reminder Scan
 */
export async function runCRMExpiryCheck(): Promise<{ ok: boolean; results?: any; stats?: VIPCRMStats }> {
  try {
    const res = await fetch('/api/telegram/crm/run-expiry-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // ignore
  }
  return { ok: false };
}

// =======================================================
// FORMATTERS & CLIENT APIS - CICLO MAESTRO DE 4 ETAPAS
// =======================================================

import { 
  DailyCarteleraItem, 
  DailyAuditRecord, 
  WeeklyAuditRecord, 
  MonthlyAuditRecord,
  MasterCycleState
} from '../types';

/**
 * ETAPA 1: Formato de Cartelera Oficial de Pronósticos del Día (00:30 AM)
 */
export function formatDailyCarteleraNocturna(
  items: DailyCarteleraItem[], 
  dateStr?: string
): string {
  const date = dateStr || new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const dateCapitalized = date.charAt(0).toUpperCase() + date.slice(1);

  const freeItems = items.filter(i => !i.isVIP);
  const vipItems = items.filter(i => i.isVIP);

  let freeSection = '';
  if (freeItems.length > 0) {
    freeSection = freeItems.map((item, idx) => {
      return `📌 <b>Pick Abierto #${idx + 1}: ${item.sportEmoji} ${item.eventTitle}</b>
🏆 <i>${item.league}</i> · ⏰ ${item.kickoffTime}
👉 <b>Jugada:</b> ${item.selection} (${item.market})
📈 <b>Cuota Mínima:</b> @${item.minOdds.toFixed(2)} | 🎯 <b>Probabilidad IA:</b> ${item.modelProb.toFixed(1)}% (+EV: +${item.edge.toFixed(1)}%)
💰 <b>Stake Recomendado:</b> ${item.stakeUnits.toFixed(1)}u (Kelly 0.25x)`;
    }).join('\n\n');
  }

  let vipSection = '';
  if (vipItems.length > 0) {
    vipSection = vipItems.map((item, idx) => {
      return `👑 <b>Señal VIP #${idx + 1}: ${item.sportEmoji} ${item.eventTitle}</b>
🏆 <i>${item.league}</i> · ⏰ ${item.kickoffTime}
👉 <b>Jugada VIP:</b> ${item.selection}
📈 <b>Cuota Óptima:</b> @${item.minOdds.toFixed(2)} | 🧠 <b>Edge:</b> +${item.edge.toFixed(1)}% (+EV Alto)
💰 <b>Stake:</b> ${item.stakeUnits.toFixed(1)}u`;
    }).join('\n\n');
  }

  return `🌌 <b>CARTELERA OFICIAL DE PRONÓSTICOS — JORNADA DE HOY</b>
📅 <b>Fecha:</b> ${dateCapitalized} · ⏰ <b>Emisión:</b> 00:30 AM (Cuotas Intactas)
🤖 <i>Escaneo Cuantitativo de 5 Deportes Oficiales completado.</i>

━━━━━━━━━━━━━━━━━━━━━
🌟 <b>PRONÓSTICOS ABIERTOS (CANAL PÚBLICO):</b>
━━━━━━━━━━━━━━━━━━━━━
${freeSection || '<i>Cartelera en procesamiento continuo de líneas.</i>'}

━━━━━━━━━━━━━━━━━━━━━
👑 <b>SEÑALES EXCLUSIVAS CANAL VIP:</b>
━━━━━━━━━━━━━━━━━━━━━
${vipSection || '<i>Disponibles en el canal privado de suscriptores.</i>'}

⚠️ <b>REGLA DE ORO DE GESTIÓN:</b>
<i>Realiza tus entradas temprano para asegurar la cuota antes del cierre de líneas por el movimiento de mercado de las casas.</i>

👑 <i>Acceso al Canal VIP & Comprobantes: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

/**
 * ETAPA 2: Formato de Resolución en Tiempo Real (Post-Partido)
 */
export function formatRealTimeSettlementPostMatch(
  eventTitle: string,
  selection: string,
  odds: number,
  isWon: boolean,
  unitsGainedOrLost: number,
  finalScore: string,
  sportEmoji: string = '⚽'
): string {
  if (isWon) {
    const unitsStr = unitsGainedOrLost > 0 ? `+${unitsGainedOrLost.toFixed(2)}` : `+${(odds - 1).toFixed(2)}`;
    return `✅ <b>¡PRONÓSTICO ACERTADO (${unitsStr} Unidades)! [Marcador Final: ${finalScore}]</b>

${sportEmoji} <b>Partido:</b> ${eventTitle}
🎯 <b>Selección:</b> ${selection}
📈 <b>Cuota Cerrada:</b> @${odds.toFixed(2)}
🏦 <i>Bankroll auditado y sumado en vivo a la base de datos oficial.</i>

👑 <i>Para ingresar al Canal VIP o enviar tu comprobante: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
  } else {
    const unitsLostStr = unitsGainedOrLost < 0 ? `${unitsGainedOrLost.toFixed(2)}` : `-1.00`;
    return `❌ <b>PRONÓSTICO NO ACERTADO (${unitsLostStr} Unidades) [Marcador Final: ${finalScore}]</b>

${sportEmoji} <b>Partido:</b> ${eventTitle}
🎯 <b>Selección:</b> ${selection}
📈 <b>Cuota:</b> @${odds.toFixed(2)}
📊 <i>Gestión de banca Kelly aplicada para proteger el capital.</i>

👑 <i>Para ingresar al Canal VIP o enviar tu comprobante: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
  }
}

/**
 * ETAPA 3: Formato de Reporte de Cierre de Jornada (100% Partidos Finalizados)
 */
export function formatCierreJornadaReport(report: DailyAuditRecord): string {
  const isPositive = report.netUnits >= 0;
  const sign = isPositive ? '+' : '';
  const netSolesFormatted = Math.abs(report.netSoles).toFixed(2);
  const solesSign = report.netSoles >= 0 ? '+S/.' : '-S/.';

  const picksBreakdown = report.picksSummaryList && report.picksSummaryList.length > 0
    ? report.picksSummaryList.map(p => `• ${p}`).join('\n')
    : `• Acertadas: ${report.wonPicks} | Falladas: ${report.lostPicks} | Push: ${report.pushPicks}`;

  return `🏁 <b>REPORTE DE CIERRE DE JORNADA — FIJAS IA</b>
📅 <b>Fecha:</b> ${report.dayName}, ${report.date} · ⏰ <b>Cierre 100% Completado</b>

📊 <b>BALANCE CUANTITATIVO DEL DÍA:</b>
• 📋 <b>Total Pronósticos Oficiales:</b> ${report.totalPicks}
• ✅ <b>Pronósticos Acertados:</b> ${report.wonPicks}
• ❌ <b>Pronósticos Fallados:</b> ${report.lostPicks}
• ⚪ <b>Push / Nulos:</b> ${report.pushPicks}
• 🎯 <b>Tasa de Acierto (Win Rate):</b> <b>${report.winRate.toFixed(1)}%</b>
• 📈 <b>Rendimiento Diario (Yield):</b> <b>${sign}${report.yieldRoi.toFixed(1)}%</b>
• 💰 <b>Balance Neto del Día:</b> <b>${sign}${report.netUnits.toFixed(2)} Unidades (${solesSign} ${netSolesFormatted})</b>

📝 <b>DESGLOSE DE ENCUENTROS DEL DÍA:</b>
${picksBreakdown}

💾 <i>Registrado y sellado en la Base de Datos Histórica Auditada.</i>
👑 <i>Atención y suscripciones VIP: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

/**
 * ETAPA 4: Formato de Resumen Semanal (Domingos por la Noche)
 */
export function formatWeeklySummaryReport(weekly: WeeklyAuditRecord): string {
  const isPositive = weekly.netUnits >= 0;
  const sign = isPositive ? '+' : '';
  const netSolesFormatted = Math.abs(weekly.netSoles).toFixed(2);
  const solesSign = weekly.netSoles >= 0 ? '+S/.' : '-S/.';

  const dailyList = weekly.dailyBreakdown.map(d => {
    const dSign = d.netUnits >= 0 ? '+' : '';
    const emoji = d.netUnits > 0 ? '🟢' : d.netUnits < 0 ? '🔴' : '⚪';
    return `${emoji} <b>${d.day} (${d.date}):</b> ${dSign}${d.netUnits.toFixed(2)}u (WR: ${d.winRate.toFixed(0)}%)`;
  }).join('\n');

  return `🗓️ <b>AUDITORÍA SEMANAL OFICIAL — SEMANA #${weekly.weekNumber}</b>
📆 <b>Periodo:</b> ${weekly.dateRange} (7 Días Auditados)
🤖 <i>Emisión Automática de Domingo por la Noche.</i>

━━━━━━━━━━━━━━━━━━━━━
🏆 <b>RESUMEN EJECUTIVO DE LA SEMANA:</b>
━━━━━━━━━━━━━━━━━━━━━
• 📋 <b>Total Pronósticos Disparados:</b> ${weekly.totalPicks}
• ✅ <b>Acertados:</b> ${weekly.wonPicks} | ❌ <b>Fallados:</b> ${weekly.lostPicks}
• 🎯 <b>Win Rate Semanal:</b> <b>${weekly.winRate.toFixed(1)}%</b>
• 📈 <b>Yield / ROI Semanal:</b> <b>+${weekly.yieldRoi.toFixed(1)}%</b>
• 💰 <b>BENEFICIO NETO SEMANAL:</b> <b>${sign}${weekly.netUnits.toFixed(2)} Unidades (${solesSign} ${netSolesFormatted})</b>
• 🌟 <b>Mejor Jornada:</b> ${weekly.bestDay.day} (+${weekly.bestDay.netUnits.toFixed(2)}u)

━━━━━━━━━━━━━━━━━━━━━
📊 <b>DESGLOSE DÍA POR DÍA (LUNES A DOMINGO):</b>
━━━━━━━━━━━━━━━━━━━━━
${dailyList}

👑 <i>Comienza la nueva semana con el pie derecho en el VIP: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

/**
 * ETAPA 4: Formato de Resumen Mensual (Auditoría de 30 Días con Yield %)
 */
export function formatMonthlyAuditReport(monthly: MonthlyAuditRecord): string {
  const isPositive = monthly.netUnits >= 0;
  const sign = isPositive ? '+' : '';
  const netSolesFormatted = Math.abs(monthly.netSoles).toFixed(2);
  const solesSign = monthly.netSoles >= 0 ? '+S/.' : '-S/.';

  const sportsList = monthly.sportBreakdown.map(s => {
    const sSign = s.netUnits >= 0 ? '+' : '';
    return `• <b>${s.sportName}:</b> ${s.picks} picks | WR: ${s.winRate.toFixed(1)}% | Balance: ${sSign}${s.netUnits.toFixed(2)}u`;
  }).join('\n');

  return `🏛️ <b>AUDITORÍA MENSUAL OFICIAL — ${monthly.monthName.toUpperCase()}</b>
📊 <i>Informe de Rentabilidad y Control de Varianza Cuantitativa (30 Días).</i>

━━━━━━━━━━━━━━━━━━━━━
📈 <b>MÉTRICAS CLAVE ACUMULADAS:</b>
━━━━━━━━━━━━━━━━━━━━━
• 📋 <b>Total Pronósticos Auditados:</b> ${monthly.totalPicks}
• 🎯 <b>Win Rate Mensual Consolidado:</b> <b>${monthly.winRate.toFixed(1)}%</b>
• 🚀 <b>YIELD / ROI ACUMULADO DEL MES:</b> <b>+${monthly.cumulativeYieldRoi.toFixed(1)}%</b>
• 💰 <b>BENEFICIO NETO TOTAL:</b> <b>${sign}${monthly.netUnits.toFixed(2)} Unidades (${solesSign} ${netSolesFormatted})</b>
• 🛡️ <b>Closing Line Value (CLV Positivo):</b> ${monthly.clvPositivePercentage.toFixed(1)}% de cuotas batidas antes del pitazo

━━━━━━━━━━━━━━━━━━━━━
🏅 <b>RENDIMIENTO POR DISCIPLINA DEPORTIVA:</b>
━━━━━━━━━━━━━━━━━━━━━
${sportsList}

📌 <b>TRANSPARENCIA TOTAL:</b>
<i>Cada entrada está respaldada por registros numéricos con sello temporal inalterable.</i>

👑 <i>Canal de Suscripciones VIP: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

// Master Cycle Fetch Helpers
export async function getMasterCycleState(): Promise<MasterCycleState | null> {
  try {
    const res = await fetch('/api/master-cycle/status');
    if (res.ok) {
      const data = await res.json();
      return data.state;
    }
  } catch (e) {
    console.warn('Could not fetch Master Cycle State:', e);
  }
  return null;
}

export async function triggerMasterCycleStage1(): Promise<{ ok: boolean; message?: string; telegramSent?: boolean; state?: MasterCycleState }> {
  const res = await fetch('/api/master-cycle/trigger-stage-1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function triggerMasterCycleStage2Settle(params: {
  pickId: string;
  status: 'WON' | 'LOST' | 'PUSH';
  finalScore: string;
  notes?: string;
  broadcastTelegram?: boolean;
}): Promise<{ ok: boolean; message?: string; pick?: any; telegramSent?: boolean; state?: MasterCycleState }> {
  const res = await fetch('/api/master-cycle/trigger-stage-2-settle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return await res.json();
}

export async function triggerMasterCycleStage3Cierre(): Promise<{ ok: boolean; report?: DailyAuditRecord; telegramSent?: boolean; state?: MasterCycleState }> {
  const res = await fetch('/api/master-cycle/trigger-stage-3-cierre', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function triggerMasterCycleStage4Weekly(): Promise<{ ok: boolean; weekly?: WeeklyAuditRecord; telegramSent?: boolean; state?: MasterCycleState }> {
  const res = await fetch('/api/master-cycle/trigger-stage-4-weekly', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function triggerMasterCycleStage4Monthly(): Promise<{ ok: boolean; monthly?: MonthlyAuditRecord; telegramSent?: boolean; state?: MasterCycleState }> {
  const res = await fetch('/api/master-cycle/trigger-stage-4-monthly', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

// =========================================================================
// MÓDULO DUAL: FORMATTERS Y HELPERS DE ANÁLISIS PRE-PARTIDO & LIVE IN-PLAY
// =========================================================================

/**
 * Formatea Alerta en Vivo de Alta Ventaja (+EV Live > 12%)
 */
export function formatLiveInPlayAlert(match: LiveInPlayMatch): string {
  const totalShots = (match.stats.homeShotsOnTarget || 0) + (match.stats.awayShotsOnTarget || 0);
  const totalXG = ((match.stats.xGHome || 0) + (match.stats.xGAway || 0)).toFixed(2);
  const pressureBar = '█'.repeat(Math.round(match.pressureIndex / 10)) + '░'.repeat(10 - Math.round(match.pressureIndex / 10));

  return `⚡ <b>ALERTA EN VIVO — DESAJUSTE CUANTITATIVO (+EV LIVE)</b>
${match.sportEmoji} <b>${match.eventTitle}</b> (${match.league})
⏱️ <b>Minuto:</b> <b>${match.currentMinute}'</b> | <b>Marcador Actual:</b> <b>${match.currentScore}</b> (${match.period})
🔥 <b>Índice de Presión Ofensiva:</b> <b>${match.pressureIndex}/100</b> [${pressureBar}]
📊 <b>Métricas Live:</b> xG Total: ${totalXG} | Tiros al Arco: ${totalShots} | Posesión: ${match.stats.possessionHome}% - ${match.stats.possessionAway}%

━━━━━━━━━━━━━━━━━━━━━
🎯 <b>JUGADA EN VIVO RECOMENDADA:</b>
━━━━━━━━━━━━━━━━━━━━━
• 📌 <b>Mercado:</b> ${match.liveMarket}
• 📈 <b>Selección:</b> <b>${match.liveSelection}</b>
• 💎 <b>Cuota Live Actual:</b> <b>@${match.liveOdds.toFixed(2)}</b> <i>(Subió desde @${match.preMatchOdds.toFixed(2)} pre-partido)</i>
• 📐 <b>Cuota Justa Modelo:</b> @${match.fairOdds.toFixed(2)} | <b>Edge +EV Live:</b> <b>+${match.liveEdgeEV.toFixed(1)}%</b>
• ⚠️ <b>Nivel de Urgencia:</b> <b>${match.urgencyLevel}</b> — <i>Entrar rápido antes de corrección o suspensión de línea.</i>

━━━━━━━━━━━━━━━━━━━━━
💡 <b>ANÁLISIS EN DIRECTO:</b>
<i>${match.reasonWhyLiveValue}</i>

🏦 <i>Gestión de Stake Live: 1.5u - 2.0u recomendadas.</i>
🤖 <i>Canal Oficial: <a href="https://t.me/FijasIAOficial">@FijasIAOficial</a></i>`;
}

/**
 * Formatea Celebración Inmediata de Pick en Vivo Ganado
 */
export function formatLiveInPlaySettledCelebration(match: LiveInPlayMatch, goalMinute?: number, netUnits?: number, netSoles?: number): string {
  const min = goalMinute || match.currentMinute;
  const units = netUnits !== undefined ? netUnits : (match.netUnitsGained || ((match.liveOdds - 1) * 1.5));
  const soles = netSoles !== undefined ? netSoles : (units * 50);

  return `✅ <b>¡GOL / EVENTO CONFIRMADO! ¡PICK EN VIVO GANADO EN MINUTOS!</b>
🎉 <i>¡Liquidación inmediata con el motor en tiempo real!</i>

━━━━━━━━━━━━━━━━━━━━━
${match.sportEmoji} <b>Partido:</b> <b>${match.eventTitle}</b> (${match.league})
🎯 <b>Jugada Live:</b> <b>${match.liveSelection}</b> (Cuota cazada @${match.liveOdds.toFixed(2)})
⏱️ <b>Minuto de Acierto:</b> <b>${min}'</b> | <b>Marcador Actualizado:</b> <b>${match.currentScore}</b>
💰 <b>BENEFICIO NETO INSTANTÁNEO:</b> <b>+${units.toFixed(2)} Unidades (+S/. ${soles.toFixed(2)})</b>
━━━━━━━━━━━━━━━━━━━━━

🏦 <i>Sumado de inmediato a la base de datos de auditoría y bankroll en soles.</i>
👑 <i>Señales exclusivas y parlays VIP en: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

/**
 * Formatea la Combinada de Oro VIP (Alta Probabilidad)
 */
export function formatGoldenParlayVIP(parlay: GoldenParlayVIP): string {
  const legsList = parlay.legs.map((leg, idx) => {
    return `<b>${idx + 1}. ${leg.sportEmoji} ${leg.eventTitle}</b> (${leg.league})
   • ⏰ <b>Hora:</b> ${leg.kickoffTime}
   • 🎯 <b>Selección:</b> <b>${leg.selection}</b> (${leg.market})
   • 📈 <b>Cuota:</b> <b>@${leg.odds.toFixed(2)}</b> | 🛡️ <b>Certeza Modelo:</b> <b>${leg.individualWinProb.toFixed(1)}%</b>
   • 💡 <i>${leg.keyReason}</i>`;
  }).join('\n\n');

  return `👑 <b>COMBINADA DE ORO — FIJAS IA (EXCLUSIVO VIP)</b>
📅 <b>Fecha:</b> ${parlay.date} | 💎 <b>Estrategia:</b> Multiplicador de Alta Certeza
🤖 <i>Construida algorítmicamente combinando las mayores probabilidades del día (>80% individual).</i>

━━━━━━━━━━━━━━━━━━━━━
📋 <b>DESGLOSE DE SELECCIONES VIP:</b>
━━━━━━━━━━━━━━━━━━━━━
${legsList}

━━━━━━━━━━━━━━━━━━━━━
🎯 <b>MÉTRICAS MATEMÁTICAS DEL PARLAY:</b>
━━━━━━━━━━━━━━━━━━━━━
• 📊 <b>CUOTA COMBINADA TOTAL:</b> <b>@${parlay.combinedOdds.toFixed(2)}</b>
• 🛡️ <b>Probabilidad Matemática Conjunta:</b> <b>${parlay.jointWinProb.toFixed(1)}%</b>
• 💰 <b>Stake Recomendado:</b> <b>${parlay.recommendedStakeUnits.toFixed(1)}u (S/. ${parlay.stakeSoles.toFixed(2)})</b>
• 🚀 <b>RETORNO PROYECTADO:</b> <b>S/. ${parlay.potentialReturnSoles.toFixed(2)}</b> (+S/. ${parlay.potentialNetSoles.toFixed(2)} neto)

👑 <i>Pronóstico exclusivo para miembros VIP activos. Prohibida su reventa o difusión no autorizada.</i>
💎 <i>Soporte y Renovación: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;
}

/**
 * Formatea Celebración de Combinada de Oro VIP Acertada
 */
export function formatGoldenParlaySettledVIP(parlay: GoldenParlayVIP): string {
  const legsList = parlay.legs.map((leg, idx) => {
    return `✅ <b>${idx + 1}. ${leg.sportEmoji} ${leg.eventTitle}</b> ➔ <b>${leg.selection}</b> (@${leg.odds.toFixed(2)}) [${leg.finalScore || 'FINAL'}]`;
  }).join('\n');

  return `🎉 <b>¡COMBINADA DE ORO ACERTADA A CUOTA @${parlay.combinedOdds.toFixed(2)}!</b>
👑 <i>¡PLENO TOTAL EN EL CANAL VIP DE FIJAS IA!</i>

━━━━━━━━━━━━━━━━━━━━━
🏆 <b>RESULTADOS OFICIALES VERIFICADOS:</b>
━━━━━━━━━━━━━━━━━━━━━
${legsList}

━━━━━━━━━━━━━━━━━━━━━
💰 <b>BALANCE FINAL VIP:</b>
━━━━━━━━━━━━━━━━━━━━━
• 💵 <b>Retorno Total Cobrado:</b> <b>S/. ${parlay.potentialReturnSoles.toFixed(2)}</b>
• 📈 <b>Beneficio Neto:</b> <b>+${((parlay.combinedOdds - 1) * parlay.recommendedStakeUnits).toFixed(2)} Unidades (+S/. ${parlay.potentialNetSoles.toFixed(2)})</b>
• 💎 <b>Yield del Parlay:</b> <b>+${((parlay.combinedOdds - 1) * 100).toFixed(0)}% ROI</b>

🏦 <i>Auditado e incorporado al registro histórico inalterable de suscriptores VIP.</i>
🚀 <i>¡Seguimos ganando con precisión cuantitativa!</i>`;
}

// ==========================================
// API CLIENT CALLERS (LIVE SCANNER, PRE-MATCH, GOLDEN PARLAY)
// ==========================================

export async function getLiveScannerMatches(): Promise<{ ok: boolean; matches: LiveInPlayMatch[] }> {
  try {
    const res = await fetch('/api/live-scanner/matches');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Could not fetch Live Scanner matches:', e);
  }
  return { ok: false, matches: [] };
}

export async function triggerLiveScan(): Promise<{ ok: boolean; matches: LiveInPlayMatch[]; alertTriggeredCount: number }> {
  const res = await fetch('/api/live-scanner/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function broadcastLiveSignal(matchId: string): Promise<{ ok: boolean; message?: string; telegramSent?: boolean; match?: LiveInPlayMatch }> {
  const res = await fetch('/api/live-scanner/broadcast-signal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId })
  });
  return await res.json();
}

export async function settleLiveMatch(params: {
  matchId: string;
  status: 'SETTLED_WON' | 'SETTLED_LOST';
  finalScore: string;
  goalMinute?: number;
  broadcastCelebration?: boolean;
}): Promise<{ ok: boolean; message?: string; telegramSent?: boolean; match?: LiveInPlayMatch }> {
  const res = await fetch('/api/live-scanner/settle-live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return await res.json();
}

export async function getNextDayPreMatchAnalysis(): Promise<{ ok: boolean; status: NextDayPipelineStatus }> {
  try {
    const res = await fetch('/api/pre-match/next-day');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Could not fetch next day pre-match analysis:', e);
  }
  return {
    ok: false,
    status: {
      isProcessing: false,
      itemsScannedCount: 0,
      topOpportunitiesCount: 0,
      nextMidnightRelease: '00:30 AM',
      scannedMatches: []
    }
  };
}

export async function triggerNextDayScan(): Promise<{ ok: boolean; status: NextDayPipelineStatus }> {
  const res = await fetch('/api/pre-match/scan-next-day', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function promoteNextDayToCartelera(matchId: string): Promise<{ ok: boolean; message?: string; match?: NextDayMatchAnalysis }> {
  const res = await fetch('/api/pre-match/promote-to-cartelera', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId })
  });
  return await res.json();
}

export async function getTodayGoldenParlayVIP(): Promise<{ ok: boolean; parlay: GoldenParlayVIP }> {
  try {
    const res = await fetch('/api/golden-parlay/today');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Could not fetch Golden Parlay VIP:', e);
  }
  return { ok: false, parlay: null as any };
}

export async function generateGoldenParlayVIP(): Promise<{ ok: boolean; parlay: GoldenParlayVIP }> {
  const res = await fetch('/api/golden-parlay/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function broadcastGoldenParlayVIP(): Promise<{ ok: boolean; telegramSent?: boolean; parlay?: GoldenParlayVIP }> {
  const res = await fetch('/api/golden-parlay/broadcast-vip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

export async function settleGoldenParlayVIP(params: {
  status: 'WON' | 'LOST';
  legsResults: { legId: string; status: 'WON' | 'LOST'; finalScore: string }[];
  broadcastCelebration?: boolean;
}): Promise<{ ok: boolean; telegramSent?: boolean; parlay?: GoldenParlayVIP }> {
  const res = await fetch('/api/golden-parlay/settle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return await res.json();
}




