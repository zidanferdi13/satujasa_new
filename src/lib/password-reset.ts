import { createHash, randomBytes } from "crypto";

/** Reset links expire after this long. */
export const RESET_TOKEN_TTL_MINUTES = 60;

/**
 * One email per address per window. Protects the email provider's daily quota
 * (Resend free tier: 100/day) from being drained by repeated requests.
 */
export const RESET_THROTTLE_SECONDS = 60;

export function resetThrottleCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - RESET_THROTTLE_SECONDS * 1000);
}

/** 256 bits of entropy, URL-safe so it survives being pasted into an email. */
export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only the hash is stored, so a database leak cannot be replayed as a working link. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resetTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

export function isResetTokenUsable(
  token: { expiresAt: Date; usedAt: Date | null },
  now: Date = new Date()
): boolean {
  return token.usedAt === null && token.expiresAt.getTime() > now.getTime();
}

/** Builds the link a user clicks. Requires NEXT_PUBLIC_APP_URL (falls back to localhost for dev). */
export function buildResetUrl(token: string, appUrl = process.env.NEXT_PUBLIC_APP_URL): string {
  const base = (appUrl ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}
