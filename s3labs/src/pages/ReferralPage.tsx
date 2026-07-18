import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Copy, Gift, Users } from "lucide-react";
import { toast } from "sonner";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { ProfileSectionHeader } from "@/components/profile/ProfileSectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createReferralCode,
  fetchReferralProfile,
  KolApiError,
  type ReferralEventType,
} from "@/lib/kolApi";
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

function shareUrl(sharePath: string | null, code: string | null): string {
  if (typeof window === "undefined") {
    return sharePath ? `https://s3labs.xyz${sharePath}` : "";
  }
  const path = sharePath ?? (code ? `/r/${code}` : "");
  return path ? `${window.location.origin}${path}` : "";
}

function ReferralPageContent() {
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const queryClient = useQueryClient();
  const address = wallet.publicKey?.toBase58() ?? null;
  const [draftCode, setDraftCode] = useState("");
  const [copied, setCopied] = useState(false);

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

  if (!wallet.connected || !address) {
    return (
      <div className={cn(pageContent, "pb-20 min-w-0")}>
        <div className="panel-glass mx-auto mt-8 max-w-lg rounded-2xl border border-border/60 p-6 text-center sm:mt-12 sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Gift className="h-7 w-7 text-primary" />
          </div>
          <h1 className="heading-section mb-2 text-2xl">Referral</h1>
          <p className="mb-6 text-sm text-muted-foreground">
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

  const profile = profileQuery.data;
  const link = shareUrl(profile?.sharePath ?? null, profile?.code ?? null);

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(pageContent, "space-y-8 pb-20 min-w-0")}>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
          <Link to="/profile">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Profile
          </Link>
        </Button>
      </div>

      <header className="space-y-2 min-w-0">
        <h1 className="heading-section text-2xl sm:text-3xl">Referral</h1>
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Pick a referral name once — it cannot be changed. You earn points when invitees join
          campaigns (finalize), place top 3, or open a live campaign (deposit).
        </p>
      </header>

      {profileQuery.isLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : profile?.code ? (
        <section className="space-y-4 min-w-0">
          <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-6 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Your referral name
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tracking-tight">{profile.code}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={link}
                className="font-mono text-sm"
                aria-label="Referral share link"
              />
              <Button
                type="button"
                variant="hero"
                className="rounded-full shrink-0"
                onClick={() => void copyLink()}
              >
                {copied ? (
                  <Check className="mr-1.5 h-4 w-4" />
                ) : (
                  <Copy className="mr-1.5 h-4 w-4" />
                )}
                Copy link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            <div className="panel-glass rounded-2xl border border-border/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Invites</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{profile.inviteeCount}</p>
            </div>
            <div className="panel-glass rounded-2xl border border-border/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Join (+0.1)
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatPoints(profile.totalsByEvent.participation)}
              </p>
            </div>
            <div className="panel-glass rounded-2xl border border-border/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Top 3 (+0.3)
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatPoints(profile.totalsByEvent.podium)}
              </p>
            </div>
            <div className="panel-glass rounded-2xl border border-border/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Go-live (+0.5)
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatPoints(profile.totalsByEvent.creation)}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel-glass space-y-4 rounded-2xl border border-border/60 p-5 sm:p-6">
          <ProfileSectionHeader
            icon={<Gift className="h-4 w-4" />}
            title="Create your referral name"
          />
          <p className="text-sm text-muted-foreground">
            3–20 characters: letters, numbers, underscore, or hyphen. Locked forever after create.
          </p>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
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
            <Input
              value={draftCode}
              onChange={(e) => setDraftCode(e.target.value)}
              placeholder="your-name"
              maxLength={20}
              className="font-mono"
              autoComplete="off"
              disabled={createMutation.isPending}
            />
            <Button
              type="submit"
              variant="hero"
              className="rounded-full shrink-0"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create name"}
            </Button>
          </form>
        </section>
      )}

      {profile?.recent?.length ? (
        <section className="space-y-4 min-w-0">
          <ProfileSectionHeader
            icon={<Users className="h-4 w-4" />}
            title="Recent credits"
          />
          <div className="panel-glass overflow-hidden rounded-2xl border border-border/60">
            <ul className="divide-y divide-border/50">
              {profile.recent.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{eventLabel(row.eventType)}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {shortenAddress(row.inviteeWallet, 6)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-primary">
                    +{formatPoints(row.points)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
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
