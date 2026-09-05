import crypto from 'crypto';

// Hash a bearer token for storage — never store dashboard tokens in plaintext.
// Matches the sha256(token) used in db/migrations/0001_claim_token_hardening.sql's
// backfill, so already-issued tokens keep validating after this ships.
export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export const TOKEN_TTL_MS = 180 * 24 * 3600 * 1000; // 180 days — the dashboard bearer token
export const CONFIRM_TTL_MS = 48 * 3600 * 1000; // 48 hours — the email-confirmation link
