import { FormEvent, useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  Coins,
  ExternalLink,
  Loader2,
  Search,
  Trophy,
} from "lucide-react";

import { KolProfileAvatar } from "@/components/kol/KolProfileAvatar";
import { KolEarningsFlexShareSection } from "@/components/kol/KolEarningsFlexShareSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchEarningsByXHandle,
  KolApiError,
  type KolHandleEarnings,
  type KolHandleEarningsAmountKind,
} from "@/lib/kolApi";
import { formatFollowers, formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

function cleanHandleInput(raw: string): string {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "")
    .split(/[/?#]/)[0] ?? "";
}

function amountKindLabel(kind: KolHandleEarningsAmountKind): string {
  switch (kind) {
    case "paid":
      return "Paid out";
    case "held":
      return "Held (min payout)";
    case "claimable":
      return "Awaiting send";
    case "projected":
      return "Projected";
    default:
      return "—";
  }
}

function EarningsResult({ data }: { data: KolHandleEarnings }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/14 via-transparent to-primary/6"
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-center gap-4">
            <KolProfileAvatar
              handle={data.handle}
              name={data.name}
              profilePicture={data.profilePicture}
              size="lg"
              className="h-16 w-16 rounded-2xl sm:h-20 sm:w-20"
            />
            <div className="min-w-0 space-y-1">
              <p className="eyebrow">X account earnings</p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="heading-section text-xl sm:text-2xl truncate">{data.name}</h2>
                {data.verified ? (
                  <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-label="Verified" />
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">@{data.handle}</p>
              {data.followers != null ? (
                <p className="text-xs text-muted-foreground">
                  {formatFollowers(data.followers)} followers
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5">
              <Link to={`/kol/${encodeURIComponent(data.handle)}`}>
                Full profile
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5 text-muted-foreground">
              <a
                href={`https://x.com/${encodeURIComponent(data.handle)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on X
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="relative grid grid-cols-2 border-t border-border/50 bg-muted/15 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
          <div className="px-4 py-4 sm:px-6 sm:py-5 col-span-2 lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-primary" />
              Total earned
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-semibold tabular-nums text-primary tracking-tight">
              {formatSol(data.totals.totalEarnedSol)} SOL
            </p>
            <p className="text-xs text-muted-foreground mt-1">Paid + held + awaiting send</p>
          </div>
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Paid out
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {formatSol(data.totals.paidSol)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Projected
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {formatSol(data.totals.projectedSol)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              Campaigns
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {data.campaignCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.submissionCount} post{data.submissionCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {(data.totals.heldSol > 0 || data.totals.claimableSol > 0) && (
          <div className="relative border-t border-border/50 px-4 py-3 sm:px-6 text-sm text-muted-foreground">
            {data.totals.heldSol > 0 ? (
              <span className="mr-4">
                Held under min payout:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatSol(data.totals.heldSol)} SOL
                </span>
              </span>
            ) : null}
            {data.totals.claimableSol > 0 ? (
              <span>
                Awaiting send:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatSol(data.totals.claimableSol)} SOL
                </span>
              </span>
            ) : null}
          </div>
        )}
      </section>

      <KolEarningsFlexShareSection data={data} />

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl">
        <div className="border-b border-border/50 px-4 py-4 sm:px-6">
          <h3 className="font-semibold text-lg tracking-tight">Campaign breakdown</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Earnings from each campaign this X account joined.
          </p>
        </div>
        <div className="divide-y divide-border/40">
          {data.rows.map((row) => (
            <article
              key={row.submission.id}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6 sm:py-5"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {row.campaign ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/kol?campaign=${encodeURIComponent(row.campaign!.id)}`)
                      }
                      className="truncate text-left font-semibold hover:text-primary transition-colors"
                    >
                      {row.campaign.title}
                    </button>
                  ) : (
                    <p className="font-semibold">Campaign</p>
                  )}
                  <Badge variant="outline" className="capitalize shrink-0">
                    {row.submission.mode}
                  </Badge>
                  <Badge variant="outline" className="shrink-0">
                    {amountKindLabel(row.amountKind)}
                  </Badge>
                </div>
                <a
                  href={row.submission.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View post on X
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="sm:text-right">
                <p
                  className={cn(
                    "text-xl font-semibold tabular-nums tracking-tight",
                    row.amountKind === "paid" ||
                      row.amountKind === "held" ||
                      row.amountKind === "claimable"
                      ? "text-primary"
                      : "text-foreground",
                  )}
                >
                  {formatSol(row.amountSol)} SOL
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function KolEarningsCheckPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const handleFromUrl = searchParams.get("handle")?.trim() ?? "";
  const [input, setInput] = useState(() => cleanHandleInput(handleFromUrl));
  const [lookupHandle, setLookupHandle] = useState(() => cleanHandleInput(handleFromUrl));

  useEffect(() => {
    const next = cleanHandleInput(handleFromUrl);
    setLookupHandle(next);
    if (next) setInput(next);
  }, [handleFromUrl]);

  const query = useQuery({
    queryKey: ["kol-earnings-by-x", lookupHandle],
    queryFn: () => fetchEarningsByXHandle(lookupHandle),
    enabled: Boolean(lookupHandle),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const clean = cleanHandleInput(input);
      if (!clean) return;
      setLookupHandle(clean);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", "check");
          next.set("handle", clean);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [input, setSearchParams],
  );

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h2 className="font-semibold text-lg mb-1">Check earnings by X</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Enter an X username to see total SOL earned from KOL campaigns — paid out, held, and still
          projecting on live campaigns. No wallet needed.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center max-w-xl"
      >
        <div className="relative flex-1 min-w-0">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            @
          </span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/^@/, ""))}
            placeholder="username"
            className="rounded-full h-11 pl-8"
            autoComplete="username"
            spellCheck={false}
            aria-label="X username"
          />
        </div>
        <Button type="submit" variant="hero" className="rounded-full gap-2 shrink-0 h-11">
          {query.isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Check earnings
        </Button>
      </form>

      {!lookupHandle ? (
        <div className="rounded-2xl border border-border/60 panel-glass p-6 sm:p-8 text-sm text-muted-foreground">
          Search any X handle that joined campaigns on S3 Labs. You don’t need to connect a wallet.
        </div>
      ) : query.isLoading ? (
        <div className="rounded-2xl border border-border/60 panel-glass p-10 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Looking up @{lookupHandle}…
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8 space-y-2">
          <h2 className="font-semibold text-lg">No earnings found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {query.error instanceof KolApiError
              ? query.error.message
              : `We couldn’t find campaign activity for @${lookupHandle}.`}
          </p>
          <p className="text-sm text-muted-foreground">
            Make sure the handle matches the X account that replied or quoted a campaign post.
          </p>
        </div>
      ) : query.data ? (
        <EarningsResult data={query.data} />
      ) : null}
    </div>
  );
}
