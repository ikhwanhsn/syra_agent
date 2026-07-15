import { useCallback, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { KolCampaign } from "@/lib/kolApi";
import { buildAdminCampaignAnnounceText } from "@/lib/kolCampaignAnnounce";

interface AdminCampaignAnnounceCopyProps {
  campaign: KolCampaign;
}

export function AdminCampaignAnnounceCopy({
  campaign,
}: AdminCampaignAnnounceCopyProps) {
  const [copied, setCopied] = useState(false);

  const text = buildAdminCampaignAnnounceText(campaign);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("X post text copied", {
        description: "Paste it into a new post on X.",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn’t copy text");
    }
  }, [text]);

  const handleOpenX = useCallback(() => {
    const q = new URLSearchParams({ text });
    window.open(
      `https://twitter.com/intent/tweet?${q.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [text]);

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-primary/90">Admin</p>
          <h3 className="font-semibold tracking-tight">Announce on X</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Copy ready-to-post text that a new campaign is available.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button
            type="button"
            variant="hero"
            size="sm"
            className="rounded-full gap-2"
            onClick={() => void handleCopy()}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy text
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full gap-2"
            onClick={handleOpenX}
          >
            Post on X
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </Button>
        </div>
      </div>
      <pre className="max-h-40 overflow-auto rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs text-muted-foreground whitespace-pre-wrap break-words font-sans leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
