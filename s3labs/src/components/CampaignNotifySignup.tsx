import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bell, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { subscribeCampaignNotifications } from "@/lib/kolApi";
import {
  getSubscribedCampaignEmail,
  setSubscribedCampaignEmail,
} from "@/lib/campaignEmailSubscription";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CampaignNotifySignupProps {
  /** Compact inline layout for footer and tight spaces. */
  compact?: boolean;
  /** Analytics source tag sent to the API. */
  source?: string;
  className?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CampaignNotifySignup({
  compact = false,
  source = "kol_page",
  className,
}: CampaignNotifySignupProps) {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    setIsSubscribed(Boolean(getSubscribedCampaignEmail()));
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: () => {
      const trimmed = email.trim();
      if (!trimmed) throw new Error("Enter your email address");
      if (!EMAIL_RE.test(trimmed)) throw new Error("Enter a valid email address");
      return subscribeCampaignNotifications(trimmed, source);
    },
    onSuccess: (_data, _vars, _ctx) => {
      const trimmed = email.trim().toLowerCase();
      setSubscribedCampaignEmail(trimmed);
      setIsSubscribed(true);
      toast.success("You're subscribed", {
        description: "We'll email you when new KOL campaigns go live.",
      });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (isSubscribed === null || isSubscribed) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary shrink-0" />
          <h4 className="text-sm font-semibold text-foreground">Campaign alerts</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Get notified when new KOL campaigns go live — never miss a reward pool.
        </p>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            subscribeMutation.mutate();
          }}
        >
          <Label htmlFor="notify-email-compact" className="sr-only">
            Email address
          </Label>
          <Input
            id="notify-email-compact"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribeMutation.isPending}
            className="h-10 rounded-xl bg-background/60 border-border/70"
          />
          <Button
            type="submit"
            variant="hero"
            className="rounded-full h-10 w-full"
            disabled={subscribeMutation.isPending}
          >
            {subscribeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Subscribe"
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "panel-glass rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent p-5 sm:p-8 overflow-hidden relative",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
        <div className="min-w-0 flex-1 max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <p className="eyebrow">Stay ahead</p>
          </div>
          <h2 className="heading-section">Get notified on new campaigns</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Be the first to know when Solana projects launch KOL reward pools.
            One email per new campaign — reward size, duration, and a direct link
            to participate.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Professional email alerts
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Unsubscribe anytime
            </span>
          </div>
        </div>

        <form
          className="w-full lg:max-w-sm shrink-0 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            subscribeMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="notify-email" className="text-sm">
              Work email
            </Label>
            <Input
              id="notify-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={subscribeMutation.isPending}
              className="h-11 rounded-xl bg-background/60 border-border/70"
            />
          </div>
          <Button
            type="submit"
            variant="hero"
            className="rounded-full w-full h-11"
            disabled={subscribeMutation.isPending}
          >
            {subscribeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Subscribing…
              </>
            ) : (
              "Subscribe to campaign alerts"
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            From S3Labs. No spam — only new marketplace campaigns.
          </p>
        </form>
      </div>
    </section>
  );
}
