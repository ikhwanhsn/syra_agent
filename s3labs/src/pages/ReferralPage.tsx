import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  Medal,
  Rocket,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { ProfileListToolbar } from "@/components/profile/ProfileListToolbar";
import { ProfileSectionHeader } from "@/components/profile/ProfileSectionHeader";
import { ProfileListPagination } from "@/components/profile/ProfileListPagination";
import {
  PROFILE_LIST_PAGE_SIZE,
  SKELETON_STAGGER_MS,
  paginateItems,
} from "@/components/profile/profileListUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createReferralCode,
  fetchReferralProfile,
  KolApiError,
  type ReferralEventType,
  type ReferralLedgerEntry,
} from "@/lib/kolApi";
import { REFERRAL_POINTS_HINT } from "@/lib/kolRewardEligibility";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { claimIfNeeded } from "@/lib/referralCapture";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

function eventLabel(type: ReferralEventType): string {
  if (type === "participation") return "Joined campaign";
  if (type === "podium") return "Top 3 finish";
  return "Campaign go-live";
}

function eventMeta(type: ReferralEventType): {
  icon: typeof Users;
  badgeClass: string;
  pointsHint: string;
} {
  if (type === "participation") {
    return {
      icon: Users,
      badgeClass: "border-primary/25 bg-primary/10 text-primary",
      pointsHint: "+0.1",
    };
  }
  if (type === "podium") {
    return {
      icon: Medal,
      badgeClass: "border-amber-400/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      pointsHint: "+0.3",
    };
  }
  return {
    icon: Rocket,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pointsHint: "+0.5",
  };
}

function formatAwardedAt(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shareUrl(sharePath: string | null, code: string | null): string {
  if (typeof window === "undefined") {
    return sharePath ? `https://s3labs.xyz${sharePath}` : "";
  }
  const path = sharePath ?? (code ? `/r/${code}` : "");
  return path ? `${window.location.origin}${path}` : "";
}

type CreditFilter = "all" | ReferralEventType;
type CreditSort = "newest" | "oldest" | "points_desc" | "points_asc";

const CREDIT_FILTER_OPTIONS: { value: CreditFilter; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "participation", label: "Joined campaign" },
  { value: "podium", label: "Top 3 finish" },
  { value: "creation", label: "Campaign go-live" },
];

const CREDIT_SORT_OPTIONS: { value: CreditSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "points_desc", label: "Points · high" },
  { value: "points_asc", label: "Points · low" },
];

function Bone({ className }: { className?: string }) {
  return <div className={cn("skeleton-bone", className)} aria-hidden />;
}

function StaggerShell({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("animate-fade-in opacity-0", className)}
      style={{
        animationDelay: `${index * SKELETON_STAGGER_MS}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
}

function ReferralPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading referral profile…</span>
      <StaggerShell index={0}>
        <div className="overflow-hidden rounded-2xl border border-border/55 bg-card/50 p-5 sm:p-6 shadow-card space-y-4">
          <Bone className="h-3 w-28 rounded-md" />
          <Bone className="h-8 w-40 rounded-md" />
          <Bone className="h-11 w-full rounded-full" />
        </div>
      </StaggerShell>
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StaggerShell key={i} index={i + 1}>
            <div className="rounded-2xl border border-border/55 bg-card/50 p-4 sm:p-5 shadow-card space-y-3">
              <Bone className="h-7 w-7 rounded-lg" />
              <Bone className="h-3 w-16 rounded-md" />
              <Bone className="h-7 w-20 rounded-md" />
            </div>
          </StaggerShell>
        ))}
      </div>
      <StaggerShell index={5}>
        <div className="rounded-2xl border border-border/55 bg-card/50 p-4 shadow-card space-y-3">
          <Bone className="h-11 w-full rounded-full" />
          <div className="flex flex-wrap gap-2">
            <Bone className="h-11 w-36 rounded-full" />
            <Bone className="h-11 w-36 rounded-full" />
          </div>
        </div>
      </StaggerShell>
      <div className="panel-glass overflow-hidden rounded-2xl border border-border/60">
        {Array.from({ length: 4 }, (_, i) => (
          <StaggerShell
            key={`credit-${i}`}
            index={i + 6}
            className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5 last:border-0"
          >
            <Bone className="h-9 w-9 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-3.5 w-[40%] rounded-md" />
              <Bone className="h-3 w-[55%] rounded-md" />
            </div>
            <Bone className="h-4 w-10 rounded-md shrink-0" />
          </StaggerShell>
        ))}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 panel-glass p-4 sm:p-5 min-w-0">
      <div className="flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="leading-snug">{label}</span>
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tabular-nums tracking-tight",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{sub}</p>
      ) : null}
    </div>
  );
}

function CreditRow({ row }: { row: ReferralLedgerEntry }) {
  const meta = eventMeta(row.eventType);
  const Icon = meta.icon;
  const when = formatAwardedAt(row.awardedAt);

  return (
    <li className="flex items-start gap-3 px-4 py-3.5 sm:px-5 min-w-0 hover:bg-muted/20 transition-colors">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{eventLabel(row.eventType)}</p>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", meta.badgeClass)}>
            {meta.pointsHint}
          </Badge>
        </div>
        <p className="font-mono text-xs text-muted-foreground truncate">
          {shortenAddress(row.inviteeWallet, 6)}
          {when ? <span className="text-border mx-1.5">·</span> : null}
          {when ? <span>{when}</span> : null}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums text-primary pt-0.5">
        +{formatPoints(row.points)}
      </p>
    </li>
  );
}

function matchesCreditSearch(row: ReferralLedgerEntry, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    row.inviteeWallet.toLowerCase().includes(q) ||
    eventLabel(row.eventType).toLowerCase().includes(q) ||
    (row.campaignId?.toLowerCase().includes(q) ?? false)
  );
}

function filterCredits(
  rows: ReferralLedgerEntry[],
  filter: CreditFilter,
): ReferralLedgerEntry[] {
  if (filter === "all") return rows;
  return rows.filter((row) => row.eventType === filter);
}

function sortCredits(
  rows: ReferralLedgerEntry[],
  sort: CreditSort,
): ReferralLedgerEntry[] {
  const next = [...rows];
  next.sort((a, b) => {
    const aTime = a.awardedAt ? new Date(a.awardedAt).getTime() : 0;
    const bTime = b.awardedAt ? new Date(b.awardedAt).getTime() : 0;
    switch (sort) {
      case "oldest":
        return aTime - bTime || b.points - a.points;
      case "points_desc":
        return b.points - a.points || bTime - aTime;
      case "points_asc":
        return a.points - b.points || bTime - aTime;
      case "newest":
      default:
        return bTime - aTime || b.points - a.points;
    }
  });
  return next;
}

function ReferralPageContent() {
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const queryClient = useQueryClient();
  const address = wallet.publicKey?.toBase58() ?? null;
  const [draftCode, setDraftCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CreditFilter>("all");
  const [sort, setSort] = useState<CreditSort>("newest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  useEffect(() => {
    if (!wallet.connected || !address) return;
    void claimIfNeeded(address);
  }, [wallet.connected, address]);

  const profileQuery = useQuery({
    queryKey: ["referral-profile", address],
    queryFn: () => fetchReferralProfile(address!),
    enabled: Boolean(address && wallet.connected),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (code: string) =>
      createReferralCode({ wallet: address!, code }),
    onSuccess: () => {
      toast.success("Referral name created");
      void queryClient.invalidateQueries({ queryKey: ["referral-profile", address] });
    },
    onError: (err) => {
      const message =
        err instanceof KolApiError ? err.message : "Could not create referral name";
      toast.error(message);
    },
  });

  const profile = profileQuery.data;
  const recent = useMemo(() => profile?.recent ?? [], [profile?.recent]);

  const filteredSorted = useMemo(() => {
    const searched = recent.filter((row) => matchesCreditSearch(row, debouncedSearch));
    return sortCredits(filterCredits(searched, filter), sort);
  }, [recent, debouncedSearch, filter, sort]);

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredSorted, page, PROFILE_LIST_PAGE_SIZE),
    [filteredSorted, page],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, sort]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  if (!wallet.connected || !address) {
    return (
      <div className={cn(pageContent, "pb-20 min-w-0")}>
        <div className="panel-glass mx-auto mt-8 max-w-lg rounded-2xl border border-border/60 p-6 text-center sm:mt-12 sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Gift className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="heading-section mb-2 text-2xl">Referral</h1>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            Connect your wallet to create a one-time referral name and earn points when invitees
            join campaigns, place top 3, or go live.
          </p>
          <Button variant="hero" className="rounded-full" onClick={() => setVisible(true)}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  const link = shareUrl(profile?.sharePath ?? null, profile?.code ?? null);
  const totalReferralPoints = profile?.referralPoints ?? 0;

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(pageContent, "space-y-8 sm:space-y-10 pb-20 min-w-0")}>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
          <Link to="/profile">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Profile
          </Link>
        </Button>
      </div>

      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl min-w-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/14 via-transparent to-primary/6"
          aria-hidden
        />
        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-5">
          <div className="min-w-0 space-y-2">
            <p className="eyebrow">Invite & earn</p>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                <Gift className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <h1 className="heading-section text-xl min-[400px]:text-2xl sm:text-3xl">
                Referral
              </h1>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              {REFERRAL_POINTS_HINT}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-lg">
            <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3 sm:px-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
                Invited
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {profileQuery.isLoading ? "—" : (profile?.inviteeCount ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3 sm:px-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                Points earned
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
                {profileQuery.isLoading ? "—" : formatPoints(totalReferralPoints)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {profileQuery.isLoading ? (
        <ReferralPageSkeleton />
      ) : profile?.code ? (
        <section className="space-y-5 min-w-0" aria-labelledby="referral-share-heading">
          <h2 id="referral-share-heading" className="sr-only">
            Your referral link
          </h2>

          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 lg:p-7 min-w-0">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              aria-hidden
            />
            <div className="relative space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Your referral name
                  </p>
                  <p className="mt-1 font-mono text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
                    {profile.code}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-md">
                    Locked forever. Share the link below — you earn when invitees take action.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary shrink-0 self-start"
                >
                  Active
                </Badge>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  readOnly
                  value={link}
                  className="font-mono text-sm bg-background/60 border-border/60 min-h-11"
                  aria-label="Referral share link"
                />
                <Button
                  type="button"
                  variant="hero"
                  className="rounded-full shrink-0 min-h-11"
                  onClick={() => void copyLink()}
                >
                  {copied ? (
                    <Check className="mr-1.5 h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Invites"
              value={String(profile.inviteeCount)}
              sub="Wallets that joined via you"
              icon={<Users className="h-3.5 w-3.5" aria-hidden />}
            />
            <StatTile
              label="Join"
              value={formatPoints(profile.totalsByEvent.participation)}
              sub="+0.1 when they complete a campaign"
              icon={<Users className="h-3.5 w-3.5" aria-hidden />}
            />
            <StatTile
              label="Top 3"
              value={formatPoints(profile.totalsByEvent.podium)}
              sub="+0.3 when they finish podium"
              icon={<Trophy className="h-3.5 w-3.5" aria-hidden />}
              accent
            />
            <StatTile
              label="Go-live"
              value={formatPoints(profile.totalsByEvent.creation)}
              sub="+0.5 when they launch a campaign"
              icon={<Rocket className="h-3.5 w-3.5" aria-hidden />}
              accent
            />
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 lg:p-7 space-y-5 min-w-0">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-2">
            <ProfileSectionHeader
              icon={<Gift className="h-4 w-4" />}
              title="Create your referral name"
            />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Choose once — 3–20 characters (letters, numbers, underscore, or hyphen). It cannot
              be changed after create.
            </p>
          </div>
          <form
            className="relative flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const code = draftCode.trim();
              if (!code) {
                toast.error("Enter a referral name");
                return;
              }
              createMutation.mutate(code);
            }}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="referral-name" className="text-xs text-muted-foreground">
                Referral name
              </Label>
              <Input
                id="referral-name"
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value)}
                placeholder="your-name"
                maxLength={20}
                className="font-mono min-h-11 bg-background/60"
                autoComplete="off"
                disabled={createMutation.isPending}
                aria-describedby="referral-name-hint"
              />
              <p id="referral-name-hint" className="text-[11px] text-muted-foreground">
                Example: syra-alpha · Locked forever after create
              </p>
            </div>
            <Button
              type="submit"
              variant="hero"
              className="rounded-full shrink-0 min-h-11"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create name"}
            </Button>
          </form>
        </section>
      )}

      {profile?.code && !profileQuery.isLoading ? (
        <section className="space-y-4 min-w-0">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <ProfileSectionHeader
              icon={<Sparkles className="h-4 w-4" />}
              title="Recent credits"
            />
            <p className="text-xs text-muted-foreground">
              Latest points from your invitees
            </p>
          </div>

          {recent.length === 0 ? (
            <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8 text-center space-y-3 min-w-0">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Users className="h-6 w-6 text-primary" aria-hidden />
              </div>
              <p className="font-medium">No invite credits yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Share your link. You earn when invitees join campaigns, place top 3, or launch
                their own live campaign.
              </p>
              {link ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full mt-1"
                  onClick={() => void copyLink()}
                >
                  {copied ? (
                    <Check className="mr-1.5 h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" aria-hidden />
                  )}
                  Copy invite link
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <ProfileListToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search wallet or event…"
                searchLabel="Search referral credits"
                filter={filter}
                onFilterChange={setFilter}
                filterOptions={CREDIT_FILTER_OPTIONS}
                sort={sort}
                onSortChange={setSort}
                sortOptions={CREDIT_SORT_OPTIONS}
                resultCount={filteredSorted.length}
              />

              {filteredSorted.length === 0 ? (
                <div className="panel-glass rounded-2xl border border-border/60 p-8 text-center space-y-2">
                  <p className="font-medium">No matches</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different search, filter, or sort.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full mt-2"
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                      setSort("newest");
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <div className="panel-glass overflow-hidden rounded-2xl border border-border/60">
                  <ul className="divide-y divide-border/50">
                    {pageItems.map((row) => (
                      <CreditRow key={row.id} row={row} />
                    ))}
                  </ul>
                  <ProfileListPagination
                    page={safePage}
                    totalPages={totalPages}
                    totalCount={filteredSorted.length}
                    onPageChange={setPage}
                    label="Referral credits pagination"
                  />
                </div>
              )}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default function ReferralPage() {
  return (
    <SitePageShell>
      <ReferralPageContent />
    </SitePageShell>
  );
}
