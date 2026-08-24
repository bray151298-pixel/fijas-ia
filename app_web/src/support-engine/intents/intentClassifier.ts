/**
 * FIJAS IA SUPPORT ENGINE — INTENT CLASSIFICATION ENGINE
 * Detección de 22 Intenciones de Usuario con Score de Confianza
 */

export type IntentType =
  | 'GREETING'
  | 'PRICE'
  | 'PLANS'
  | 'VIP_INFO'
  | 'HOW_IT_WORKS'
  | 'PAYMENT_METHOD'
  | 'PAYMENT_INSTRUCTIONS'
  | 'PAYMENT_SENT'
  | 'RECEIPT_SENT'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'VIP_ACCESS'
  | 'ACCESS_PROBLEM'
  | 'RENEWAL'
  | 'EXPIRATION'
  | 'FAQ'
  | 'SPORTS_ANALYSIS'
  | 'OBJECTION_GUARANTEE'
  | 'OBJECTION_EXPENSIVE'
  | 'OBJECTION_LOSS'
  | 'COMPLAINT'
  | 'REFUND_REQUEST'
  | 'HUMAN_SUPPORT'
  | 'UNKNOWN';

export interface ClassifiedIntent {
  intent: IntentType;
  confidence: number;
  matchedKeywords: string[];
  extractedPlanId?: string;
  extractedPaymentMethod?: string;
}

export function classifyUserIntent(text: string, hasAttachment = false): ClassifiedIntent {
  const norm = (text || '').toLowerCase().trim();

  // 1. Receipt / Voucher Sent
  if (hasAttachment) {
    return { intent: 'RECEIPT_SENT', confidence: 0.99, matchedKeywords: ['attachment_media'] };
  }

  const receiptKeywords = ['comprobante', 'constancia', 'voucher', 'captura', 'foto del pago', 'ya transferi', 'ya pagué', 'ya pague', 'ya deposite', 'ya deposité', 'abono'];
  const matchedReceipt = receiptKeywords.filter(k => norm.includes(k));
  if (matchedReceipt.length > 0) {
    return { intent: 'RECEIPT_SENT', confidence: 0.95, matchedKeywords: matchedReceipt };
  }

  // 2. Price / Cost Queries
  const priceKeywords = ['cuanto cuesta', 'cuánto cuesta', 'precio', 'precios', 'costo', 'costos', 'tarifa', 'valor', 'cuanto vale', 'cuánto vale'];
  const matchedPrice = priceKeywords.filter(k => norm.includes(k));
  if (matchedPrice.length > 0) {
    return { intent: 'PRICE', confidence: 0.96, matchedKeywords: matchedPrice };
  }

  // 3. Plans Queries
  const plansKeywords = ['planes', 'plan', 'membresia', 'membresía', 'suscripcion', 'suscripción', 'paquete', 'opciones vip', '/planes', '/start planes'];
  const matchedPlans = plansKeywords.filter(k => norm.includes(k));
  if (matchedPlans.length > 0) {
    return { intent: 'PLANS', confidence: 0.95, matchedKeywords: matchedPlans };
  }

  // 4. Payment Method & Instructions
  const paymentKeywords = ['como pago', 'cómo pago', 'metodo de pago', 'métodos de pago', 'donde pago', 'yape', 'plin', 'binance', 'usdt', 'transferencia', 'cuenta', 'numero de yape', 'número de yape', '/pagar', '/start pagar'];
  const matchedPayment = paymentKeywords.filter(k => norm.includes(k));
  if (matchedPayment.length > 0) {
    return { intent: 'PAYMENT_METHOD', confidence: 0.94, matchedKeywords: matchedPayment };
  }

  // 5. Objection: Guarantee / Certainty
  const guaranteeKeywords = ['seguro', '100%', 'garantizan', 'garantía', 'ganancia fija', 'es seguro', 'se gana siempre', 'fijas'];
  const matchedGuarantee = guaranteeKeywords.filter(k => norm.includes(k));
  if (matchedGuarantee.length > 0 && (norm.includes('?') || norm.includes('es ') || norm.includes('son '))) {
    return { intent: 'OBJECTION_GUARANTEE', confidence: 0.92, matchedKeywords: matchedGuarantee };
  }

  // 6. Objection: Fear of losing / Risk
  const lossKeywords = ['si pierdo', 'y si no gano', 'y si falla', 'riesgo', 'puedo perder', 'que pasa si pierdo'];
  const matchedLoss = lossKeywords.filter(k => norm.includes(k));
  if (matchedLoss.length > 0) {
    return { intent: 'OBJECTION_LOSS', confidence: 0.93, matchedKeywords: matchedLoss };
  }

  // 7. Objection: Price / Expensive
  const expKeywords = ['caro', 'muy caro', 'descuento', 'rebaja', 'promocion', 'promoción', 'mas barato'];
  const matchedExp = expKeywords.filter(k => norm.includes(k));
  if (matchedExp.length > 0) {
    return { intent: 'OBJECTION_EXPENSIVE', confidence: 0.91, matchedKeywords: matchedExp };
  }

  // 8. How it works / Methodology
  const howKeywords = ['como funciona', 'cómo funciona', 'de que trata', 'de qué trata', 'que es fijas ia', 'metodologia', 'metodología', 'algoritmo'];
  const matchedHow = howKeywords.filter(k => norm.includes(k));
  if (matchedHow.length > 0) {
    return { intent: 'HOW_IT_WORKS', confidence: 0.95, matchedKeywords: matchedHow };
  }

  // 9. Renewal Queries
  const renewalKeywords = ['renovar', 'renovacion', 'renovación', 'vencio', 'venció', 'extender', 'expira'];
  const matchedRenewal = renewalKeywords.filter(k => norm.includes(k));
  if (matchedRenewal.length > 0) {
    return { intent: 'RENEWAL', confidence: 0.94, matchedKeywords: matchedRenewal };
  }

  // 10. Access Problem / VIP Link
  const accessKeywords = ['no puedo entrar', 'enlace expirado', 'link no funciona', 'no me deja unir', 'problema con el link', 'acceso vip'];
  const matchedAccess = accessKeywords.filter(k => norm.includes(k));
  if (matchedAccess.length > 0) {
    return { intent: 'ACCESS_PROBLEM', confidence: 0.92, matchedKeywords: matchedAccess };
  }

  // 11. Human Support Request
  const supportKeywords = ['humano', 'asesor', 'persona', 'soporte', 'administrador', 'admin', 'bray', 'hablar con alguien'];
  const matchedSupport = supportKeywords.filter(k => norm.includes(k));
  if (matchedSupport.length > 0) {
    return { intent: 'HUMAN_SUPPORT', confidence: 0.93, matchedKeywords: matchedSupport };
  }

  // 12. Greetings
  const greetingKeywords = ['hola', 'buenas', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hey', '/start', 'inicio', 'empezar'];
  if (greetingKeywords.some(g => norm === g || norm.startsWith(g + ' '))) {
    return { intent: 'GREETING', confidence: 0.98, matchedKeywords: ['greeting'] };
  }

  // Fallback
  return { intent: 'UNKNOWN', confidence: 0.50, matchedKeywords: [] };
}
