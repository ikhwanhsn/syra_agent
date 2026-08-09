import type { LabChain, LabTreasuryStatus } from "@/lib/labsX402Api";

export type TreasuryBannerTone = "healthy" | "recoverable" | "underfunded";

export interface TreasuryBannerView {
  tone: TreasuryBannerTone;
  title: string;
  body: string;
  showUsdcTopUp: boolean;
  showNativeTopUp: boolean;
  needUsdc: number;
  needNative: number;
}

function nativeLabel(chain: LabChain): string {
  if (chain === "algorand") return "ALGO";
  if (chain === "base") return "ETH";
  if (chain === "xlayer") return "OKB";
  return "SOL";
}

/**
 * Pure view-model for Labs treasury health banner.
 * Separates paused-but-fundable from true underfunded so operators do not see ~$0.00 USDC.
 */
export function getTreasuryBannerView(
  treasury: Pick<
    LabTreasuryStatus,
    | "canFundAny"
    | "paused"
    | "reason"
    | "recommendedTopUpUsdc"
    | "recommendedTopUpNative"
    | "recommendedTopUpAlgo"
    | "topUp"
    | "fundableCalls"
  > & {
    autoCallEnabled?: boolean;
  },
  chain: LabChain,
): TreasuryBannerView {
  const native = nativeLabel(chain);
  const needUsdc = Number(treasury.recommendedTopUpUsdc || treasury.topUp?.usdcUsd || 0);
  const needNative = Number(
    treasury.recommendedTopUpNative ||
      treasury.recommendedTopUpAlgo ||
      treasury.topUp?.native ||
      0,
  );
  const reason = String(treasury.reason || "payto_underfunded");

  const autoCallEnabled = treasury.autoCallEnabled !== false;

  if (treasury.canFundAny && !treasury.paused && autoCallEnabled) {
    return {
      tone: "healthy",
      title: "Treasury healthy",
      body: `About ${treasury.fundableCalls} call${treasury.fundableCalls === 1 ? "" : "s"} fundable.`,
      showUsdcTopUp: false,
      showNativeTopUp: false,
      needUsdc: 0,
      needNative: 0,
    };
  }

  // Fundable but paused, or fundable but auto-call was chronically disabled.
  if (treasury.canFundAny && (treasury.paused || !autoCallEnabled)) {
    return {
      tone: "recoverable",
      title: !autoCallEnabled
        ? "Auto-call off; treasury looks fundable"
        : "Auto-call paused; treasury looks fundable",
      body: !autoCallEnabled
        ? "Balances can fund at least one call. Resume auto-call to re-enable the scheduler (no USDC top-up required)."
        : "Balances can fund at least one call. Resume auto-call to clear the pause (no USDC top-up required).",
      showUsdcTopUp: false,
      showNativeTopUp: false,
      needUsdc: 0,
      needNative: 0,
    };
  }

  const fromApi = String(treasury.topUp?.instructions || "").trim();
  if (fromApi) {
    return {
      tone: "underfunded",
      title: treasury.paused ? "Auto-call paused: treasury underfunded" : "Treasury underfunded",
      body: fromApi,
      showUsdcTopUp: needUsdc > 0,
      showNativeTopUp: needNative > 0,
      needUsdc,
      needNative,
    };
  }

  const isNative = reason === "payto_native_underfunded";
  let body: string;
  if (isNative && needNative > 0) {
    body =
      `No lab wallet can cover fee ${native} (${reason}). Fund PayTo, any lab wallet, or the deposit hub with ~${needNative.toFixed(4)} spendable ${native}` +
      (needUsdc > 0 ? ` and ~$${needUsdc.toFixed(2)} USDC` : "") +
      ".";
  } else {
    body =
      `No lab wallet can fund payers (${reason}). Fund any wallet or the deposit hub with ~$${needUsdc.toFixed(2)} USDC` +
      (needNative > 0 ? ` and ~${needNative.toFixed(4)} ${native}` : "") +
      ".";
  }

  return {
    tone: "underfunded",
    title: treasury.paused ? "Auto-call paused: treasury underfunded" : "Treasury underfunded",
    body,
    showUsdcTopUp: needUsdc > 0,
    showNativeTopUp: needNative > 0,
    needUsdc,
    needNative,
  };
}
