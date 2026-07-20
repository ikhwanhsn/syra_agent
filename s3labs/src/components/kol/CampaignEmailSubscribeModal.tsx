import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KolApiError, subscribeEmail } from "@/lib/kolApi";
import {
  hasKolEmailSubscribed,
  markKolEmailSubscribed,
} from "@/lib/kolEmailSubscribeStorage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CampaignEmailSubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignEmailSubscribeModal({
  open,
  onOpenChange,
}: CampaignEmailSubscribeModalProps) {
  const [email, setEmail] = useState("");

  const subscribeMutation = useMutation({
    mutationFn: async (value: string) =>
      subscribeEmail(value.trim().toLowerCase(), "kol_submit_modal"),
    onSuccess: (data) => {
      markKolEmailSubscribed();
      setEmail("");
      onOpenChange(false);
      if (data.isNew && data.welcomeEmailSent) {
        toast.success("Subscribed", {
          description: "Check your inbox for a confirmation email.",
        });
      } else if (data.isNew) {
        toast.success("Subscribed", {
          description: "You're on the list for campaign and mission alerts.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mx-auto sm:mx-0 mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
            <Mail className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <DialogTitle>Get email alerts</DialogTitle>
          <DialogDescription className="leading-relaxed">
            You’re on the board. Subscribe to get an email when new KOL campaigns
            or S3Labs missions go live — with a direct link to join or earn points.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kol-submit-subscribe-email">Email</Label>
            <Input
              id="kol-submit-subscribe-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={subscribeMutation.isPending}
              className="h-11 rounded-xl border-border/60 bg-background/80"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              disabled={subscribeMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Not now
            </Button>
            <Button
              type="submit"
              variant="hero"
              className="rounded-full"
              disabled={subscribeMutation.isPending || !email.trim()}
            >
              {subscribeMutation.isPending ? "Subscribing…" : "Subscribe"}
            </Button>
          </DialogFooter>
        </form>

        <p className="text-[11px] text-muted-foreground text-center sm:text-left leading-relaxed">
          Unsubscribe anytime from the link in every email.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** True when we should prompt for email subscribe after a successful post submit. */
export function shouldPromptKolEmailSubscribe(): boolean {
  return !hasKolEmailSubscribed();
}
