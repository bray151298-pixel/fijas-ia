// In-memory recovery verification codes store
const recoveryOtpStore: Map<string, { code: string; expiresAt: number }> = new Map();
