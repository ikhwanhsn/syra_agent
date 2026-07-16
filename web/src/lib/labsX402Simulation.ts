import type { LabX402Endpoint } from "@/lib/labsX402Api";

const MINUTES_PER_DAY = 24 * 60;
const MAX_ENDPOINT_PRICE_USD = 0.1;
const EST_SOL_PER_CALL = 0.00002;
const SOL_RENT_BUFFER = 0.01;
const BALANCE_SAFETY_MARGIN = 1.25;

/** Matches api/libs/labs/labX402Refund.js low-balance top-up target. */
export function computePayerRefundTarget(maxPriceUsd: number, avgPriceUsd: number): number {
  return Math.max(maxPriceUsd * 2, avgPriceUsd * 3);
}

/** Approximate paid calls between low-balance USDC top-ups. */
export function estimateCallsBetweenRefunds(maxPriceUsd: number, avgPriceUsd: number): number {
  const target = computePayerRefundTarget(maxPriceUsd, avgPriceUsd);
  const drainable = Math.max(0, target - maxPriceUsd);
  if (drainable <= 0 || avgPriceUsd <= 0) return 1;
  return Math.max(1, Math.floor(drainable / avgPriceUsd));
}

export interface WalletBalanceSuggestion {
  role: "payer" | "payto";
  suggestedUsdc: number;
  suggestedSol: number;
  usdcNote: string;
  solNote: string;
}

export interface PerWalletBalanceRow {
  id: string;
  label: string;
  role: "payer" | "payto";
  address: string;
  /** null when the on-chain balance is currently unavailable (RPC read failed). */
  currentUsdc: number | null;
  currentSol: number | null;
  suggestedUsdc: number;
  suggestedSol: number;
  usdcShortfall: number;
  solShortfall: number;
}

export interface LabsX402SimulationInput {
  payerCount: number;
  intervalMin: number;
  jitterPct: number;
  refundEnabled: boolean;
  autoCallEnabled: boolean;
  endpoints: LabX402Endpoint[];
  /** Preferred: target gross volume in USD per day. */
  targetVolumeUsd?: number;
  /** Legacy: derived from targetVolumeUsd when omitted. */
  targetCallsPerDay?: number;
}

export interface LabsX402SimulationResult {
  payerCount: number;
  intervalMin: number;
  jitterPct: number;
  refundEnabled: boolean;
  autoCallEnabled: boolean;
  avgPriceUsd: number;
  minPriceUsd: number;
  maxPriceUsd: number;
  callsPerDay: number;
  callsPerWalletPerDay: number;
  ticksPerDay: number;
  grossUsdcPerDay: number;
  netUsdcPerDay: number;
  grossUsdcPerWalletPerDay: number;
  intervalRangeMin: number;
  intervalRangeMax: number;
  suggestedIntervalMin: number | null;
  targetCallsPerDay: number;
  targetVolumeUsd: number;
  projectedTargetGrossUsd: number;
  volumeGapUsd: number;
  achievementHints: string[];
  estSolPerDay: number;
  estSolPerWalletPerDay: number;
  payerUsdcBuffer: number;
  paytoUsdcBuffer: number;
  walletBalances: WalletBalanceSuggestion[];
}

export function formatSimulationSol(n: number): string {
  if (n < 0.0001 && n > 0) return "<0.0001 SOL";
  return `~${n.toFixed(4)} SOL`;
}

/**
 * Suggested funding per wallet role for target daily volume (or current projected volume).
 */
export function computeWalletBalanceSuggestions(
  input: LabsX402SimulationInput & {
    maxPriceUsd: number;
    avgPriceUsd: number;
    callsPerWalletPerDay: number;
    estSolPerWalletPerDay: number;
    estSolPerDay: number;
  },
): WalletBalanceSuggestion[] {
  const payerCount = Math.max(0, input.payerCount);
  const avgPrice = input.avgPriceUsd > 0 ? input.avgPriceUsd : 0.029;
  const targetCalls =
    input.targetCallsPerDay != null && input.targetCallsPerDay > 0
      ? Math.max(1, input.targetCallsPerDay)
      : Math.max(
          1,
          Math.ceil(Math.max(1, input.targetVolumeUsd ?? 50) / avgPrice),
        );
  const callsPerPayerTarget = payerCount > 0 ? targetCalls / payerCount : targetCalls;

  const payerRefundTarget = computePayerRefundTarget(input.maxPriceUsd, input.avgPriceUsd);
  const callsBetweenRefunds = input.refundEnabled
    ? estimateCallsBetweenRefunds(input.maxPriceUsd, input.avgPriceUsd)
    : 1;
  const refundSolFactor = input.refundEnabled ? 1 + 1 / callsBetweenRefunds : 1;

  const payerUsdc = input.refundEnabled
    ? payerRefundTarget
    : callsPerPayerTarget * input.avgPriceUsd * BALANCE_SAFETY_MARGIN;

  const payerSol =
    callsPerPayerTarget * EST_SOL_PER_CALL * refundSolFactor * BALANCE_SAFETY_MARGIN +
    SOL_RENT_BUFFER;

  const paytoUsdc = input.refundEnabled
    ? Math.max(payerCount * payerRefundTarget, targetCalls * input.avgPriceUsd * 0.05)
    : 0;

  const paytoSol = input.refundEnabled
    ? (input.estSolPerDay * (1 / callsBetweenRefunds)) * BALANCE_SAFETY_MARGIN + SOL_RENT_BUFFER
    : SOL_RENT_BUFFER;

  return [
    {
      role: "payer",
      suggestedUsdc: Math.ceil(payerUsdc * 100) / 100,
      suggestedSol: Math.ceil(payerSol * 10000) / 10000,
      usdcNote: input.refundEnabled
        ? `Low-balance working capital (~${callsBetweenRefunds} calls before top-up)`
        : `~${Math.ceil(callsPerPayerTarget)} calls/day at avg price`,
      solNote: input.refundEnabled
        ? `Payment fees + ~1 refund tx per ${callsBetweenRefunds} calls`
        : "Payment tx fees + rent buffer",
    },
    {
      role: "payto",
      suggestedUsdc: Math.ceil(paytoUsdc * 100) / 100,
      suggestedSol: Math.ceil(paytoSol * 10000) / 10000,
      usdcNote: input.refundEnabled
        ? "Top-up float when payer USDC drops below max endpoint price"
        : "Not required without refund loop",
      solNote: input.refundEnabled
        ? `Refund transfer fees (~1 per ${callsBetweenRefunds} calls) + rent buffer`
        : "Rent buffer only",
    },
  ];
}

export function buildPerWalletBalanceRows(
  wallets: Array<{
    id: string;
    label: string;
    role: "payer" | "payto";
    address: string;
    usdcBalance: number | null;
    solBalance?: number | null;
    nativeBalance?: number | null;
  }>,
  suggestions: WalletBalanceSuggestion[],
): PerWalletBalanceRow[] {
  const byRole = Object.fromEntries(suggestions.map((s) => [s.role, s])) as Record<
    "payer" | "payto",
    WalletBalanceSuggestion
  >;

  return wallets.map((w) => {
    const sug = byRole[w.role];
    const suggestedUsdc = sug?.suggestedUsdc ?? 0;
    const suggestedSol = sug?.suggestedSol ?? SOL_RENT_BUFFER;
    const usdcKnown = typeof w.usdcBalance === "number" && Number.isFinite(w.usdcBalance);
    const native = w.nativeBalance ?? w.solBalance ?? null;
    const solKnown = typeof native === "number" && Number.isFinite(native);
    return {
      id: w.id,
      label: w.label,
      role: w.role,
      address: w.address,
      currentUsdc: usdcKnown ? (w.usdcBalance as number) : null,
      currentSol: solKnown ? (native as number) : null,
      suggestedUsdc,
      suggestedSol,
      // Shortfall only meaningful when the balance is known; unknown -> 0 (no false "deposit needed").
      usdcShortfall: usdcKnown ? Math.max(0, suggestedUsdc - (w.usdcBalance as number)) : 0,
      solShortfall: solKnown ? Math.max(0, suggestedSol - (native as number)) : 0,
    };
  });
}

export function weightedAvgEndpointPrice(endpoints: LabX402Endpoint[]): number {
  if (endpoints.length === 0) return 0.029;
  const totalWeight = endpoints.reduce((s, e) => s + e.weight, 0);
  if (totalWeight <= 0) return 0;
  const sum = endpoints.reduce((s, e) => s + e.priceUsd * e.weight, 0);
  return sum / totalWeight;
}

export function estimateCallsPerDay(payerCount: number, intervalMin: number): number {
  if (payerCount <= 0 || intervalMin <= 0) return 0;
  const ticksPerDay = MINUTES_PER_DAY / intervalMin;
  return Math.round(payerCount * ticksPerDay);
}

export function suggestIntervalMinutes(payerCount: number, targetCallsPerDay: number): number | null {
  if (payerCount <= 0 || targetCallsPerDay <= 0) return null;
  const raw = (payerCount * MINUTES_PER_DAY) / targetCallsPerDay;
  return Math.max(1, Math.min(60, Math.round(raw * 10) / 10));
}

export function jitterIntervalRange(
  intervalMin: number,
  jitterPct: number,
): { min: number; max: number } {
  const jitter = (jitterPct / 100) * intervalMin;
  return {
    min: Math.max(1, Math.round((intervalMin - jitter) * 10) / 10),
    max: Math.min(60, Math.round((intervalMin + jitter) * 10) / 10),
  };
}

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function formatSimulationUsd(n: number): string {
  if (n < 0.01 && n > 0) return "<$0.01";
  return formatUsd(n);
}

export function runLabsX402Simulation(input: LabsX402SimulationInput): LabsX402SimulationResult {
  const payerCount = Math.max(0, input.payerCount);
  const intervalMin = Math.max(1, Math.min(60, input.intervalMin));
  const jitterPct = Math.max(0, Math.min(50, input.jitterPct));

  const avgPriceUsd = weightedAvgEndpointPrice(input.endpoints);
  const safeAvgPrice = avgPriceUsd > 0 ? avgPriceUsd : 0.029;
  const targetVolumeUsd =
    typeof input.targetVolumeUsd === "number" && Number.isFinite(input.targetVolumeUsd)
      ? Math.max(1, input.targetVolumeUsd)
      : Math.max(1, (input.targetCallsPerDay ?? 1000) * safeAvgPrice);
  const targetCallsPerDay =
    typeof input.targetCallsPerDay === "number" && input.targetCallsPerDay > 0
      ? Math.max(1, Math.round(input.targetCallsPerDay))
      : Math.max(1, Math.ceil(targetVolumeUsd / safeAvgPrice));

  const minPriceUsd =
    input.endpoints.length > 0
      ? Math.min(...input.endpoints.map((e) => e.priceUsd))
      : 0.01;
  const maxPriceUsd =
    input.endpoints.length > 0
      ? Math.max(...input.endpoints.map((e) => e.priceUsd))
      : MAX_ENDPOINT_PRICE_USD;

  const callsPerDay = input.autoCallEnabled
    ? estimateCallsPerDay(payerCount, intervalMin)
    : 0;
  const ticksPerDay = intervalMin > 0 ? MINUTES_PER_DAY / intervalMin : 0;
  const callsPerWalletPerDay = payerCount > 0 ? callsPerDay / payerCount : 0;

  const grossUsdcPerDay = callsPerDay * avgPriceUsd;
  const netUsdcPerDay = input.refundEnabled ? 0 : grossUsdcPerDay;
  const grossUsdcPerWalletPerDay = payerCount > 0 ? grossUsdcPerDay / payerCount : 0;

  const range = jitterIntervalRange(intervalMin, jitterPct);

  const suggestedIntervalMin = suggestIntervalMinutes(payerCount, targetCallsPerDay);
  const projectedTargetGrossUsd = Math.round(targetCallsPerDay * safeAvgPrice * 100) / 100;
  const volumeGapUsd = Math.max(0, Math.round((targetVolumeUsd - grossUsdcPerDay) * 100) / 100);

  const achievementHints: string[] = [];
  if (!input.autoCallEnabled) {
    achievementHints.push("Enable auto-call and save settings — projected volume is 0 while it is off.");
  }
  if (payerCount <= 0) {
    achievementHints.push("Add at least one payer wallet so the scheduler can generate volume.");
  } else if (suggestedIntervalMin != null && input.autoCallEnabled) {
    if (grossUsdcPerDay + 0.005 < targetVolumeUsd) {
      if (suggestedIntervalMin < intervalMin) {
        achievementHints.push(
          `Lower interval to ~${suggestedIntervalMin} min (with ${payerCount} payer${payerCount === 1 ? "" : "s"}) to hit ~${formatUsd(targetVolumeUsd)}/day.`,
        );
      } else if (suggestedIntervalMin >= intervalMin) {
        const neededPayers = Math.max(
          1,
          Math.ceil((targetCallsPerDay * intervalMin) / MINUTES_PER_DAY),
        );
        if (neededPayers > payerCount) {
          achievementHints.push(
            `Add ~${neededPayers - payerCount} more payer wallet${neededPayers - payerCount === 1 ? "" : "s"} (≈${neededPayers} total) at ${intervalMin} min interval, or lower the interval.`,
          );
        } else {
          achievementHints.push(
            `Aim for ~${targetCallsPerDay.toLocaleString()} calls/day (~${formatUsd(projectedTargetGrossUsd)} at avg price).`,
          );
        }
      }
    } else {
      achievementHints.push(
        `Current config projects ~${formatUsd(grossUsdcPerDay)}/day — on track for the ${formatUsd(targetVolumeUsd)} target.`,
      );
    }
  }
  if (input.autoCallEnabled && payerCount > 0) {
    achievementHints.push(
      `Fund each payer with working USDC and gas; PayTo needs refund float if refund is on.`,
    );
  }

  const callsBetweenRefunds = input.refundEnabled
    ? estimateCallsBetweenRefunds(maxPriceUsd, avgPriceUsd)
    : 1;
  const refundSolFactor = input.refundEnabled ? 1 + 1 / callsBetweenRefunds : 1;
  const estSolPerDay = callsPerDay * EST_SOL_PER_CALL * refundSolFactor;
  const estSolPerWalletPerDay = payerCount > 0 ? estSolPerDay / payerCount : 0;

  const walletBalances = computeWalletBalanceSuggestions({
    ...input,
    targetCallsPerDay,
    targetVolumeUsd,
    maxPriceUsd,
    avgPriceUsd,
    callsPerWalletPerDay,
    estSolPerWalletPerDay,
    estSolPerDay,
  });

  return {
    payerCount,
    intervalMin,
    jitterPct,
    refundEnabled: input.refundEnabled,
    autoCallEnabled: input.autoCallEnabled,
    avgPriceUsd,
    minPriceUsd,
    maxPriceUsd,
    callsPerDay,
    callsPerWalletPerDay,
    ticksPerDay: Math.round(ticksPerDay),
    grossUsdcPerDay,
    netUsdcPerDay,
    grossUsdcPerWalletPerDay,
    intervalRangeMin: range.min,
    intervalRangeMax: range.max,
    suggestedIntervalMin,
    targetCallsPerDay,
    targetVolumeUsd,
    projectedTargetGrossUsd,
    volumeGapUsd,
    achievementHints,
    estSolPerDay,
    estSolPerWalletPerDay,
    payerUsdcBuffer: input.refundEnabled ? computePayerRefundTarget(maxPriceUsd, avgPriceUsd) : maxPriceUsd,
    paytoUsdcBuffer: input.refundEnabled
      ? computePayerRefundTarget(maxPriceUsd, avgPriceUsd)
      : Math.max(maxPriceUsd, grossUsdcPerWalletPerDay * 2),
    walletBalances,
  };
}

export function getCallsRange(
  payerCount: number,
  intervalMin: number,
  jitterPct: number,
): { min: number; max: number } {
  const range = jitterIntervalRange(intervalMin, jitterPct);
  return {
    min: estimateCallsPerDay(payerCount, range.max),
    max: estimateCallsPerDay(payerCount, range.min),
  };
}
