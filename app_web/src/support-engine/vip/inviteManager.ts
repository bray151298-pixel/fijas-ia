/**
 * FIJAS IA SUPPORT ENGINE — VIP INVITE & ACCESS MANAGER
 * Generación de enlaces individuales de 1 solo uso con expiración
 */

export interface VIPInviteRecord {
  inviteId: string;
  chatId: string;
  inviteLink: string;
  planId: string;
  planName: string;
  createdAt: string;
  expiresAt: string;
  memberLimit: number;
  isUsed: boolean;
}

const invitesRegistry = new Map<string, VIPInviteRecord>();

export async function generateSingleUseVIPInvite(
  targetChannelId: string,
  userName: string,
  planName: string,
  botToken: string,
  durationDays = 30
): Promise<{ inviteLink: string; isFallback: boolean }> {
  try {
    const expireTimestamp = Math.floor((Date.now() + 86400000) / 1000); // 24 hours to join
    const cleanName = (userName || 'Miembro VIP').replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 30);
    const linkName = `${cleanName} - ${planName.slice(0, 15)}`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/createChatInviteLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChannelId,
        name: linkName,
        expire_date: expireTimestamp,
        member_limit: 1,
        creates_join_request: false
      })
    });

    const data = await res.json();
    if (data.ok && data.result?.invite_link) {
      return { inviteLink: data.result.invite_link, isFallback: false };
    }
  } catch (err) {
    console.warn('[InviteManager] Fallback invite link used:', err);
  }

  return { inviteLink: 'https://t.me/+jMKV8QQI2VhiZTVh', isFallback: true };
}
