/**
 * FIJAS IA SUPPORT ENGINE — CUSTOMER MEMORY & CRM STATE ENGINE
 */

export type LeadStatus =
  | 'NEW'
  | 'INTERESTED'
  | 'CONSIDERING'
  | 'PAYMENT_STARTED'
  | 'VIP_ACTIVE'
  | 'VIP_EXPIRING'
  | 'VIP_EXPIRED'
  | 'LOST'
  | 'BLOCKED';

export type PaymentStatus =
  | 'NONE'
  | 'PENDING_VALIDATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'REFUNDED';

export type MembershipStatus =
  | 'NONE'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'REVOKED';

export interface CustomerProfile {
  chatId: string;
  name: string;
  username?: string;
  createdAt: string;
  leadStatus: LeadStatus;
  paymentStatus: PaymentStatus;
  membershipStatus: MembershipStatus;
  currentPlanId?: string;
  currentPlanName?: string;
  membershipStartDate?: string;
  membershipExpiryDate?: string;
  lastPaymentAmount?: number;
  lastPaymentCurrency?: string;
  paymentCount: number;
  totalPaidPEN: number;
  lastInteractionAt: string;
  lastIntent?: string;
  fraudScore: number;
  assignedInviteLink?: string;
  notes?: string;
}

const memoryStore = new Map<string, CustomerProfile>();

export function getOrCreateCustomer(chatId: string | number, name: string, username?: string): CustomerProfile {
  const id = String(chatId);
  let customer = memoryStore.get(id);

  const nowIso = new Date().toISOString();

  if (!customer) {
    customer = {
      chatId: id,
      name: name || 'Inversionista Deportivo',
      username: username ? (username.startsWith('@') ? username : `@${username}`) : undefined,
      createdAt: nowIso,
      leadStatus: 'NEW',
      paymentStatus: 'NONE',
      membershipStatus: 'NONE',
      paymentCount: 0,
      totalPaidPEN: 0,
      lastInteractionAt: nowIso,
      fraudScore: 0
    };
    memoryStore.set(id, customer);
  } else {
    customer.name = name || customer.name;
    if (username) customer.username = username.startsWith('@') ? username : `@${username}`;
    customer.lastInteractionAt = nowIso;
  }

  return customer;
}

export function updateCustomer(chatId: string | number, updates: Partial<CustomerProfile>): CustomerProfile | undefined {
  const id = String(chatId);
  const existing = memoryStore.get(id);
  if (!existing) return undefined;

  const updated: CustomerProfile = {
    ...existing,
    ...updates,
    lastInteractionAt: new Date().toISOString()
  };

  memoryStore.set(id, updated);
  return updated;
}

export function getAllCustomers(): CustomerProfile[] {
  return Array.from(memoryStore.values());
}
