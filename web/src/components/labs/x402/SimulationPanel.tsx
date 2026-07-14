import { useMemo, useState } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import type { LabChain, LabWallet, LabX402Endpoint, LabX402Settings } from "@/lib/labsX402Api";
import {
  buildPerWalletBalanceRows,
  formatSimulationSol,
  formatSimulationUsd,
  getCallsRange,
  runLabsX402Simulation,
} from "@/lib/labsX402Simulation";

interface SimulationPanelProps {
  payerCount: number;
  wallets: LabWallet[];
  settings: LabX402Settings | undefined;
  endpoints: LabX402Endpoint[];
  chain?: LabChain;
  /** Draft values from settings form (optional — falls back to saved settings) */
  draft?: {
    intervalMin?: number;
    jitterPct?: number;
    refundEnabled?: boolean;
    autoCallEnabled?: boolean;
  };
}

function StatRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">
        {value}
        {hint ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">({hint})</span>
        ) : null}
      </dd>
    </div>
  );
}

export function SimulationPanel({
  payerCount,
  wallets,
  settings,
  endpoints,
  draft,
  chain = "solana",
}: SimulationPanelProps) {
  const [open, setOpen] = useState(false);
  const [targetCalls, setTargetCalls] = useState(1000);
  const nativeSymbol =
    chain === "celo"
      ? "CELO"
      : chain === "base"
        ? "ETH"
        : chain === "algorand"
          ? "ALGO"
          : "SOL";

  const formatNative = (n: number) => {
    if (chain === "base" || chain === "celo" || chain === "algorand") {
      if (n < 0.0001 && n > 0) return `<0.0001 ${nativeSymbol}`;
      return `~${n.toFixed(4)} ${nativeSymbol}`;
    }
    return formatSimulationSol(n);
  };

  const intervalMin = draft?.intervalMin ?? (settings ? Math.round(settings.intervalMs / 60_000) : 5);
  const jitterPct = draft?.jitterPct ?? settings?.jitterPct ?? 20;
  const refundEnabled = draft?.refundEnabled ?? settings?.refundEnabled ?? true;
  const autoCallEnabled = draft?.autoCallEnabled ?? settings?.autoCallEnabled ?? false;

  const result = useMemo(
    () =>
      runLabsX402Simulation({
        payerCount,
        intervalMin,
        jitterPct,
        refundEnabled,
        autoCallEnabled,
        endpoints,
        targetCallsPerDay: targetCalls,
      }),
    [payerCount, intervalMin, jitterPct, refundEnabled, autoCallEnabled, endpoints, targetCalls],
  );

  const callsRange = useMemo(
    () => getCallsRange(payerCount, intervalMin, jitterPct),
    [payerCount, intervalMin, jitterPct],
  );

  const perWalletRows = useMemo(
    () => buildPerWalletBalanceRows(wallets, result.walletBalances),
    [wallets, result.walletBalances],
  );

  return (
    <div className={cn(overviewCardShell, "overflow-hidden")}>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Calculator className="h-4 w-4 text-primary" aria-hidden />
            Volume & cost simulation
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimate daily calls, USDC flow, and recommended interval for a target volume.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden />
              Hide
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden />
              Simulate
            </>
          )}
        </Button>
      </div>

      {open ? (
        <div className="space-y-5 border-t border-border/60 px-5 pb-5 pt-4">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="target-calls">Target calls per day</Label>
            <Input
              id="target-calls"
              type="number"
              min={1}
              max={100_000}
              value={targetCalls}
              onChange={(e) => setTargetCalls(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          {!autoCallEnabled ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
              Auto-call is off — projected volume is 0 until you enable it and save settings.
            </p>
          ) : null}

          {payerCount === 0 && wallets.length === 0 ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Add at least one payer wallet to run volume projections.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {payerCount > 0 ? (
                <>
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Current config
                </p>
                <dl className="space-y-2">
                  <StatRow label="Payer wallets" value={String(payerCount)} />
                  <StatRow label="Interval" value={`${intervalMin} min`} hint={`±${jitterPct}% jitter`} />
                  <StatRow
                    label="Interval range"
                    value={`${result.intervalRangeMin}–${result.intervalRangeMax} min`}
                  />
                  <StatRow
                    label="Est. calls / day"
                    value={
                      autoCallEnabled
                        ? `${callsRange.min.toLocaleString()}–${callsRange.max.toLocaleString()}`
                        : "0"
                    }
                    hint={autoCallEnabled ? `~${result.callsPerDay.toLocaleString()} avg` : undefined}
                  />
                  <StatRow
                    label="Calls / wallet / day"
                    value={autoCallEnabled ? result.callsPerWalletPerDay.toFixed(0) : "0"}
                  />
                  <StatRow
                    label="Avg price / call"
                    value={formatSimulationUsd(result.avgPriceUsd)}
                    hint={`$${result.minPriceUsd.toFixed(2)}–$${result.maxPriceUsd.toFixed(2)}`}
                  />
                </dl>
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cost projection (24h)
                </p>
                <dl className="space-y-2">
                  <StatRow
                    label="Gross USDC moved"
                    value={formatSimulationUsd(result.grossUsdcPerDay)}
                  />
                  <StatRow
                    label="Net USDC cost"
                    value={formatSimulationUsd(result.netUsdcPerDay)}
                    hint={result.refundEnabled ? "refund on" : "refund off"}
                  />
                  <StatRow
                    label="USDC / payer wallet"
                    value={formatSimulationUsd(result.grossUsdcPerWalletPerDay)}
                    hint="gross flow"
                  />
                  <StatRow
                    label={`Est. ${nativeSymbol} fees`}
                    value={`~${result.estSolPerDay.toFixed(4)} ${nativeSymbol}`}
                    hint={result.refundEnabled ? "pay + refund txs" : "pay txs only"}
                  />
                  <StatRow
                    label={`${nativeSymbol} / payer wallet`}
                    value={`~${result.estSolPerWalletPerDay.toFixed(4)} ${nativeSymbol}`}
                  />
                </dl>
              </div>
                </>
              ) : null}

              {payerCount > 0 ? (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Suggested for {targetCalls.toLocaleString()} calls / day
                </p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <StatRow
                    label="Recommended interval"
                    value={
                      result.suggestedIntervalMin != null
                        ? `${result.suggestedIntervalMin} min`
                        : "—"
                    }
                    hint={`with ${payerCount} payer${payerCount === 1 ? "" : "s"}`}
                  />
                  <StatRow
                    label="Projected gross USDC"
                    value={formatSimulationUsd(targetCalls * result.avgPriceUsd)}
                  />
                  <StatRow
                    label="Payer USDC buffer (each)"
                    value={formatSimulationUsd(result.payerUsdcBuffer)}
                    hint="min for one call"
                  />
                  <StatRow
                    label="PayTo USDC buffer"
                    value={formatSimulationUsd(result.paytoUsdcBuffer)}
                    hint="refund float"
                  />
                </dl>
              </div>
              ) : null}

              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Suggested wallet balances
                </p>
                <p className="text-xs text-muted-foreground">
                  Recommended funding per wallet for {targetCalls.toLocaleString()} calls/day
                  {result.refundEnabled ? " (refund on — USDC is working capital, not net spend)" : ""}.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.walletBalances.map((s) => (
                    <div
                      key={s.role}
                      className="rounded-md border border-border/50 bg-background/50 p-3"
                    >
                      <p className="text-sm font-medium capitalize">
                        {s.role === "payto" ? "PayTo wallet" : "Each payer wallet"}
                      </p>
                      <dl className="mt-2 space-y-1.5">
                        <StatRow
                          label="USDC"
                          value={formatSimulationUsd(s.suggestedUsdc)}
                          hint={s.usdcNote}
                        />
                        <StatRow
                          label={nativeSymbol}
                          value={formatNative(s.suggestedSol)}
                          hint={s.solNote
                            .replace(/SOL/gi, nativeSymbol)
                            .replace(
                              /rent/gi,
                              chain === "base" || chain === "celo"
                                ? "gas"
                                : chain === "algorand"
                                  ? "min-balance"
                                  : "rent",
                            )}
                        />
                      </dl>
                    </div>
                  ))}
                </div>

                {perWalletRows.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-border/50">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="px-3 py-2 font-medium">Wallet</th>
                          <th className="px-3 py-2 font-medium">Role</th>
                          <th className="px-3 py-2 text-right font-medium">USDC now</th>
                          <th className="px-3 py-2 text-right font-medium">USDC need</th>
                          <th className="px-3 py-2 text-right font-medium">{nativeSymbol} now</th>
                          <th className="px-3 py-2 text-right font-medium">{nativeSymbol} need</th>
                          <th className="px-3 py-2 text-right font-medium">Deposit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perWalletRows.map((row) => {
                          const needsDeposit = row.usdcShortfall > 0 || row.solShortfall > 0;
                          return (
                            <tr key={row.id} className="border-b border-border/30 last:border-0">
                              <td className="px-3 py-2 font-medium">{row.label}</td>
                              <td className="px-3 py-2 capitalize text-muted-foreground">{row.role}</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {row.currentUsdc != null ? row.currentUsdc.toFixed(2) : "—"}
                              </td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {row.suggestedUsdc.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {row.currentSol != null ? row.currentSol.toFixed(4) : "—"}
                              </td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {row.suggestedSol.toFixed(4)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {needsDeposit ? (
                                  <span className="text-amber-400">
                                    +{row.usdcShortfall.toFixed(2)} USDC
                                    {row.solShortfall > 0
                                      ? `, +${row.solShortfall.toFixed(4)} ${nativeSymbol}`
                                      : ""}
                                  </span>
                                ) : (
                                  <span className="text-green-500">OK</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
