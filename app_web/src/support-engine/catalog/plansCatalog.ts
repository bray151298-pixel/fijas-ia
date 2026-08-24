/**
 * FIJAS IA SUPPORT ENGINE — CENTRALIZED PLANS & PAYMENT CATALOG
 * Única Fuente de Verdad para Planes, Precios, Duraciones y Cuentas de Pago
 */

export interface VIPPlan {
  id: 'semanal' | 'mensual' | 'trimestral';
  name: string;
  shortName: string;
  pricePEN: number;
  priceUSDT: number;
  durationDays: number;
  badge?: string;
  description: string;
  benefits: string[];
  recommended?: boolean;
  order: number;
  active: boolean;
}

export interface PaymentMethodInfo {
  id: 'yape' | 'plin' | 'binance' | 'usdt';
  name: string;
  type: 'fiat_pe' | 'crypto';
  accountNumber?: string;
  accountHolder?: string;
  payId?: string;
  walletAddress?: string;
  network?: string;
  instructions: string;
  active: boolean;
}

export const VIP_PLANS_CATALOG: Record<string, VIPPlan> = {
  semanal: {
    id: 'semanal',
    name: '⚡ Pase Semanal de Prueba (7 Días)',
    shortName: 'Semanal (7d)',
    pricePEN: 19.90,
    priceUSDT: 5.00,
    durationDays: 7,
    badge: 'PRUEBA',
    description: 'Ideal para probar el rendimiento y consistencia del modelo durante 1 semana completa.',
    benefits: [
      '3 a 5 Señales +EV diarias (+8% a +15% de ventaja matemática)',
      '1 Combinada de Oro diaria (Cuota @2.50 a @4.00)',
      'Análisis táctico cuantitativo y xG por partido',
      'Alertas de valor y liquidación en tiempo real'
    ],
    order: 1,
    active: true
  },
  mensual: {
    id: 'mensual',
    name: '👑 Pase Mensual VIP (30 Días)',
    shortName: 'Mensual VIP (30d)',
    pricePEN: 39.90,
    priceUSDT: 12.00,
    durationDays: 30,
    badge: 'MÁS POPULAR ⭐',
    recommended: true,
    description: 'Acceso integral durante todo el mes con gestión de bankroll y todas las señales cuantitativas.',
    benefits: [
      'Acceso total 24/7 al Canal VIP de Señales',
      '4 a 6 Señales +EV diarias en todas las ligas top',
      '1 Combinada de Oro diaria de alta probabilidad',
      'Simulador de Bankroll con Criterio de Kelly (0.25x)',
      'Soporte prioritario y reportes diarios auditados'
    ],
    order: 2,
    active: true
  },
  trimestral: {
    id: 'trimestral',
    name: '💎 Pase Trimestral (3 Meses / 90 Días)',
    shortName: 'Trimestral (90d)',
    pricePEN: 89.90,
    priceUSDT: 25.00,
    durationDays: 90,
    badge: 'MEJOR VALOR 🔥',
    description: '3 meses continuos de inversión deportiva cuantitativa con más del 25% de ahorro garantizado.',
    benefits: [
      'Todos los beneficios del Pase Mensual VIP por 90 días',
      'Ahorro del +25% frente al pago mensual regular',
      'Acceso prioritario a señales de alta liquidencia',
      'Guía avanzada de inversión y control de varianza',
      'Atención personalizada con el administrador'
    ],
    order: 3,
    active: true
  }
};

export const PAYMENT_METHODS_CATALOG: Record<string, PaymentMethodInfo> = {
  yape: {
    id: 'yape',
    name: 'Yape (Perú)',
    type: 'fiat_pe',
    accountNumber: '901326470',
    accountHolder: 'BRAY YUSMAN QUISPE ATAO',
    instructions: 'Abre tu app Yape, transfiere el monto exacto al número 901326470 y envía la captura de pantalla a este chat.',
    active: true
  },
  plin: {
    id: 'plin',
    name: 'Plin (Perú)',
    type: 'fiat_pe',
    accountNumber: '901326470',
    accountHolder: 'BRAY YUSMAN QUISPE ATAO',
    instructions: 'Transfiere por Plin (BBVA, Scotiabank, Interbank, BanBif) al número 901326470 y envía la captura aquí.',
    active: true
  },
  binance: {
    id: 'binance',
    name: 'Binance Pay (Cripto)',
    type: 'crypto',
    payId: '849201948',
    instructions: 'En Binance, ve a Pay -> Enviar -> Ingresa el Pay ID 849201948, transfiere en USDT y envía el comprobante.',
    active: true
  },
  usdt: {
    id: 'usdt',
    name: 'USDT (Red BEP-20 / BNB Chain)',
    type: 'crypto',
    walletAddress: '0x87a52f4c9c1b827e69212cfb49e2946c10b40cb2',
    network: 'BNB Smart Chain (BEP20)',
    instructions: 'Envía USDT únicamente por la red BEP20 (BNB Smart Chain) a la billetera indicada y envía el hash TXID.',
    active: true
  }
};

export function getPlanById(planId: string): VIPPlan | undefined {
  const norm = planId.toLowerCase().trim();
  if (norm.includes('seman')) return VIP_PLANS_CATALOG.semanal;
  if (norm.includes('mensu') || norm.includes('mes')) return VIP_PLANS_CATALOG.mensual;
  if (norm.includes('trimest') || norm.includes('3 meses')) return VIP_PLANS_CATALOG.trimestral;
  return VIP_PLANS_CATALOG[norm];
}

export function getAllActivePlans(): VIPPlan[] {
  return Object.values(VIP_PLANS_CATALOG).filter(p => p.active).sort((a, b) => a.order - b.order);
}
