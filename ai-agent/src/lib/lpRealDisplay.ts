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
    case "no_profitable_strategy":
      return "No sim strategy with positive net PnL yet — waiting for a profitable leader";
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
  if (code.includes("open_tx_not_on_chain") || code.includes("position_not_on_chain")) {
    return "Open transaction is not on Solana — position was not opened";
  }
  if (code.includes("tx_confirm_timeout") || code.includes("tx_blockhash_expired")) {
    return "Transaction was not confirmed on-chain in time";
  }
  if (code.includes("tx_failed_onchain")) {
    return "Transaction failed on-chain";
  }
  if (code.includes("strategy_too_wide")) {
    return "Strategy bin range too wide for a single Meteora position (max 70 bins)";
  }
  if (code.includes("jupiter_quote_zero")) {
    return "Jupiter could not quote a sidecar swap for this pool — skipped open";
  }
  if (code.includes("Wallet hourly spend cap")) {
    return code;
  }
  if (code.includes("Wallet daily spend cap")) {
    return code;
  }
  if (code.includes("Policy held transaction") || code.includes("Policy requires confirmation")) {
    return code;
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
  if (row?.status === "opening" && row.openTxSig) {
    return "Open transaction confirmed — waiting for Meteora position index";
  }
  if (message.includes("open_tx_not_on_chain") || message.includes("position_not_on_chain")) {
    return "Open transaction never confirmed on Solana — no liquidity was deployed";
  }
  if (message.includes("tx_confirm_timeout") || message.includes("tx_blockhash_expired")) {
    return "Transaction timed out before on-chain confirmation";
  }
  if (message.includes("spl_insufficient_funds") || message.includes("spl_token_error")) {
    return "Wallet missing pool token for this pool";
  }
  if (message.includes("simulation_failed") || message.includes("sim_returned_err")) {
    return "Simulation failed (tx not signed)";
  }
  if (message.includes("broker_pending_or_failed") || message.includes("Policy held")) {
    return formatLpLastError(message) || "Broker pending or blocked (policy / confirmation)";
  }
  return formatLpLastError(message) || message;
}

const RESOLUTION_LABELS: Record<string, string> = {
  take_profit: "Take profit",
  stop_loss: "Stop loss",
  oor: "Out of range",
  time_expiry: "Time expired",
  manual_close: "Manual close",
};

export function formatLpResolutionLabel(resolution: string | null | undefined): string {
  if (!resolution) return "Closed";
  return RESOLUTION_LABELS[resolution] ?? resolution.replace(/_/g, " ");
}

const RESOLUTION_DETAILS: Record<string, string> = {
  take_profit: "Strategy hit its take-profit threshold. Liquidity was removed and SOL returned to the agent wallet.",
  stop_loss: "Price moved against the position beyond the stop-loss rule. The agent closed to limit further loss.",
  oor: "Price stayed outside your bin range long enough. The agent exited per the out-of-range wait rule.",
  time_expiry: "Position reached the maximum hold time for this strategy and was closed automatically.",
  manual_close: "You requested stop-all. The agent closed this position and returned funds to the wallet.",
};

export function formatLpResolutionDetail(resolution: string | null | undefined): string {
  if (!resolution) return "Position was closed and proceeds returned to the agent wallet.";
  return RESOLUTION_DETAILS[resolution] ?? "Position closed on Meteora.";
}

/** Title + body for closed-row resolution badge hover. */
export function lpResolutionTooltip(row: LpRealPosition): { title: string; body: string } {
  const title = formatLpResolutionLabel(row.resolution);
  const parts = [formatLpResolutionDetail(row.resolution)];
  if (row.realNetPnlSol != null) {
    const sign = row.realNetPnlSol >= 0 ? "+" : "";
    parts.push(`Net PnL: ${sign}${row.realNetPnlSol.toFixed(4)} SOL`);
  }
  if (row.openedAt) {
    parts.push(`Held ${formatPositionDuration(row.openedAt, row.resolvedAt)}`);
  }
  if ((row.realFeesClaimedSol ?? 0) > 0) {
    parts.push(`LP fees earned: ${(row.realFeesClaimedSol ?? 0).toFixed(4)} SOL`);
  }
  return { title, body: parts.join(" · ") };
}

export function lpPositionStatusLabel(row: LpRealPosition): string {
  if (isOrphanedLiveLpRealPosition(row)) return "Closing retry";
  return row.status.replace(/_/g, " ");
}

/** Title + body for status badge hover (plain language for operators). */
export function lpPositionStatusTooltip(row: LpRealPosition): { title: string; body: string } {
  if (isOrphanedLiveLpRealPosition(row)) {
    return {
      title: "Closing retry",
      body:
        "This position is live on Meteora but the last close attempt failed. The resolve cron will retry removing liquidity and returning SOL to your wallet.",
    };
  }

  const errorExtra = row.errorMessage
    ? ` ${formatLpPositionError(row.errorMessage, row)}`
    : "";

  switch (row.status) {
    case "opening":
      return {
        title: row.openTxSig ? "Confirming" : "Opening",
        body: row.openTxSig
          ? "Open transaction confirmed on Solana. Waiting for Meteora to index the position (resolve cron checks every ~30s)."
          : "The agent is building and signing the Meteora open transaction. SOL is not locked in the pool until the tx confirms on-chain.",
      };
    case "open":
      return {
        title: "Live on Meteora",
        body: "Liquidity is active in the pool and earning fees. Open tx is confirmed on Solana mainnet. The agent monitors this position about every 30 seconds for take-profit, stop-loss, or out-of-range exits.",
      };
    case "closing":
      return {
        title: "Closing",
        body: "The agent is removing liquidity, claiming fees, and closing the position on-chain. SOL returns to the wallet after confirmation.",
      };
    case "closed_win":
      return {
        title: "Closed — win",
        body: "Position closed with positive net PnL after fees. Capital is back in the agent wallet (or was when the close tx confirmed).",
      };
    case "closed_loss":
      return {
        title: "Closed — loss",
        body: "Position closed with negative net PnL after fees. Capital returned to the wallet; loss is recorded in realized PnL.",
      };
    case "expired":
      return {
        title: "Expired",
        body: "Position hit the strategy time limit and was closed. Outcome depends on price drift and fees at close.",
      };
    case "claim_only":
      return {
        title: "Fees claimed",
        body: "Unclaimed swap fees were harvested from the position without closing the full LP slot.",
      };
    case "error": {
      const policyNote =
        row.policyReasons?.length ? ` Policy: ${row.policyReasons.join("; ")}.` : "";
      return {
        title: row.openTxSig ? "Close error" : "Open failed",
        body: row.openTxSig
          ? `Close did not complete.${errorExtra || " The agent will retry on the next resolve tick."}${policyNote}`
          : `The open never landed on Meteora — no SOL was locked in this pool.${errorExtra || " The agent can try again on the next signal tick when funded."}${policyNote}`,
      };
    }
    default:
      return {
        title: lpPositionStatusLabel(row),
        body: "Current state of this LP run in the real agent experiment.",
      };
  }
}

export function formatPositionDuration(openedAt: string | null, resolvedAt: string | null): string {
  if (!openedAt) return "—";
  const start = new Date(openedAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "—";
  const hours = Math.max(0, (end - start) / 3_600_000);
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function positionDepositLocked(row: Pick<LpRealPosition, "depositLocked" | "openTxSig" | "status">): boolean {
  if (row.depositLocked === true) return true;
  return Boolean(row.openTxSig) && row.status !== "error";
}
