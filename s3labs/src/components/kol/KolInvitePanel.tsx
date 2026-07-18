import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { fetchKols } from "@/lib/kolApi";
import {
  buildKolInviteIntentUrl,
  buildKolInviteText,
  campaignPublicUrl,
} from "@/lib/kolInvite";
import { formatCompact } from "@/lib/kolFormat";

interface KolInvitePanelProps {
  campaignId?: string;
  campaignTitle: string;
  brief?: string;
  /** Compact embed for create form (no campaign id yet). */
  previewMode?: boolean;
}

export function KolInvitePanel({
  campaignId,
  campaignTitle,
  brief,
  previewMode = false,
}: KolInvitePanelProps) {
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  const kolsQuery = useQuery({
    queryKey: ["kol-invite-directory"],
    queryFn: () => fetchKols({ limit: 8, sort: "score" }),
    staleTime: 5 * 60_000,
  });

  const campaignUrl = useMemo(
    () => (campaignId ? campaignPublicUrl(campaignId) : "https://s3labs.xyz/kol"),
    [campaignId],
  );

  const kols = kolsQuery.data?.kols ?? [];

  const copyInvite = async (handle: string) => {
    const text = buildKolInviteText({
      campaignTitle: campaignTitle || "S3 Labs campaign",
      campaignUrl,
      brief,
      handle,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHandle(handle);
      toast.success(`Invite copied for @${handle}`);
      setTimeout(() => setCopiedHandle(null), 2000);
    } catch {
      toast.error("Could not copy invite");
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <UserPlus className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <div>
          <h3 className="font-semibold tracking-tight text-sm sm:text-base">
            Invite top KOLs
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {previewMode
              ? "After your campaign goes live, DM these earners with a one-tap invite."
              : "Copy an invite or open X with a prefilled message — best engagers from the marketplace."}
          </p>
        </div>
      </div>

      {kolsQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading KOL directory…</p>
      ) : kols.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No KOL rankings yet — share your campaign link in Telegram / X.
        </p>
      ) : (
        <ul className="space-y-2">
          {kols.map((kol) => {
            const handle = kol.handle || "";
            if (!handle) return null;
            const inviteText = buildKolInviteText({
              campaignTitle: campaignTitle || "S3 Labs campaign",
              campaignUrl,
              brief,
              handle,
            });
            return (
              <li
                key={handle}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/50 bg-background/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">@{handle}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    Rep {formatCompact(kol.reputationScore)} · earned{" "}
                    {formatCompact(kol.earnedSol)} SOL
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full h-8 text-xs gap-1"
                    onClick={() => copyInvite(handle)}
                  >
                    <Copy className="h-3 w-3" />
                    {copiedHandle === handle ? "Copied" : "Copy"}
                  </Button>
                  {!previewMode ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-full h-8 text-xs gap-1"
                      asChild
                    >
                      <a
                        href={buildKolInviteIntentUrl(inviteText)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        X
                      </a>
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
