/**
 * FIJAS IA SUPPORT ENGINE — COMMERCIAL & CONVERSION ANALYTICS
 */

export interface SalesAnalyticsStats {
  totalLeads: number;
  activeSubscribers: number;
  expiringSubscribers: number;
  expiredSubscribers: number;
  totalRevenuePEN: number;
  conversionRatePercent: number;
  averageCustomerValuePEN: number;
  monthlyProjectedPEN: number;
}

export function calculateCommercialAnalytics(subscribers: any[], customers: any[]): SalesAnalyticsStats {
  const totalLeads = Math.max(customers.length, subscribers.length);
  let activeSubscribers = 0;
  let expiringSubscribers = 0;
  let expiredSubscribers = 0;
  let totalRevenuePEN = 0;

  const now = Date.now();

  for (const s of subscribers) {
    const expiryTime = new Date(s.expiryDate).getTime();
    const diffDays = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

    if (s.status === 'revoked') {
      // revoked
    } else if (diffDays <= 0) {
      expiredSubscribers++;
    } else if (diffDays <= 3) {
      expiringSubscribers++;
      activeSubscribers++;
    } else {
      activeSubscribers++;
    }

    const amt = typeof s.amountPaid === 'number' ? s.amountPaid : (parseFloat(s.amountPaid) || 0);
    const inSoles = (s.currency === 'USD' || s.currency === 'USDT') ? amt * 3.75 : amt;
    totalRevenuePEN += inSoles;
  }

  const conversionRate = totalLeads > 0 ? Number(((subscribers.length / totalLeads) * 100).toFixed(1)) : 0;
  const avgValue = subscribers.length > 0 ? Number((totalRevenuePEN / subscribers.length).toFixed(2)) : 0;
  const monthlyProjected = Number((activeSubscribers * 39.90).toFixed(2));

  return {
    totalLeads,
    activeSubscribers,
    expiringSubscribers,
    expiredSubscribers,
    totalRevenuePEN: Number(totalRevenuePEN.toFixed(2)),
    conversionRatePercent: conversionRate,
    averageCustomerValuePEN: avgValue,
    monthlyProjectedPEN: monthlyProjected
  };
}
