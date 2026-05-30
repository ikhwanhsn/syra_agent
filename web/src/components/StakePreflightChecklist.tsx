"use client";

import type { StakeReadiness, StakeReadinessIssue } from "@/lib/streamflowStaking";
import { STREAMFLOW_LOCK_SOL_RECOMMENDED, StakeLockError } from "@/lib/streamflowStaking";

function StatusIcon({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
        aria-hidden
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </span>
  );
}

function WarningIcon() {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400"
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L1 21h22L12 2zm0 4.5L19.5 19h-15L12 6.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
      </svg>
    </span>
  );
}

function IssueRow({ issue }: { issue: StakeReadinessIssue }) {
  const isError = issue.severity === "error";
  return (
    <li
      className={`rounded-lg border px-3 py-2.5 ${
        isError
          ? "border-destructive/30 bg-destructive/5"
          : "border-amber-500/25 bg-amber-500/5"
      }`}
    >
      <p className={`text-sm font-semibold ${isError ? "text-destructive" : "text-amber-700 dark:text-amber-400"}`}>
        {issue.title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{issue.detail}</p>
      <p className="mt-1.5 text-xs font-medium text-foreground/90">
        <span className="text-muted-foreground">Fix: </span>
        {issue.fix}
      </p>
    </li>
  );
}

export interface StakePreflightChecklistProps {
  symbol: string;
  readiness: StakeReadiness | null;
  loading?: boolean;
  connected: boolean;
}

export function StakePreflightChecklist(props: StakePreflightChecklistProps) {
  const { symbol, readiness, loading, connected } = props;

  if (!connected) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-3 text-xs text-muted-foreground">
        Connect your wallet to see fee requirements and a pre-flight checklist.
      </div>
    );
  }

  if (loading || !readiness) {
    return (
      <div className="animate-pulse rounded-xl border border-border/50 bg-muted/20 px-4 py-4">
        <div className="mb-2 h-3 w-32 rounded bg-muted-foreground/15" />
        <div className="h-3 w-full max-w-md rounded bg-muted-foreground/10" />
      </div>
    );
  }

  const amountOk =
    readiness.requestedRaw > 2n && readiness.requestedRaw <= readiness.maxLockableRaw;

  const blockingIssues = readiness.issues.filter((i) => i.severity === "error");
  const warnings = readiness.issues.filter((i) => i.severity === "warning");

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Before you lock — checklist
        </p>
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-2.5">
            <StatusIcon ok={readiness.solBalanceLamports >= readiness.solRequiredLamports} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">SOL for Streamflow fees</p>
              <p className="text-xs text-muted-foreground">
                You have{" "}
                <span className="font-mono font-medium text-foreground">{readiness.solBalanceFormatted}</span>
                {" · "}
                need ~{STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL per lock
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/90">
                Paid by you when signing — not a Syra subscription (~0.16 SOL Streamflow + ~0.015 SOL network).
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <StatusIcon ok={readiness.maxLockableRaw > 2n} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{symbol} available to lock</p>
              <p className="text-xs text-muted-foreground">
                Wallet:{" "}
                <span className="font-mono font-medium text-foreground">
                  {readiness.walletBalanceFormatted} {symbol}
                </span>
                {" · "}
                max after fees:{" "}
                <span className="font-mono font-medium text-foreground">
                  {readiness.maxLockableFormatted} {symbol}
                </span>
                {readiness.feePercent > 0 ? ` (~${readiness.feePercent}% Streamflow fee)` : null}
              </p>
            </div>
          </li>
          {readiness.requestedRaw > 2n ? (
            <li className="flex items-start gap-2.5">
              <StatusIcon ok={amountOk} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">Lock amount</p>
                <p className="text-xs text-muted-foreground">
                  Locking{" "}
                  <span className="font-mono font-medium text-foreground">
                    {readiness.requestedFormatted} {symbol}
                  </span>
                  {readiness.estimatedSyraFeeFormatted !== "0" ? (
                    <>
                      {" "}
                      + ~{readiness.estimatedSyraFeeFormatted} {symbol} fee
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          ) : null}
        </ul>
      </div>

      {blockingIssues.length > 0 ? (
        <div role="alert">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">
            Fix these before locking
          </p>
          <ul className="space-y-2">
            {blockingIssues.map((issue) => (
              <IssueRow key={issue.code} issue={issue} />
            ))}
          </ul>
        </div>
      ) : readiness.canLock ? (
        <div className="rounded-xl border border-success/25 bg-success/5 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-semibold text-success">Ready to lock</p>
          <p className="mt-1 leading-relaxed">
            SOL and {symbol} look good. Confirm in your wallet — Streamflow will deduct fees automatically.
          </p>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="space-y-2">
          {warnings.map((issue) => (
            <li key={issue.code} className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <WarningIcon />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{issue.title}</p>
                <p className="text-xs text-muted-foreground">{issue.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function formatStakeErrorMessage(err: unknown): string {
  if (err instanceof StakeLockError) {
    return err.displayMessage();
  }
  return err instanceof Error ? err.message : "Lock failed";
}

/** Split StakeLockError into title + description for toast / notify UIs. */
export function parseStakeErrorForNotify(err: unknown): {
  title: string;
  description?: string;
  durationMs: number;
} {
  if (err instanceof StakeLockError) {
    return {
      title: err.title,
      description: `${err.message} — ${err.fix}`,
      durationMs: 12_000,
    };
  }
  const message = err instanceof Error ? err.message : "Lock failed";
  return {
    title: "Lock failed",
    description: message,
    durationMs: 8_000,
  };
}
