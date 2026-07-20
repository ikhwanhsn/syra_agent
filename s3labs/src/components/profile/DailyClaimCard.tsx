import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarCheck, CalendarDays, Gift, Sparkles, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { claimDailyPoints, fetchDailyClaimStatus } from "@/lib/kolApi";
import { cn } from "@/lib/utils";

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface DailyClaimCardProps {
  wallet: string;
}

function ProgressBar({ value, max, highlight }: { value: number; max: number; highlight?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          highlight ? "bg-primary" : "bg-primary/70",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function DailyClaimCard({ wallet }: DailyClaimCardProps) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["daily-claim", wallet],
    queryFn: () => fetchDailyClaimStatus(wallet),
    enabled: Boolean(wallet),
    staleTime: 30_000,
  });

  const claimMutation = useMutation({
    mutationFn: () => claimDailyPoints(wallet),
    onSuccess: (result) => {
      const parts = [`+${formatPoints(result.claim.totalPoints)} pts`];
      if (result.bonuses.weekly) parts.push("+1 weekly bonus");
      if (result.bonuses.monthly) parts.push("+10 monthly bonus");
      toast.success(`Daily claim collected — ${parts.join(", ")}`);
      void queryClient.invalidateQueries({ queryKey: ["daily-claim", wallet] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-points", wallet] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Claim failed — try again");
    },
  });

  if (statusQuery.isLoading) {
    return <Skeleton className="h-52 sm:h-56 rounded-2xl" />;
  }

  const status = statusQuery.data;
  if (!status) return null;

  const { preview, week, month, config } = status;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 lg:p-8 min-w-0">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between min-w-0">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
              <Gift className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <p className="eyebrow">Daily rewards</p>
          </div>
          <h2 className="heading-section text-lg min-[400px]:text-xl sm:text-2xl">Claim S3Labs Points</h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            {status.policy.summary}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-mono break-all">
            UTC day · {status.todayUtc}
          </p>
          <Button asChild variant="outline" size="sm" className="rounded-full w-fit">
            <Link to="/profile/missions">
              <Target className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Missions
            </Link>
          </Button>
        </div>

        <div className="w-full lg:w-auto lg:min-w-[11rem] rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-sm p-4 sm:p-5 text-center shrink-0">
          <p className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground">
            Today&apos;s reward
          </p>
          <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-primary mt-2">
            {formatPoints(preview.totalPoints)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">points</p>
          {status.claimedToday ? (
            <Badge
              variant="outline"
              className="mt-4 border-primary/30 text-primary bg-primary/10 w-full sm:w-auto justify-center"
            >
              Claimed today
            </Badge>
          ) : (
            <Button
              variant="hero"
              className="mt-4 w-full rounded-full min-h-10"
              disabled={claimMutation.isPending || !status.canClaimToday}
              onClick={() => claimMutation.mutate()}
            >
              {claimMutation.isPending ? "Claiming…" : "Claim now"}
            </Button>
          )}
        </div>
      </div>

      <div className="relative mt-5 sm:mt-6 grid gap-3 sm:gap-4 lg:grid-cols-2 min-w-0">
        <div className="rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm p-3 sm:p-4 space-y-3 min-w-0">
          <div className="flex flex-col gap-1 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium min-w-0">
              <CalendarCheck className="h-4 w-4 text-primary shrink-0" aria-hidden />
              <span className="truncate">Weekly streak</span>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground shrink-0">
              {week.daysInCurrentCycle}/{week.cycleDays} days
            </span>
          </div>
          <ProgressBar
            value={week.daysInCurrentCycle}
            max={week.cycleDays}
            highlight={week.weeklyBonusEligible || week.weeklyBonusEarnedToday}
          />
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            Claim{" "}
            <span className="text-primary font-medium">{week.cycleDays} days in a row</span> for a{" "}
            <span className="text-primary font-medium">+{formatPoints(config.weeklyBonus)} bonus</span>{" "}
            on day {week.cycleDays}.
            {week.weeklyBonusEligible || week.weeklyBonusEarnedToday ? (
              <span className="text-primary"> Weekly bonus unlocked today.</span>
            ) : week.consecutiveStreak > 0 ? (
              <span>
                {" "}
                {week.daysUntilWeeklyBonus} more consecutive day
                {week.daysUntilWeeklyBonus !== 1 ? "s" : ""} until the bonus.
              </span>
            ) : (
              <span> Start a streak — missing a day resets the count.</span>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm p-3 sm:p-4 space-y-3 min-w-0">
          <div className="flex flex-col gap-1 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium min-w-0">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" aria-hidden />
              <span className="truncate">Monthly streak</span>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground shrink-0 text-left min-[400px]:text-right leading-snug">
              {month.daysClaimed}/{month.daysElapsed} · {month.daysInMonth}d
            </span>
          </div>
          <ProgressBar
            value={month.daysClaimed}
            max={month.daysElapsed}
            highlight={month.monthlyBonusEligible || month.monthlyBonusEarnedToday}
          />
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground/80">{month.calendarLabel}</span> has{" "}
            <span className="text-primary font-medium">{month.daysInMonth} calendar days</span>. Claim
            every day through the last day for a{" "}
            <span className="text-primary font-medium">+{formatPoints(config.monthlyBonus)} bonus</span>.
            {month.isMonthEnd ? (
              month.monthlyBonusEligible || month.monthlyBonusEarnedToday ? (
                <span className="text-primary"> Monthly bonus unlocked today.</span>
              ) : (
                <span> Missed a day this month — bonus resets next month.</span>
              )
            ) : (
              <span>
                {" "}
                {month.daysInMonth - month.daysElapsed} day(s) left in {month.calendarLabel}.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground min-w-0">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 sm:px-3 py-1.5 max-w-full">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
          <span className="truncate">Base {formatPoints(config.dailyBase)} / day</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 sm:px-3 py-1.5 max-w-full">
          <Trophy className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
          <span className="truncate">{formatPoints(status.totalDailyClaimPoints)} pts from daily claims</span>
        </span>
        {preview.weeklyBonus > 0 ? (
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 shrink-0">
            +{formatPoints(preview.weeklyBonus)} weekly today
          </Badge>
        ) : null}
        {preview.monthlyBonus > 0 ? (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 shrink-0">
            +{formatPoints(preview.monthlyBonus)} monthly today
          </Badge>
        ) : null}
      </div>
    </section>
  );
}
