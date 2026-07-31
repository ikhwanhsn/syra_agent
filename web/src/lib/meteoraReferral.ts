/**
 * Meteora Referral Staking helpers (web).
 * Routes human LPs to Syra's referral code for wallet-link attribution.
 * See: https://www.meteora.ag/referral
 */

export const DEFAULT_METEORA_REFERRAL_CODE = "VUDCXUSRXA";
export const METEORA_REFERRAL_BASE_URL = "https://www.meteora.ag/ref";

export function getMeteoraReferralCode(): string {
  const raw = String(import.meta.env.VITE_METEORA_REFERRAL_CODE ?? DEFAULT_METEORA_REFERRAL_CODE).trim();
  return raw || DEFAULT_METEORA_REFERRAL_CODE;
}

/** Canonical referral landing URL (wallet-link flow on Meteora). */
export function meteoraReferralUrl(code: string = getMeteoraReferralCode()): string {
  const c = String(code || DEFAULT_METEORA_REFERRAL_CODE).trim() || DEFAULT_METEORA_REFERRAL_CODE;
  return `${METEORA_REFERRAL_BASE_URL}/${encodeURIComponent(c)}`;
}

/**
 * Append ?ref=CODE (or &ref=CODE) without duplicating the param.
 * Best-effort on /dlmm/* pages; prefer meteoraReferralUrl() for reliable attribution.
 */
export function withMeteoraRef(url: string, code: string = getMeteoraReferralCode()): string {
  const base = String(url || "").trim();
  if (!base) return meteoraReferralUrl(code);
  const c = String(code || DEFAULT_METEORA_REFERRAL_CODE).trim() || DEFAULT_METEORA_REFERRAL_CODE;
  try {
    const u = new URL(base);
    if (!u.searchParams.get("ref")) {
      u.searchParams.set("ref", c);
    }
    return u.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    if (/[?&]ref=/i.test(base)) return base;
    return `${base}${sep}ref=${encodeURIComponent(c)}`;
  }
}
