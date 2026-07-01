import { CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

type CheckStatus = "pass" | "warn" | "fail" | "unknown";

type SafetyCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

function statusIcon(status: CheckStatus) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "fail") return <XCircle className="h-4 w-4 text-red-500" />;
  if (status === "warn") return <ShieldAlert className="h-4 w-4 text-amber-500" />;
  return <ShieldCheck className="h-4 w-4 text-muted-foreground" />;
}

function statusBadgeClass(status: CheckStatus): string {
  if (status === "pass") return "border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
  if (status === "fail") return "border-red-500/30 text-red-600 dark:text-red-400";
  if (status === "warn") return "border-amber-500/30 text-amber-700 dark:text-amber-400";
  return "border-border/50 text-muted-foreground";
}

function buildChecks(data: MemecoinAnalysisPayload): SafetyCheck[] {
  const onChain = data.onChainSecurity.ok ? data.onChainSecurity.data : null;
  const distribution = data.distribution.ok ? data.distribution.data : null;
  const pumpfun = data.pumpfun.ok ? data.pumpfun.data : null;
  const market = data.market;

  const mintRenounced = onChain?.mintAuthorityRenounced;
  const freezeRenounced = onChain?.freezeAuthorityRenounced;
  const top10 = distribution?.concentration.top10 ?? data.holders.data?.top10ConcentrationPct ?? null;

  const liquidityUsd = market.liquidityUsd ?? pumpfun?.bondingLiquidityUsd ?? null;
  const mcapUsd = market.marketCapUsd ?? pumpfun?.marketCapUsd ?? null;
  const liqRatio = liquidityUsd != null && mcapUsd != null && mcapUsd > 0 ? (liquidityUsd / mcapUsd) * 100 : null;

  return [
    {
      id: "mint",
      label: "Mint authority",
      status: mintRenounced == null ? "unknown" : mintRenounced ? "pass" : "fail",
      detail: mintRenounced == null ? "Unknown" : mintRenounced ? "Renounced" : "Active — can mint more",
    },
    {
      id: "freeze",
      label: "Freeze authority",
      status: freezeRenounced == null ? "unknown" : freezeRenounced ? "pass" : "fail",
      detail: freezeRenounced == null ? "Unknown" : freezeRenounced ? "Renounced" : "Active — can freeze wallets",
    },
    {
      id: "top10",
      label: "Top 10 concentration",
      status:
        top10 == null ? "unknown" : top10 <= 30 ? "pass" : top10 <= 50 ? "warn" : "fail",
      detail: top10 == null ? "Unknown" : `${top10.toFixed(1)}% of supply`,
    },
    {
      id: "liquidity",
      label: "Liquidity depth",
      status:
        liqRatio == null
          ? liquidityUsd == null
            ? "unknown"
            : liquidityUsd >= 10_000
              ? "pass"
              : "warn"
          : liqRatio >= 5
            ? "pass"
            : liqRatio >= 2
              ? "warn"
              : "fail",
      detail:
        liquidityUsd != null
          ? `${formatCompactUsd(liquidityUsd)}${liqRatio != null ? ` · ${liqRatio.toFixed(1)}% of mcap` : ""}`
          : "Unknown",
    },
    {
      id: "graduation",
      label: "Launch stage",
      status: pumpfun?.complete === true ? "pass" : pumpfun?.complete === false ? "warn" : "unknown",
      detail:
        pumpfun?.complete === true
          ? "Graduated to DEX"
          : pumpfun?.complete === false
            ? "Still on bonding curve"
            : "Unknown",
    },
  ];
}

export interface PumpfunSafetyChecklistProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunSafetyChecklist({ data, className }: PumpfunSafetyChecklistProps) {
  const checks = buildChecks(data);
  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className={overviewKickerClass}>Safety checklist</p>
            <h3 className="text-sm font-medium text-muted-foreground">
              One-glance vetting before you ape
            </h3>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            {passCount} pass
          </Badge>
          {failCount > 0 ? (
            <Badge variant="outline" className="border-red-500/30 text-red-600 dark:text-red-400">
              {failCount} fail
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {checks.map((check) => (
          <div
            key={check.id}
            className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-background/30 px-3 py-2.5"
          >
            <span className="mt-0.5 shrink-0">{statusIcon(check.status)}</span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium">{check.label}</p>
              <Badge variant="outline" className={cn("text-[10px]", statusBadgeClass(check.status))}>
                {check.detail}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
