/**
 * Sentinel / Valeo (x402sentinel) — outbound fetch audit & budgets.
 * Default: off. Set SENTINEL_ENABLED=true or VALEO_SENTINEL_ENABLED=1 to wrap fetch again.
 */
export function isSentinelEnabled() {
  const raw = String(
    process.env.SENTINEL_ENABLED ?? process.env.VALEO_SENTINEL_ENABLED ?? ""
  )
    .trim()
    .toLowerCase();
  return raw === "true" || raw === "1";
}
