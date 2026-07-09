import { ExternalLink, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TELEGRAM_COMMUNITY_URL = "https://t.me/s3labs";

interface CampaignTelegramNotifyProps {
  /** Compact inline layout for footer and tight spaces. */
  compact?: boolean;
  className?: string;
}

export function CampaignTelegramNotify({
  compact = false,
  className,
}: CampaignTelegramNotifyProps) {
  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-primary shrink-0" />
          <h4 className="text-sm font-semibold text-foreground">Campaign alerts</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          New KOL campaigns are posted in our Telegram community — join to get
          notified when reward pools go live.
        </p>
        <Button
          asChild
          variant="hero"
          className="rounded-full h-10 w-full"
        >
          <a
            href={TELEGRAM_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join t.me/s3labs
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
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
              <Send className="h-4 w-4 text-primary" />
            </div>
            <p className="eyebrow">Stay ahead</p>
          </div>
          <h2 className="heading-section">Get notified on Telegram</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Every new KOL campaign is posted automatically in the S3Labs Telegram
            group — reward pool, duration, and a direct link to participate.
          </p>
        </div>

        <div className="w-full lg:max-w-sm shrink-0 space-y-3">
          <Button asChild variant="hero" className="rounded-full w-full h-11">
            <a
              href={TELEGRAM_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join t.me/s3labs
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            No signup form — just join the community and turn on notifications.
          </p>
        </div>
      </div>
    </section>
  );
}
