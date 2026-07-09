import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Copy,
  Crown,
  Flame,
  Loader2,
  Medal,
  MessageCircle,
  Repeat2,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AnsemSectionHeader } from "@/components/ansem/AnsemSectionHeader";
import {
  AnsemListRowSkeleton,
  AnsemSectionHeaderSkeleton,
} from "@/components/ansem/ansemSkeletons";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import type {
  AnsemEngagementLeaderboardEntry,
  AnsemEngagementRecord,
} from "@/lib/ansemEngagementApi";
import {
  useAnsemEngagementCheck,
  useAnsemEngagementLeaderboard,
  useAnsemEngagementStatus,
} from "@/lib/ansemEngagementApi";
import { formatRelativeTime } from "@/lib/agentWalletUi";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

function gradeStyles(grade: string): { badge: string; ring: string; glow: string } {
  switch (grade) {
    case "A":
      return {
        badge: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
        ring: "stroke-emerald-500",
        glow: "shadow-[0_0_40px_-8px_rgba(16,185,129,0.55)]",
      };
    case "B":
      return {
        badge: "border-sky-500/50 bg-sky-500/10 text-sky-500",
        ring: "stroke-sky-500",
        glow: "shadow-[0_0_40px_-8px_rgba(14,165,233,0.5)]",
      };
    case "C":
      return {
        badge: "border-amber-500/50 bg-amber-500/10 text-amber-500",
        ring: "stroke-amber-500",
        glow: "shadow-[0_0_40px_-8px_rgba(245,158,11,0.45)]",
      };
    case "D":
      return {
        badge: "border-orange-500/50 bg-orange-500/10 text-orange-500",
        ring: "stroke-orange-500",
        glow: "shadow-[0_0_40px_-8px_rgba(249,115,22,0.4)]",
      };
    default:
      return {
        badge: "border-red-500/40 bg-red-500/10 text-red-400",
        ring: "stroke-red-400",
        glow: "shadow-[0_0_40px_-8px_rgba(248,113,113,0.35)]",
      };
  }
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const styles = gradeStyles(grade);
  const pct = Math.min(Math.max(score, 0), 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn(
        "relative mx-auto flex h-36 w-36 items-center justify-center rounded-full",
        styles.glow,
      )}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden>
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          className="stroke-muted/30"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          className={cn(styles.ring, "transition-all duration-700 ease-out")}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="relative text-center">
        <p className="font-mono text-3xl font-bold tabular-nums tracking-tight">{score}</p>
        <Badge variant="outline" className={cn("mt-1 rounded-md px-2 py-0 text-xs font-bold", styles.badge)}>
          {grade}
        </Badge>
      </div>
    </div>
  );
}

function BreakdownBars({ record }: { record: AnsemEngagementRecord }) {
  const rows = [
    {
      label: "Mentions",
      sub: `${record.ansemMentionCount} $ANSEM posts (7d)`,
      value: record.breakdown?.mentions.score ?? 0,
      max: record.breakdown?.mentions.max ?? 35,
    },
    {
      label: "Engagement",
      sub: `${(record.avgEngagementRatePct ?? 0).toFixed(2)}% avg rate`,
      value: record.breakdown?.engagement.score ?? 0,
      max: record.breakdown?.engagement.max ?? 40,
    },
    {
      label: "Reach",
      sub: `${formatFollowers(record.followersCount)} followers`,
      value: record.breakdown?.reach.score ?? 0,
      max: record.breakdown?.reach.max ?? 25,
    },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-foreground">{row.label}</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {row.value.toFixed(0)}/{row.max}
            </span>
          </div>
          <Progress value={(row.value / row.max) * 100} className="h-2" />
          <p className="mt-0.5 text-[11px] text-muted-foreground">{row.sub}</p>
        </div>
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="h-4 w-4 text-amber-400" aria-label="Rank 1" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-300" aria-label="Rank 2" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-700" aria-label="Rank 3" />;
  return (
    <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">{rank}</span>
  );
}

async function copyWalletAddress(address: string) {
  try {
    await navigator.clipboard.writeText(address);
    notify.success("Wallet address copied");
  } catch {
    notify.error("Could not copy address");
  }
}

function WalletCopyButton({ address, className }: { address: string; className?: string }) {
  if (!address.trim()) return null;
  return (
    <button
      type="button"
      onClick={() => void copyWalletAddress(address)}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label="Copy wallet address"
      title="Copy wallet address"
    >
      <Copy className="h-3 w-3" aria-hidden />
    </button>
  );
}

function LeaderboardMobileCard({
  entry,
  highlight,
}: {
  entry: AnsemEngagementLeaderboardEntry;
  highlight?: boolean;
}) {
  const styles = gradeStyles(entry.grade);
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-background/30 p-4",
        highlight && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          <RankBadge rank={entry.rank} />
        </span>
        {entry.profileImageUrl ? (
          <img
            src={entry.profileImageUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full border border-border/50 object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted/40 text-xs font-bold">
            {entry.xUsername.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <a
            href={entry.profileUrl ?? `https://x.com/${entry.xUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-semibold hover:text-primary"
          >
            @{entry.xUsername}
          </a>
          <p className="truncate text-[11px] text-muted-foreground">{entry.walletShort}</p>
          {entry.source === "discovered" ? (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">Auto-discovered</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg font-bold tabular-nums">{entry.engagementScore}</p>
          <Badge variant="outline" className={cn("rounded-md px-1.5 py-0 text-[10px] font-bold", styles.badge)}>
            {entry.grade}
          </Badge>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px]">
        <div className="rounded-lg bg-muted/25 px-2 py-1.5">
          <p className="text-muted-foreground">Posts</p>
          <p className="font-mono font-semibold tabular-nums">{entry.ansemMentionCount}</p>
        </div>
        <div className="rounded-lg bg-muted/25 px-2 py-1.5">
          <p className="text-muted-foreground">Engagement</p>
          <p className="font-mono font-semibold tabular-nums">
            {entry.ansemEngagementTotal.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  highlight,
}: {
  entry: AnsemEngagementLeaderboardEntry;
  highlight?: boolean;
}) {
  const styles = gradeStyles(entry.grade);
  return (
    <tr
      className={cn(
        "border-b border-border/40 transition-colors last:border-0",
        highlight && "bg-primary/5",
      )}
    >
      <td className="px-3 py-3 sm:px-4">
        <span className="flex h-8 w-8 items-center justify-center">{<RankBadge rank={entry.rank} />}</span>
      </td>
      <td className="px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          {entry.profileImageUrl ? (
            <img
              src={entry.profileImageUrl}
              alt=""
              className="h-9 w-9 rounded-full border border-border/50 object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-muted/40 text-xs font-bold">
              {entry.xUsername.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <a
              href={entry.profileUrl ?? `https://x.com/${entry.xUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1 truncate text-sm font-semibold hover:text-primary"
            >
              @{entry.xUsername}
              <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />
            </a>
            <p className="truncate text-[11px] text-muted-foreground">{entry.displayName}</p>
            <div className="mt-0.5 flex items-center gap-0.5">
              <span className="truncate font-mono text-[11px] tabular-nums text-muted-foreground/90">
                {entry.walletShort}
              </span>
              {entry.source === "discovered" ? (
                <span className="text-[10px] text-amber-600 dark:text-amber-400">· auto</span>
              ) : (
                <WalletCopyButton address={entry.walletAddress} />
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-3 text-right font-mono text-sm tabular-nums sm:table-cell sm:px-4">
        {entry.ansemMentionCount}
      </td>
      <td className="hidden px-3 py-3 text-right font-mono text-sm tabular-nums md:table-cell md:px-4">
        {entry.ansemEngagementTotal.toLocaleString()}
      </td>
      <td className="px-3 py-3 text-right sm:px-4">
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-base font-bold tabular-nums">{entry.engagementScore}</span>
          <Badge variant="outline" className={cn("rounded-md px-1.5 py-0 text-[10px] font-bold", styles.badge)}>
            {entry.grade}
          </Badge>
        </div>
      </td>
    </tr>
  );
}

function ResultCard({ record }: { record: AnsemEngagementRecord }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
      <div className="space-y-3 text-center lg:text-left">
        <ScoreRing score={record.engagementScore} grade={record.grade} />
        <p className="text-xs text-muted-foreground">
          Checked {formatRelativeTime(record.checkedAt)}
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {record.profileImageUrl ? (
            <img
              src={record.profileImageUrl}
              alt=""
              className="h-10 w-10 rounded-full border border-border/50 object-cover"
            />
          ) : null}
          <div>
            <p className="font-semibold">{record.displayName}</p>
            <a
              href={`https://x.com/${record.xUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              @{record.xUsername}
            </a>
          </div>
        </div>
        <BreakdownBars record={record} />
        {record.topTweets.length > 0 ? (
          <div className="space-y-2">
            <p className={overviewKickerClass}>Top $ANSEM posts</p>
            <ul className="space-y-2">
              {record.topTweets.map((t) => (
                <li
                  key={t.id}
                  className="rounded-xl border border-border/40 bg-background/40 p-3 text-sm"
                >
                  <p className="line-clamp-2 text-foreground/90">{t.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {t.likes}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Repeat2 className="h-3 w-3" /> {t.retweets}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-3 w-3" /> {t.replies} replies
                    </span>
                    {t.url ? (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-0.5 text-primary hover:underline"
                      >
                        View <ArrowUpRight className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            No $ANSEM posts found in the last 7 days — score is based on reach only. Post about $ANSEM and check again tomorrow.
          </p>
        )}
      </div>
    </div>
  );
}

export function AnsemEngagementArena({ className }: { className?: string }) {
  const { connected, connect, connecting } = useWalletContext();
  const { syraAuthReady, syraAuthenticated, ensureSyraAuth, requestSyraAuth } = useSyraAuth();
  const [handleInput, setHandleInput] = useState("");

  const leaderboardQ = useAnsemEngagementLeaderboard();
  const statusQ = useAnsemEngagementStatus(syraAuthReady && syraAuthenticated);
  const checkM = useAnsemEngagementCheck();

  useEffect(() => {
    if (handleInput.trim()) return;
    const prior = statusQ.data?.record?.xUsername;
    if (prior) setHandleInput(`@${prior}`);
  }, [statusQ.data?.record?.xUsername, handleInput]);

  const activeRecord = checkM.data?.data ?? statusQ.data?.record ?? null;
  const quota = checkM.data?.quota ?? statusQ.data?.quota;
  const canCheck = (quota?.remaining ?? 0) > 0;

  const myWalletShort = useMemo(() => {
    if (!activeRecord?.walletShort) return null;
    return activeRecord.walletShort;
  }, [activeRecord?.walletShort]);

  const resolveAuth = async () => {
    const passive = await ensureSyraAuth();
    if (passive?.anonymousId) return passive;
    return requestSyraAuth();
  };

  const onCheck = async () => {
    if (!connected) {
      try {
        await connect();
      } catch {
        notify.error("Connect your wallet to check engagement");
      }
      return;
    }

    const auth = await resolveAuth();
    if (!auth?.anonymousId) {
      notify.error("Sign in with your wallet to run a check");
      return;
    }

    const trimmed = handleInput.trim();
    if (!trimmed) {
      notify.error("Paste your X username or profile link");
      return;
    }

    try {
      await checkM.mutateAsync(trimmed);
      notify.success("Engagement score updated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Check failed";
      if (msg === "wallet_sign_in_required") {
        notify.error("Sign in with your wallet first");
      } else if (msg.includes("daily") || msg.includes("limit")) {
        notify.error("You've used your daily check — come back after midnight UTC");
      } else if (msg.includes("not found") || msg.includes("not_found")) {
        notify.error("X profile not found — check the username");
      } else if (msg.includes("lookup") || msg.includes("x_api")) {
        notify.error("Could not reach X right now — try again in a minute");
      } else {
        notify.error(msg);
      }
    }
  };

  const entries = leaderboardQ.data?.entries ?? [];
  const highlightUsername = activeRecord?.xUsername?.toLowerCase();
  const leaderboardLoading = useMinimumSkeleton(leaderboardQ.isPending && entries.length === 0);

  const awaitingStatus = syraAuthenticated && syraAuthReady && statusQ.isPending;
  const sectionBootstrapping =
    leaderboardLoading &&
    entries.length === 0 &&
    !activeRecord &&
    (awaitingStatus || !syraAuthenticated);

  if (sectionBootstrapping) {
    return (
      <section className={cn("min-w-0 space-y-5", className)}>
        <AnsemSectionHeaderSkeleton />
        <div className={cn(overviewCardShell, "space-y-4 p-5 sm:p-6")}>
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="mx-auto h-36 w-36 rounded-full" />
        </div>
        <div className={cn(overviewCardShell, "space-y-2 p-5")}>
          {Array.from({ length: 5 }).map((_, i) => (
            <AnsemListRowSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("min-w-0 space-y-5", className)}>
      <AnsemSectionHeader
        kicker="Bull squad"
        title="$ANSEM engagement arena"
        description="Connect your wallet, paste your X profile, and get a live engagement score from recent $ANSEM posts. One check per wallet per day. Recent $ANSEM posters are added to the board automatically."
        action={
          quota ? (
            <Badge variant="outline" className="rounded-lg px-2.5 py-1 text-xs font-medium">
              {canCheck ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" /> {quota.remaining} check left today
                </span>
              ) : (
                <span className="text-muted-foreground">Resets midnight UTC</span>
              )}
            </Badge>
          ) : null
        }
      />

      <div
        className={cn(
          overviewCardShell,
          "relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-background/80 to-orange-600/5 p-5 sm:p-6",
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-5">
          {!connected ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-amber-500/30 bg-background/50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold">
                  <Wallet className="h-4 w-4 text-amber-500" />
                  Wallet required
                </p>
                <p className="text-sm text-muted-foreground">
                  Connect a Solana wallet to unlock your daily $ANSEM engagement check.
                </p>
              </div>
              <Button
                onClick={() => void connect()}
                disabled={connecting}
                className="w-full shrink-0 sm:w-auto"
              >
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect wallet
              </Button>
            </div>
          ) : !syraAuthenticated ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-amber-500/30 bg-background/50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-semibold">Sign in to check</p>
                <p className="text-sm text-muted-foreground">
                  Verify wallet ownership once — then score your X profile (1× daily).
                </p>
              </div>
              <Button
                onClick={() => void resolveAuth().catch(() => notify.error("Sign-in cancelled"))}
                className="w-full shrink-0 sm:w-auto"
              >
                Sign in with wallet
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="username or x.com/you"
                  className="h-11 rounded-xl border-border/60 bg-background/70 pl-8 font-mono text-sm"
                  disabled={checkM.isPending || !canCheck}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void onCheck();
                  }}
                />
              </div>
              <Button
                onClick={() => void onCheck()}
                disabled={checkM.isPending || !canCheck}
                className="h-11 w-full shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 font-semibold text-white hover:from-amber-600 hover:to-orange-700 sm:w-auto"
              >
                {checkM.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning X…
                  </>
                ) : canCheck ? (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Check engagement
                  </>
                ) : (
                  "Checked today"
                )}
              </Button>
            </div>
          )}

          {checkM.isPending ? (
            <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
              <Skeleton className="mx-auto h-36 w-36 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ) : activeRecord ? (
            <ResultCard record={activeRecord} />
          ) : syraAuthenticated && statusQ.isSuccess ? (
            <p className="text-center text-sm text-muted-foreground">
              Paste your X handle above to see your $ANSEM engagement score.
              {myWalletShort ? ` Linked wallet: ${myWalletShort}` : null}
            </p>
          ) : null}
        </div>
      </div>

      <div className={cn(overviewCardShell, "overflow-hidden p-0")}>
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" aria-hidden />
            <h3 className="font-display text-lg font-semibold tracking-tight">Squad leaderboard</h3>
          </div>
          {leaderboardQ.data?.updatedAt ? (
            <p className="text-[11px] text-muted-foreground">
              Updated {formatRelativeTime(leaderboardQ.data.updatedAt)}
            </p>
          ) : null}
        </div>

        {leaderboardLoading && entries.length === 0 ? (
          <div className="space-y-2 p-4 sm:p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <AnsemListRowSkeleton key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No scores yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first bull on the board — connect wallet and run a check.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 p-4 md:hidden">
              {entries.map((entry) => (
                <LeaderboardMobileCard
                  key={entry.anonymousId}
                  entry={entry}
                  highlight={highlightUsername === entry.xUsername.toLowerCase()}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5 sm:px-4">#</th>
                    <th className="px-3 py-2.5 sm:px-4">Bull</th>
                    <th className="px-3 py-2.5 text-right sm:px-4">Posts</th>
                    <th className="px-3 py-2.5 text-right sm:px-4">Engagement</th>
                    <th className="px-3 py-2.5 text-right sm:px-4">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <LeaderboardRow
                      key={entry.anonymousId}
                      entry={entry}
                      highlight={highlightUsername === entry.xUsername.toLowerCase()}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
