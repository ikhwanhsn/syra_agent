/**
 * Meteora Referral Staking helpers.
 * Routes human LPs to Syra's referral code so wallet-linking can attribute fees.
 * See: https://www.meteora.ag/referral
 *
 * Env: METEORA_REFERRAL_CODE (default VUDCXUSRXA)
 */
export const DEFAULT_METEORA_REFERRAL_CODE = "VUDCXUSRXA";
export const METEORA_REFERRAL_BASE_URL = "https://www.meteora.ag/ref";

/**
 * @returns {string}
 */
export function getMeteoraReferralCode() {
  const raw = (process.env.METEORA_REFERRAL_CODE || DEFAULT_METEORA_REFERRAL_CODE).trim();
  return raw || DEFAULT_METEORA_REFERRAL_CODE;
}

/**
 * Canonical referral landing URL (wallet-link flow on Meteora).
 * @param {string} [code]
 * @returns {string}
 */
export function meteoraReferralUrl(code = getMeteoraReferralCode()) {
  const c = String(code || DEFAULT_METEORA_REFERRAL_CODE).trim() || DEFAULT_METEORA_REFERRAL_CODE;
  return `${METEORA_REFERRAL_BASE_URL}/${encodeURIComponent(c)}`;
}

/**
 * Append ?ref=CODE (or &ref=CODE) to any Meteora URL without duplicating the param.
 * Best-effort attribution on /dlmm/* pages; the referral landing URL is the reliable path.
 * @param {string} url
 * @param {string} [code]
 * @returns {string}
 */
export function withMeteoraRef(url, code = getMeteoraReferralCode()) {
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
