import { getApiBaseUrl } from "@/lib/chatApi";

export type HolderBenefitsBucket = {
  limit: number;
  used: number;
  remaining: number;
  eligible: boolean;
  tools: string[];
  label: string;
  minStake?: number;
};

export type HolderBenefitsData = {
  wallet: string | null;
  balance: number;
  staked: number;
  syraAmount: number;
  tier: string | null;
  discount: number;
  discountPct: number;
  holderEligible: boolean;
  holderThreshold: number;
  rewardMultiplier: number;
  stakeT2Eligible: boolean;
  stakeT3Eligible: boolean;
  dayUtc: string;
  resetAt: string;
  holder_quota_remaining: number;
  buckets: {
    starter: HolderBenefitsBucket;
    stakeT2: HolderBenefitsBucket;
    stakeT3: HolderBenefitsBucket;
    stakeBrain: HolderBenefitsBucket;
  };
  estimatedSavingsUsd: number;
  savingsNote: string;
  solanaOnlyDiscount: boolean;
  tiers: Array<{ id: string; min: number; discount: number; label: string }>;
};

export async function fetchHolderBenefits(
  wallet: string,
  signal?: AbortSignal,
): Promise<HolderBenefitsData> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/rewards/holder-benefits?wallet=${encodeURIComponent(wallet)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Holder benefits API ${res.status}`);
  const json = (await res.json()) as { success: boolean; data?: HolderBenefitsData; error?: string };
  if (!json.success || !json.data) throw new Error(json.error || "holder_benefits_failed");
  return json.data;
}
