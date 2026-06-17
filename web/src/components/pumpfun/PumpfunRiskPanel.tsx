import { AlertTriangle, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { pickMarketScoreFromDossier, type MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function riskToneClass(tone?: string): string {
  if (tone === "safe") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (tone === "danger") return "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400";
  return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
}

function AuthorityFlag({
  label,
  renounced,
}: {
  label: string;
  renounced: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/30 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge
        variant="outline"
        className={cn(
          renounced
            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            : "border-red-500/30 text-red-600 dark:text-red-400",
        )}
      >
        {renounced ? "Renounced" : "Active"}
      </Badge>
    </div>
  );
}

export interface PumpfunRiskPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunRiskPanel({ data, className }: PumpfunRiskPanelProps) {
  const dossier = data.dossier.ok ? data.dossier.data : null;
  const marketScore = pickMarketScoreFromDossier(dossier);
  const onChain = data.onChainSecurity.ok ? data.onChainSecurity.data : null;

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Risk & security</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            Tokens.xyz grade + on-chain mint authority check
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        {marketScore ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn("px-3 py-1 text-sm font-semibold", riskToneClass(marketScore.tone))}>
              Grade {marketScore.grade ?? marketScore.label ?? "—"}
            </Badge>
            {marketScore.score != null ? (
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                Score {marketScore.score}
              </span>
            ) : null}
            {marketScore.isTrustedLaunch ? (
              <Badge variant="outline" className="gap-1 border-emerald-500/30">
                <ShieldCheck className="h-3 w-3" />
                Trusted launch
              </Badge>
            ) : null}
            {marketScore.hasInsufficientData ? (
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Insufficient data
              </Badge>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Risk grade unavailable</p>
        )}

        {onChain ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <AuthorityFlag label="Mint authority" renounced={onChain.mintAuthorityRenounced} />
            <AuthorityFlag label="Freeze authority" renounced={onChain.freezeAuthorityRenounced} />
            {!onChain.mintAuthorityRenounced && onChain.mintAuthority ? (
              <div className="col-span-full rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-mono text-muted-foreground">
                Mint authority: {onChain.mintAuthority.slice(0, 8)}…{onChain.mintAuthority.slice(-6)}
              </div>
            ) : null}
            {!onChain.freezeAuthorityRenounced && onChain.freezeAuthority ? (
              <div className="col-span-full rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-mono text-muted-foreground">
                Freeze authority: {onChain.freezeAuthority.slice(0, 8)}…{onChain.freezeAuthority.slice(-6)}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              On-chain security unavailable
              {data.onChainSecurity.error ? `: ${data.onChainSecurity.error}` : ""}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
