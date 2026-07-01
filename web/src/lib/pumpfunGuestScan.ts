import type { MemecoinAnalysisQuota } from "@/lib/pumpfunAnalysisApi";
import { isPumpfunScanUnlimitedTier } from "@/lib/pumpfunScanQuota";

export const PUMPFUN_DEVICE_ID_KEY = "syra.pumpfun.deviceId";
export const SYRA_DEVICE_ID_HEADER = "x-syra-device-id";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Stable per-browser id — ties guest quota to localStorage instead of IP alone. */
export function getOrCreatePumpfunDeviceId(): string {
  if (typeof localStorage === "undefined") {
    return `ephemeral-${crypto.randomUUID()}`;
  }
  try {
    const existing = localStorage.getItem(PUMPFUN_DEVICE_ID_KEY)?.trim();
    if (existing && existing.length >= 8) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(PUMPFUN_DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `ephemeral-${crypto.randomUUID()}`;
  }
}

export function pumpfunDeviceHeaders(): HeadersInit {
  return { [SYRA_DEVICE_ID_HEADER]: getOrCreatePumpfunDeviceId() };
}

/** First daily scan without a connected wallet. */
export function isGuestScanEligible(
  connected: boolean,
  quota: MemecoinAnalysisQuota | undefined,
  opts?: { quotaLoading?: boolean },
): boolean {
  if (connected) return false;
  if (!quota) return opts?.quotaLoading === true;
  if (quota.tier === "locked") return false;
  if (isPumpfunScanUnlimitedTier(quota.tier)) return false;
  return quota.used === 0 && quota.remaining > 0;
}

export function requiresWalletForScan(
  connected: boolean,
  quota: MemecoinAnalysisQuota | undefined,
): boolean {
  if (connected) return false;
  return !isGuestScanEligible(connected, quota);
}

/** Mark wallet-free scan used today (UX hint before quota refetch). */
export function markGuestScanUsedToday(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem("syra.pumpfun.guestScanDay", todayUtc());
  } catch {
    /* quota / private mode */
  }
}

export function hasGuestScanToday(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem("syra.pumpfun.guestScanDay") === todayUtc();
  } catch {
    return false;
  }
}
