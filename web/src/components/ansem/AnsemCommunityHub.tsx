import { Copy, ExternalLink, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnsemSectionHeaderSkeleton } from "@/components/ansem/ansemSkeletons";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { ANSEM, ANSEM_MINT, ANSEM_VENUES } from "@/lib/ansem";
import type { AnsemCommunityPayload } from "@/lib/ansemCommunityApi";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { AnsemSectionHeader } from "@/components/ansem/AnsemSectionHeader";

function normalizeTwitterHandle(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().replace(/^@/, "");
  if (!t) return null;
  return t.startsWith("http") ? raw.trim() : `https://x.com/${t}`;
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify.success(`${label} copied`);
  } catch {
    notify.error(`Could not copy ${label.toLowerCase()}`);
  }
}

export function AnsemCommunityHub({
  social,
  isLoading,
  className,
}: {
  social?: AnsemCommunityPayload["social"];
  isLoading?: boolean;
  className?: string;
}) {
  const buyVenues = ANSEM_VENUES.filter((v) => v.kind === "buy");
  const trackVenues = ANSEM_VENUES.filter((v) => v.kind === "track");
  const twitterUrl = normalizeTwitterHandle(social?.twitter) ?? ANSEM_VENUES.find((v) => v.id === "x")?.href;
  const pageUrl = "https://www.syraa.fun/ansem";

  const shareText = encodeURIComponent(`$ANSEM — The Black Bull 🐂\n${pageUrl}`);

  if (isLoading && !social) {
    return (
      <section className={cn("min-w-0 space-y-4", className)}>
        <AnsemSectionHeaderSkeleton />
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <div className={cn(overviewCardShell, "space-y-4 p-5 sm:p-6")}>
            <Skeleton className="h-3 w-24" />
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] rounded-xl" />
              ))}
            </div>
          </div>
          <div className={cn(overviewCardShell, "space-y-4 p-5 sm:p-6")}>
            <Skeleton className="h-3 w-28" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-28 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("min-w-0 space-y-4", className)}>
      <AnsemSectionHeader
        kicker="Community"
        title="Join the herd"
        description="Trade, track, and share $ANSEM with the community."
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className={cn(overviewCardShell, "space-y-5 p-5 sm:p-6")}>
          <div>
            <p className={overviewKickerClass}>Where to buy</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {buyVenues.map((venue) => (
                <a
                  key={venue.id}
                  href={venue.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-border/50 bg-background/30 px-4 py-3 transition-colors hover:border-border hover:bg-muted/25"
                >
                  <div>
                    <p className="font-medium text-foreground">{venue.label}</p>
                    <p className="text-xs text-muted-foreground">{venue.description}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className={overviewKickerClass}>Track on-chain</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {trackVenues.map((venue) => (
                <Button key={venue.id} variant="outline" size="sm" className="rounded-xl" asChild>
                  <a href={venue.href} target="_blank" rel="noopener noreferrer">
                    {venue.label}
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className={cn(overviewCardShell, "space-y-5 p-5 sm:p-6")}>
          {social?.description ? (
            <div>
              <p className={overviewKickerClass}>About</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{social.description}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            <p className={overviewKickerClass}>Share & connect</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => void copyText(ANSEM_MINT, "Contract")}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy contract
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => void copyText(pageUrl, "Page link")}
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Copy page link
              </Button>
              {twitterUrl ? (
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                    Community X
                  </a>
                </Button>
              ) : null}
              <Button variant="neon" size="sm" className="rounded-xl" asChild>
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Post on X
                </a>
              </Button>
            </div>
          </div>

          {(social?.telegram || social?.website) && (
            <div className="flex flex-wrap gap-2">
              {social.telegram ? (
                <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                  <a href={social.telegram} target="_blank" rel="noopener noreferrer">
                    Telegram
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              ) : null}
              {social.website ? (
                <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                  <a href={social.website} target="_blank" rel="noopener noreferrer">
                    Website
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              ) : null}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Mint: <span className="font-mono">{ANSEM_MINT}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
