/**
 * FIJAS IA SUPPORT ENGINE — RENEWAL SCHEDULER & EXPIRATION ALERTS
 */
import { VIPSubscriber as StoredVIPSubscriber } from '../../types';

export interface RenewalAlertEvent {
  chatId: string;
  subscriberName: string;
  daysRemaining: number;
  planName: string;
  alertType: '3_DAYS_BEFORE' | '1_DAY_BEFORE' | 'EXPIRED_TODAY';
  message: string;
}

export function evaluateSubscriberRenewalAlerts(subscribers: any[]): RenewalAlertEvent[] {
  const alerts: RenewalAlertEvent[] = [];
  const now = Date.now();

  for (const sub of subscribers) {
    if (!sub.expiryDate || sub.status === 'revoked') continue;

    const expiryTime = new Date(sub.expiryDate).getTime();
    const diffDays = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

    if (diffDays === 3) {
      alerts.push({
        chatId: String(sub.chatId),
        subscriberName: sub.name,
        daysRemaining: 3,
        planName: sub.planName,
        alertType: '3_DAYS_BEFORE',
        message: `⏳ <b>Recordatorio VIP: Tu membresía vence en 3 días</b>\n━━━━━━━━━━━━━━━━━━━━\n👋 Hola <b>${sub.name}</b>, tu acceso al Canal VIP finaliza el <b>${new Date(sub.expiryDate).toLocaleDateString('es-PE')}</b>.\n\n👉 Renueva hoy tu <b>${sub.planName}</b> para no perder las jugadas del fin de semana.`
      });
    } else if (diffDays === 1) {
      alerts.push({
        chatId: String(sub.chatId),
        subscriberName: sub.name,
        daysRemaining: 1,
        planName: sub.planName,
        alertType: '1_DAY_BEFORE',
        message: `🚨 <b>Último día: Tu membresía VIP vence mañana</b>\n━━━━━━━━━━━━━━━━━━━━\n👋 Hola <b>${sub.name}</b>, mantén tu acceso activo renovando por Yape o Plin al número <code>901326470</code>.`
      });
    } else if (diffDays <= 0 && sub.status !== 'expired') {
      alerts.push({
        chatId: String(sub.chatId),
        subscriberName: sub.name,
        daysRemaining: 0,
        planName: sub.planName,
        alertType: 'EXPIRED_TODAY',
        message: `⌛ <b>Tu membresía VIP ha finalizado</b>\n━━━━━━━━━━━━━━━━━━━━\n👋 Gracias por formar parte de FIJAS IA. Puedes reactivar tu pase en cualquier momento enviando tu comprobante a este bot.`
      });
    }
  }

  return alerts;
}
