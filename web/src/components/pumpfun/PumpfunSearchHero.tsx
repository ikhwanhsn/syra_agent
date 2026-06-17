import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MemecoinAnalysisQuota } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

const EXAMPLE_MINTS = [
  { label: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { label: "WIF", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
] as const;

export interface PumpfunSearchHeroProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: (mint: string) => void;
  isLoading?: boolean;
  quota?: MemecoinAnalysisQuota;
  quotaLoading?: boolean;
  scanLimitReached?: boolean;
  className?: string;
}

const TIER_LIMITS = {
  free: 3,
  holder: 15,
  staker: 25,
} as const;

function tierLabel(tier: string | undefined): string {
  switch (tier) {
    case "holder":
      return "1M+ $SYRA";
    case "staker":
      return "Staker";
    case "bypass":
      return "Unlimited";
    default:
      return "Free";
  }
}

function tierUpgradeHint(tier: string | undefined): string | null {
  switch (tier) {
    case "free":
      return "Connect a wallet with 1M+ $SYRA for 15/day, or stake 1M+ for 25/day.";
    case "holder":
      return "Stake 1M+ $SYRA to unlock 25 scans/day.";
    default:
      return null;
  }
}

function formatResetHint(): string {
  return "Resets midnight UTC";
}

export function PumpfunSearchHero({
  value,
  onChange,
  onAnalyze,
  isLoading,
  quota,
  quotaLoading,
  scanLimitReached,
  className,
}: PumpfunSearchHeroProps) {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("syra.pumpfun.recentMints");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const saveRecent = useCallback((mint: string) => {
    setRecent((prev) => {
      const next = [mint, ...prev.filter((m) => m !== mint)].slice(0, 3);
      try {
        localStorage.setItem("syra.pumpfun.recentMints", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    onAnalyze(trimmed);
  }, [onAnalyze, saveRecent, value]);

  const pick = useCallback(
    (mint: string) => {
      onChange(mint);
      saveRecent(mint);
      onAnalyze(mint);
    },
    [onAnalyze, onChange, saveRecent],
  );

  const upgradeHint = tierUpgradeHint(quota?.tier);
  const showUsage = quota?.tier !== "bypass" && (quotaLoading || quota != null);
  const usedPct =
    quota && quota.limit > 0
      ? Math.min(100, Math.round((quota.used / quota.limit) * 100))
      : 0;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card/90 p-5 sm:p-6",
        className,
      )}
    >
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Pumpfun Alpha
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a mint address to analyze.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Mint address"
              className="h-11 pl-9 font-mono text-sm"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <Button
            type="button"
            variant="neon"
            className="h-11 shrink-0 px-5"
            disabled={!value.trim() || isLoading || scanLimitReached}
            onClick={submit}
          >
            {isLoading ? "…" : scanLimitReached ? "Limit" : "Scan"}
          </Button>
        </div>

        {quota?.tier !== "bypass" ? (
          <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
            {showUsage ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                  <span className="font-medium text-foreground">
                    {quotaLoading
                      ? "Loading daily limit…"
                      : quota
                        ? scanLimitReached
                          ? `Daily limit reached (${quota.used}/${quota.limit})`
                          : `${quota.used}/${quota.limit} scans used today`
                        : null}
                  </span>
                  {!quotaLoading && quota ? (
                    <span className="text-muted-foreground">
                      {tierLabel(quota.tier)} tier
                      {quota.remaining > 0
                        ? ` · ${quota.remaining} left`
                        : ` · ${formatResetHint()}`}
                    </span>
                  ) : null}
                </div>
                {!quotaLoading && quota && quota.limit > 0 ? (
                  <div
                    className="h-1 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={quota.used}
                    aria-valuemin={0}
                    aria-valuemax={quota.limit}
                    aria-label="Daily scans used"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        scanLimitReached ? "bg-destructive" : "bg-primary",
                      )}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {TIER_LIMITS.free}/day free · {TIER_LIMITS.holder}/day with 1M+ $SYRA ·{" "}
              {TIER_LIMITS.staker}/day staked
              {upgradeHint ? (
                <>
                  {" · "}
                  {upgradeHint}{" "}
                  <Link to="/staking" className="text-primary hover:underline">
                    Staking
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_MINTS.map((item) => (
            <Button
              key={item.mint}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-2.5 text-xs"
              onClick={() => pick(item.mint)}
            >
              {item.label}
            </Button>
          ))}
          {recent.map((mint) => (
            <Button
              key={mint}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 max-w-[120px] truncate rounded-full px-2.5 font-mono text-xs"
              onClick={() => pick(mint)}
            >
              {mint.slice(0, 4)}…{mint.slice(-4)}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
