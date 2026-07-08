import type { LabX402Endpoint } from "@/lib/labsX402Api";

const MINUTES_PER_DAY = 24 * 60;
const MAX_ENDPOINT_PRICE_USD = 0.1;
const EST_SOL_PER_CALL = 0.00002;
const SOL_RENT_BUFFER = 0.01;
const BALANCE_SAFETY_MARGIN = 1.25;

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
  currentUsdc: number;
  currentSol: number;
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
  const targetCalls = Math.max(1, input.targetCallsPerDay ?? 1000);
  const callsPerPayerTarget = payerCount > 0 ? targetCalls / payerCount : targetCalls;

  const payerUsdc = input.refundEnabled
    ? Math.max(input.maxPriceUsd * 2, input.avgPriceUsd * 3)
    : callsPerPayerTarget * input.avgPriceUsd * BALANCE_SAFETY_MARGIN;

  const payerSol =
    callsPerPayerTarget * EST_SOL_PER_CALL * (input.refundEnabled ? 2 : 1) * BALANCE_SAFETY_MARGIN +
    SOL_RENT_BUFFER;

  const paytoUsdc = input.refundEnabled
    ? Math.max(payerCount * input.maxPriceUsd * 2, targetCalls * input.avgPriceUsd * 0.05)
    : 0;

  const paytoSol = input.refundEnabled
    ? input.estSolPerDay * 0.5 * BALANCE_SAFETY_MARGIN + SOL_RENT_BUFFER
    : SOL_RENT_BUFFER;

  return [
    {
      role: "payer",
      suggestedUsdc: Math.ceil(payerUsdc * 100) / 100,
      suggestedSol: Math.ceil(payerSol * 10000) / 10000,
      usdcNote: input.refundEnabled
        ? "Working capital for in-flight x402 payments (refund returns USDC)"
        : `~${Math.ceil(callsPerPayerTarget)} calls/day at avg price`,
      solNote: input.refundEnabled ? "Payment + refund tx fees + rent buffer" : "Payment tx fees + rent buffer",
    },
    {
      role: "payto",
      suggestedUsdc: Math.ceil(paytoUsdc * 100) / 100,
      suggestedSol: Math.ceil(paytoSol * 10000) / 10000,
      usdcNote: input.refundEnabled
        ? "Refund float when multiple payers settle in one tick"
        : "Not required without refund loop",
      solNote: input.refundEnabled ? "Refund transfer fees + rent buffer" : "Rent buffer only",
    },
  ];
}

export function buildPerWalletBalanceRows(
  wallets: Array<{
    id: string;
    label: string;
    role: "payer" | "payto";
    address: string;
    usdcBalance: number;
    solBalance: number;
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
    return {
      id: w.id,
      label: w.label,
      role: w.role,
      address: w.address,
      currentUsdc: w.usdcBalance,
      currentSol: w.solBalance,
      suggestedUsdc,
      suggestedSol,
      usdcShortfall: Math.max(0, suggestedUsdc - w.usdcBalance),
      solShortfall: Math.max(0, suggestedSol - w.solBalance),
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
  const targetCallsPerDay = Math.max(1, input.targetCallsPerDay ?? 1000);

  const avgPriceUsd = weightedAvgEndpointPrice(input.endpoints);
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
  const estSolPerDay = callsPerDay * EST_SOL_PER_CALL * (input.refundEnabled ? 2 : 1);
  const estSolPerWalletPerDay = payerCount > 0 ? estSolPerDay / payerCount : 0;

  const walletBalances = computeWalletBalanceSuggestions({
    ...input,
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
    estSolPerDay,
    estSolPerWalletPerDay,
    payerUsdcBuffer: maxPriceUsd,
    paytoUsdcBuffer: Math.max(maxPriceUsd, grossUsdcPerWalletPerDay * 2),
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
