import { Calendar, MessageCircle, Rocket, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AnsemSectionHeaderSkeleton,
  AnsemTileGridSkeleton,
} from "@/components/ansem/ansemSkeletons";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { AnsemCommunityPayload } from "@/lib/ansemCommunityApi";
import type { AnsemMarketSnapshot } from "@/lib/ansemMarketApi";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import { cn } from "@/lib/utils";
import { AnsemSectionHeader } from "@/components/ansem/AnsemSectionHeader";

function formatDate(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function IntelTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Trophy;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        <p className={overviewKickerClass}>{label}</p>
      </div>
      <p className="font-mono text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function AnsemTokenIntel({
  community,
  market,
  isLoading,
  className,
}: {
  community?: AnsemCommunityPayload | null;
  market?: AnsemMarketSnapshot;
  isLoading: boolean;
  className?: string;
}) {
  const intel = community?.tokenIntel;
  const social = community?.social;
  const graduated = intel?.complete ?? market?.graduated;

  if (isLoading && !community) {
    return (
      <section className={cn("min-w-0 space-y-4", className)}>
        <AnsemSectionHeaderSkeleton />
        <div className={cn(overviewCardShell, "space-y-5 p-5 sm:p-6")}>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
          <Skeleton className="h-14 w-full max-w-3xl rounded-lg" />
          <AnsemTileGridSkeleton count={4} />
        </div>
      </section>
    );
  }

  return (
    <section className={cn("min-w-0 space-y-4", className)}>
      <AnsemSectionHeader
        kicker="Token"
        title="The Black Bull dossier"
        description="pump.fun origin story, milestones, and live token metadata for holders."
      />

      <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            ${intel?.symbol ?? market?.symbol ?? "ANSEM"}
          </Badge>
          {graduated === true ? (
            <Badge className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Rocket className="h-3 w-3" />
              Graduated
            </Badge>
          ) : graduated === false ? (
            <Badge variant="outline">On bonding curve</Badge>
          ) : null}
          {intel?.source ? (
            <Badge variant="outline" className="text-[10px] capitalize">
              {intel.source}
            </Badge>
          ) : null}
        </div>

        {social?.description ? (
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {social.description}
          </p>
        ) : (
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            $ANSEM is a Solana memecoin born on pump.fun — community-driven, high-energy, and tracked
            live on this hub for holders who want clarity without connecting a wallet.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <IntelTile
            label="Market cap"
            value={formatCompactUsd(intel?.marketCapUsd ?? market?.marketCapUsd)}
            icon={Trophy}
          />
          <IntelTile
            label="ATH market cap"
            value={formatCompactUsd(intel?.athMarketCapUsd)}
            sub="pump.fun peak"
            icon={Trophy}
          />
          <IntelTile
            label="Community replies"
            value={
              intel?.replyCount != null ? intel.replyCount.toLocaleString() : "—"
            }
            sub="pump.fun thread"
            icon={MessageCircle}
          />
          <IntelTile
            label="Launched"
            value={formatDate(intel?.createdTimestampMs)}
            sub={
              intel?.lastTradeTimestampMs
                ? `Last trade ${formatDate(intel.lastTradeTimestampMs)}`
                : undefined
            }
            icon={Calendar}
          />
        </div>
      </div>
    </section>
  );
}
