import type { LpRealPosition, LpRealPositionStatus } from "@/lib/lpAgentRealApi";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { formatLpUsd } from "@/lib/lpAgentExperimentApi";

/** Convert SOL to USD using reference price; null when price unknown. */
export function solToUsd(sol: number, solUsd?: number): number | null {
  const s = Number(sol);
  const px = Number(solUsd);
  if (!Number.isFinite(s) || !Number.isFinite(px) || px <= 0) return null;
  return s * px;
}

/** Inline copy: `1.23 SOL · $184.50` */
export function formatSolWithUsd(sol: number, solUsd?: number): string {
  const base = `${formatSol(sol)} SOL`;
  const usd = solToUsd(sol, solUsd);
  return usd != null ? `${base} · ${formatLpUsd(usd)}` : base;
}

/** Sub-label for stat tiles (USD under SOL). */
export function formatSolUsdSub(sol: number, solUsd?: number): string | undefined {
  const usd = solToUsd(sol, solUsd);
  return usd != null ? formatLpUsd(usd) : undefined;
}

/** Primary + sub for LpStatTile from a SOL amount. */
export function lpStatFromSol(
  sol: number,
  solUsd?: number,
  subOverride?: string,
): { value: string; subValue?: string } {
  return {
    value: `${formatSol(sol)} SOL`,
    subValue: subOverride ?? formatSolUsdSub(sol, solUsd),
  };
}

/** Positions with liquidity on Meteora (or in flight). */
export const LP_REAL_ACTIVE_STATUSES: ReadonlySet<LpRealPositionStatus> = new Set([
  "open",
  "opening",
  "closing",
]);

export function isActiveLpRealPosition(status: LpRealPositionStatus): boolean {
  return LP_REAL_ACTIVE_STATUSES.has(status);
}

/** Open succeeded on-chain but DB status is error (e.g. close tx bug) — resolve will retry. */
export function isOrphanedLiveLpRealPosition(row: LpRealPosition): boolean {
  return row.status === "error" && Boolean(row.openTxSig) && !row.closeTxSig;
}

export function splitLpRealPositions(positions: LpRealPosition[]) {
  const active: LpRealPosition[] = [];
  const failed: LpRealPosition[] = [];
  const other: LpRealPosition[] = [];
  for (const row of positions) {
    if (isActiveLpRealPosition(row.status) || isOrphanedLiveLpRealPosition(row)) {
      active.push(row);
    } else if (row.status === "error") {
      failed.push(row);
    } else {
      other.push(row);
    }
  }
  return { active, failed, other };
}

export function formatLpLastError(
  code: string | null | undefined,
  ctx?: { totalCapitalSol?: number; minBankSol?: number; availableSol?: number },
): string {
  if (!code) return "";
  const total = ctx?.totalCapitalSol;
  const minBank = ctx?.minBankSol ?? 10;
  const available = ctx?.availableSol;

  switch (code) {
    case "insufficient_total_capital":
      return `Wallet needs more liquid SOL for the next ${formatSol(1)} slot (reserve kept for fees)`;
    case "insufficient_available_sol":
      return available != null
        ? `Only ${formatSol(available)} liquid for the next 1 SOL slot`
        : "Not enough liquid SOL in wallet for a new position";
    case "low_wallet_fee_reserve":
      return "Wallet SOL low — add ~0.2 SOL for close/claim fees";
    case "no_best_strategy":
      return "No sim strategy ready yet — waiting for cohort data";
    default:
      break;
  }

  if (code.includes("Account 'position' not provided") || code.includes("position account")) {
    return "Close tx misconfigured — will retry on next resolve tick";
  }
  if (code.includes("position_width_exceeds") || code.includes("dlmm_error:6040")) {
    return "Meteora rejected position width (bin range too wide)";
  }
  if (
    code.includes("spl_insufficient_funds") ||
    code.includes("spl_token_error") ||
    code.includes("sidecar_swap")
  ) {
    return "Wallet missing pool token — sidecar swap may retry on next tick";
  }
  if (code.includes("simulation_failed") || code.includes("sim_returned_err")) {
    if (code.includes("dlmm_error:")) return code;
    if (code.includes("missing co-signatures")) return code;
    return "Transaction simulation failed before sign (wallet broker)";
  }
  if (code.startsWith("dlmm_error:") || code.includes("(dlmm_error:")) {
    return code.replace(/^dlmm_error:/, "Meteora: ").replace(/_/g, " ");
  }
  if (code.includes("broker_pending_or_failed") || code.includes("require_confirm")) {
    return "Broker held transaction for confirmation — LP cron cannot auto-confirm";
  }
  if (code.includes("unknown signer")) {
    return "Close tx signer mismatch — retrying on next resolve tick";
  }
  return code.replace(/_/g, " ");
}

export function formatLpPositionError(
  message: string | null | undefined,
  row?: Pick<LpRealPosition, "status" | "openTxSig" | "closeTxSig">,
): string {
  if (row && isOrphanedLiveLpRealPosition(row as LpRealPosition)) {
    return formatLpLastError(message) || "Close pending — position is live on Meteora";
  }
  if (!message) return "Open failed";
  if (message.includes("spl_insufficient_funds") || message.includes("spl_token_error")) {
    return "Wallet missing pool token for this pool";
  }
  if (message.includes("simulation_failed") || message.includes("sim_returned_err")) {
    return "Simulation failed (tx not signed)";
  }
  if (message.includes("broker_pending_or_failed")) {
    return "Broker pending or blocked (policy / confirmation)";
  }
  return formatLpLastError(message) || message;
}
