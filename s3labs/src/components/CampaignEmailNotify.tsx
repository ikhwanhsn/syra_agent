import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KolApiError, subscribeEmail } from "@/lib/kolApi";
import { markKolEmailSubscribed } from "@/lib/kolEmailSubscribeStorage";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CampaignEmailNotifyProps {
  /** Compact inline layout for footer and tight spaces. */
  compact?: boolean;
  className?: string;
}

export function CampaignEmailNotify({
  compact = false,
  className,
}: CampaignEmailNotifyProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async (value: string) =>
      subscribeEmail(value.trim().toLowerCase(), "kol_page"),
    onSuccess: (data) => {
      setSubmitted(true);
      setEmail("");
      markKolEmailSubscribed();
      if (data.isNew && data.welcomeEmailSent) {
        toast.success("Subscribed", {
          description: "Check your inbox for a confirmation email.",
        });
      } else if (data.isNew) {
        toast.success("Subscribed", {
          description:
            "You're on the list. Welcome email may arrive shortly.",
        });
      } else {
        toast.success("Already subscribed", {
          description:
            "You'll keep getting alerts when new campaigns and missions go live.",
        });
      }
    },
    onError: (e: Error) => {
      toast.error(
        e instanceof KolApiError ? e.message : "Could not subscribe",
      );
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    subscribeMutation.mutate(trimmed);
  };

  const form = (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col sm:flex-row gap-2", compact && "w-full")}
    >
      <Input
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={subscribeMutation.isPending}
        className="rounded-full h-11 bg-background/80"
        aria-label="Email address"
      />
      <Button
        type="submit"
        variant="hero"
        className="rounded-full h-11 shrink-0 px-6"
        disabled={subscribeMutation.isPending || !email.trim()}
      >
        {subscribeMutation.isPending ? "Subscribing…" : "Subscribe"}
      </Button>
    </form>
  );

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          <h4 className="text-sm font-semibold text-foreground">
            Email alerts
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Get an email when a new KOL campaign or S3Labs mission goes live.
        </p>
        {submitted ? (
          <p className="text-xs text-primary font-medium">
            You&apos;re subscribed. Watch your inbox.
          </p>
        ) : (
          form
        )}
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
        className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
        <div className="min-w-0 flex-1 max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <p className="eyebrow">Email alerts</p>
          </div>
          <h2 className="heading-section">Get notified by email</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Subscribe once — we email you when a new KOL campaign or S3Labs mission
            goes live, with a direct link to join or earn points.
          </p>
        </div>

        <div className="w-full lg:max-w-md shrink-0 space-y-3">
          {submitted ? (
            <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm text-foreground">
              You&apos;re on the list. New campaigns and missions will hit your inbox.
            </div>
          ) : (
            form
          )}
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Unsubscribe anytime from the link in every email.
          </p>
        </div>
      </div>
    </section>
  );
}
