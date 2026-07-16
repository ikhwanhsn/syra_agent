import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, Crown, Medal, Trophy } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { KOL_CREATE_CAMPAIGN_TOOLTIP } from "@/lib/kolRewardEligibility";
import { formatCompact, formatSol } from "@/lib/kolFormat";
import { KolProfileAvatar } from "@/components/kol/KolProfileAvatar";

export function LeaderboardRankCell({ rank }: { rank: number }) {
  const tier = rank <= 3 ? rank : 0;
  return (
    <div className="flex items-center justify-center py-0.5">
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1 min-w-[2.5rem] h-10 px-2 rounded-xl font-bold tabular-nums text-sm transition-colors",
          tier === 1 &&
            "bg-gradient-to-b from-amber-400/90 to-amber-600/85 text-amber-950 shadow-[0_0_24px_rgba(245,158,11,0.35)] border border-amber-300/60",
          tier === 2 &&
            "bg-gradient-to-b from-slate-200/95 to-slate-400/85 text-slate-900 border border-slate-300/70",
          tier === 3 &&
            "bg-gradient-to-b from-orange-300/90 to-amber-800/75 text-orange-950 border border-orange-500/45",
          tier === 0 && "text-muted-foreground font-semibold bg-muted/40 border border-border/50",
        )}
      >
        {tier === 1 ? <Trophy className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
        {rank}
      </span>
    </div>
  );
}

export function leaderboardRowClass(rank: number): string {
  if (rank === 1) return "bg-gradient-to-r from-amber-500/[0.07] via-primary/[0.04] to-transparent";
  if (rank === 2) return "bg-gradient-to-r from-slate-400/[0.08] via-transparent to-transparent";
  if (rank === 3) return "bg-gradient-to-r from-orange-600/[0.07] via-transparent to-transparent";
  return "hover:bg-muted/35";
}

const podiumConfig = {
  1: {
    order: "order-2",
    height: "h-[9.5rem] sm:h-[11rem]",
    avatar: "lg" as const,
    ring: "ring-amber-400/70 shadow-[0_0_40px_rgba(245,158,11,0.35)]",
    bar: "from-amber-400/25 via-amber-500/15 to-amber-600/5 border-amber-400/40",
    icon: Crown,
    iconClass: "text-amber-400",
    label: "1st",
  },
  2: {
    order: "order-1",
    height: "h-[7.5rem] sm:h-[9rem]",
    avatar: "md" as const,
    ring: "ring-slate-300/60 shadow-[0_0_24px_rgba(148,163,184,0.2)]",
    bar: "from-slate-300/20 via-slate-400/10 to-slate-500/5 border-slate-300/35",
    icon: Medal,
    iconClass: "text-slate-300",
    label: "2nd",
  },
  3: {
    order: "order-3",
    height: "h-[6.5rem] sm:h-[8rem]",
    avatar: "md" as const,
    ring: "ring-orange-500/50 shadow-[0_0_20px_rgba(234,88,12,0.2)]",
    bar: "from-orange-500/20 via-orange-600/10 to-orange-700/5 border-orange-500/35",
    icon: Medal,
    iconClass: "text-orange-400",
    label: "3rd",
  },
} as const;

export interface PodiumEntry {
  rank: 1 | 2 | 3;
  handle: string;
  verified?: boolean;
  score: number;
  payoutSol: number;
  payoutLocked?: boolean;
  likes: number;
  views: number;
}

export function LeaderboardPodium({
  entries,
  payoutLabel,
}: {
  entries: PodiumEntry[];
  payoutLabel: string;
}) {
  if (entries.length === 0) return null;

  const byRank = new Map(entries.map((e) => [e.rank, e]));
  const slots: (1 | 2 | 3)[] = [2, 1, 3];

  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent px-3 sm:px-6 pt-6 pb-2">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, hsl(var(--primary) / 0.14), transparent 65%)",
        }}
        aria-hidden
      />
      <div className="relative grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto">
        {slots.map((rank) => {
          const entry = byRank.get(rank);
          const config = podiumConfig[rank];
          const Icon = config.icon;

          if (!entry) {
            return (
              <div
                key={rank}
                className={cn("flex flex-col items-center opacity-40", config.order)}
              >
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border border-dashed border-border/70 mb-3" />
                <div
                  className={cn(
                    "w-full rounded-t-2xl border border-dashed border-border/60 bg-muted/20",
                    config.height,
                  )}
                />
              </div>
            );
          }

          return (
            <Link
              key={rank}
              to={`/kol/${encodeURIComponent(entry.handle)}`}
              className={cn(
                "group flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1",
                config.order,
              )}
            >
              <div className="relative mb-3">
                <div
                  className={cn(
                    "absolute -inset-1 rounded-2xl bg-gradient-to-b opacity-60 blur-md transition-opacity group-hover:opacity-90",
                    rank === 1 && "from-amber-400/50 to-amber-600/20",
                    rank === 2 && "from-slate-300/40 to-slate-500/10",
                    rank === 3 && "from-orange-500/40 to-orange-700/10",
                  )}
                  aria-hidden
                />
                <KolProfileAvatar
                  handle={entry.handle}
                  name={entry.handle}
                  size={config.avatar}
                  className={cn("relative ring-2", config.ring)}
                />
                <span
                  className={cn(
                    "absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border bg-background/90 backdrop-blur-sm",
                    rank === 1 && "border-amber-400/50",
                    rank === 2 && "border-slate-300/50",
                    rank === 3 && "border-orange-500/50",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", config.iconClass)} aria-hidden />
                </span>
              </div>

              <div className="mb-2 min-w-0 max-w-full px-1">
                <p className="font-semibold text-sm truncate flex items-center justify-center gap-1">
                  <span className="truncate">@{entry.handle}</span>
                  {entry.verified ? (
                    <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-label="Verified" />
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {entry.score.toFixed(1)} pts
                </p>
              </div>

              <div
                className={cn(
                  "w-full rounded-t-2xl border bg-gradient-to-t px-2 pt-3 pb-2 flex flex-col items-center justify-end",
                  config.bar,
                  config.height,
                )}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {payoutLabel}
                </p>
                <p
                  className={cn(
                    "text-base sm:text-lg font-bold tabular-nums text-primary leading-tight",
                    entry.payoutLocked && "opacity-40",
                  )}
                >
                  {formatSol(entry.payoutSol)}
                  <span className="text-xs font-semibold ml-0.5 opacity-80">SOL</span>
                </p>
                <p className="text-[10px] text-muted-foreground tabular-nums mt-1 hidden sm:block">
                  {formatCompact(entry.likes)} likes · {formatCompact(entry.views)} views
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function LeaderboardKolCell({
  handle,
  verified,
  walletShort,
}: {
  handle: string;
  verified?: boolean;
  walletShort?: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <KolProfileAvatar handle={handle} name={handle} size="md" />
      <div className="min-w-0">
        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
          <span className="truncate">@{handle}</span>
          {verified ? (
            <BadgeCheck className="w-4 h-4 text-primary shrink-0" aria-label="Verified" />
          ) : null}
        </div>
        {walletShort ? (
          <p className="text-xs text-muted-foreground font-mono truncate">{walletShort}</p>
        ) : null}
      </div>
    </div>
  );
}

export function LeaderboardModeBadge({
  mode,
  postCount,
}: {
  mode: "reply" | "quote";
  /** When > 1, score combines multiple posts. */
  postCount?: number;
}) {
  const count = postCount && postCount > 1 ? postCount : null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide border",
          mode === "reply"
            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
            : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25",
        )}
      >
        {mode}
      </span>
      {count != null ? (
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground border border-border/60 bg-muted/40"
          title={`Combined score from top ${count} posts`}
        >
          {count} posts
        </span>
      ) : null}
    </span>
  );
}

export function LeaderboardEligibilityBadge({
  eligible,
}: {
  eligible: boolean;
}) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border whitespace-nowrap shrink-0",
        eligible
          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
          : "bg-amber-500/10 text-amber-400 border-amber-500/25",
      )}
    >
      {eligible ? "Eligible" : "Locked"}
    </span>
  );

  if (eligible) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{badge}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{KOL_CREATE_CAMPAIGN_TOOLTIP}</TooltipContent>
    </Tooltip>
  );
}

export function LeaderboardPayoutCell({
  payoutSol,
  payoutLabel,
  isTop,
  locked,
}: {
  payoutSol: number;
  payoutLabel: string;
  isTop?: boolean;
  locked?: boolean;
}) {
  const content = (
    <div className={cn("text-right", locked && "cursor-help")}>
      <p
        className={cn(
          "font-mono tabular-nums whitespace-nowrap transition-opacity",
          locked && "opacity-40",
          isTop ? "text-base font-bold text-primary" : "text-sm font-semibold text-primary",
        )}
      >
        {formatSol(payoutSol)} <span className="text-xs font-medium opacity-75">SOL</span>
      </p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
        {payoutLabel}
      </p>
    </div>
  );

  if (!locked) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top">{KOL_CREATE_CAMPAIGN_TOOLTIP}</TooltipContent>
    </Tooltip>
  );
}

export function LeaderboardScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  return (
    <div className="space-y-1">
      <p className="font-mono text-sm font-semibold tabular-nums">{score.toFixed(1)}</p>
      <div className="h-1 w-full max-w-[5rem] rounded-full bg-muted overflow-hidden ml-auto">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LeaderboardRowChevron() {
  return (
    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity" />
  );
}
