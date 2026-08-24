/**
 * FIJAS IA SUPPORT ENGINE — CONVERSATIONAL SALES ENGINE
 * Generación de respuestas comerciales de alta conversión y seguimiento
 */
import { VIP_PLANS_CATALOG, getAllActivePlans, PAYMENT_METHODS_CATALOG } from '../catalog/plansCatalog';
import { CustomerProfile } from '../crm/customerMemory';

export function buildWelcomeSalesMessage(userName: string): string {
  return `👋 <b>¡Hola, ${userName}! Bienvenido a FIJAS IA (@SoporteFijasIA_bot)</b>
━━━━━━━━━━━━━━━━━━━━
🧠 <b>Asistente Cuantitativo de Apuestas Deportivas & Valor Esperado (+EV).</b>

Analizamos más de 1,500 mercados diarios con nuestro <b>Algoritmo Cuantitativo Propietario</b> para encontrar ventajas matemáticas reales sobre las casas de apuestas.

🏆 <b>¿Qué recibes en el Canal VIP?:</b>
• 4 a 6 Señales +EV diarias en las mejores ligas del mundo
• 1 Combinada de Oro diaria (Cuotas @2.50 a @4.00)
• Gestión de Bankroll profesional con Criterio de Kelly (0.25x)
• Alertas en tiempo real y soporte continuo

👇 <i>Selecciona una opción o consulta lo que necesites:</i>`;
}

export function buildPlansPresentationMessage(): string {
  const plans = getAllActivePlans();
  let text = `👑 <b>MEMBRESÍAS & PLANES VIP — FIJAS IA</b>\n`;
  text += `📈 <i>Invierte con ventaja matemática cuantificada y rentabilidad auditada.</i>\n\n`;

  plans.forEach(p => {
    text += `<b>${p.name}</b>\n`;
    text += `• Inversión: <b>S/ ${p.pricePEN.toFixed(2)}</b> o <b>$${p.priceUSDT.toFixed(2)} USDT</b>\n`;
    text += `• Duración: <b>${p.durationDays} Días</b> ${p.badge ? `[${p.badge}]` : ''}\n`;
    text += `• ${p.description}\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✅ <b>Formato 100% Neutro:</b> Cuotas universales para Betano, Bet365, Apuesta Total, Inkabet, Doradobet o cualquier casa.\n\n`;
  text += `👉 <i>Toca en <b>'Ver Cuentas de Pago'</b> para activar tu acceso al instante.</i>`;

  return text;
}

export function buildPaymentAccountsMessage(): string {
  const yape = PAYMENT_METHODS_CATALOG.yape;
  const binance = PAYMENT_METHODS_CATALOG.binance;

  return `💳 <b>CUENTAS OFICIALES DE PAGO — FIJAS IA</b>
━━━━━━━━━━━━━━━━━━━━
🇵🇪 <b>YAPE / PLIN (Perú):</b>
• Número: <code>${yape.accountNumber}</code>
• Titular: <b>${yape.accountHolder}</b>

🌐 <b>BINANCE PAY (Cripto USDT):</b>
• Pay ID: <code>${binance.payId}</code>

━━━━━━━━━━━━━━━━━━━━
💰 <b>TARIFAS:</b>
• ⚡ <b>Semanal (7 Días):</b> S/ 19.90 ($5 USDT)
• 👑 <b>Mensual VIP (30 Días):</b> S/ 39.90 ($12 USDT) ⭐
• 💎 <b>Trimestral (90 Días):</b> S/ 89.90 ($25 USDT)

📸 <b>ACTIVACIÓN INMEDIATA:</b>
1. Realiza el abono a nuestras cuentas oficiales.
2. <b>Envía la captura de tu comprobante directamente a este chat</b>.
3. El Administrador confirmará tu abono y te entregará tu <b>enlace exclusivo de acceso VIP</b>.`;
}
