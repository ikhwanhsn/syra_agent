import { useState, type ReactNode } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { btcCardClass, btcSectionLabelClass } from "@/components/btc/btcStyles";
import { BtcSectionShareModal } from "@/components/btc/share/BtcSectionShareModal";
import { BtcShareExportSkin } from "@/components/btc/share/BtcShareExportSkin";

export interface BtcShareableSectionProps {
  /** Nav anchor id — omit when a parent (e.g. BtcLazySection) owns the anchor. */
  id?: string;
  kicker: string;
  title: string;
  description?: string;
  shareSlug: string;
  shareLines?: string[];
  capturedAt?: string;
  /** Custom share handler (e.g. chart uses dedicated modal). */
  onShare?: () => void;
  shareDisabled?: boolean;
  loading?: boolean;
  empty?: boolean;
  children: ReactNode;
  /** Content rendered in export frame (defaults to children). */
  shareChildren?: ReactNode;
  className?: string;
  bodyClassName?: string;
  accent?: "btc" | "blue" | "neutral";
}

export function BtcShareableSection({
  id,
  kicker,
  title,
  description,
  shareSlug,
  shareLines,
  capturedAt,
  onShare,
  shareDisabled,
  loading,
  empty,
  children,
  shareChildren,
  className,
  bodyClassName,
  accent = "btc",
}: BtcShareableSectionProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const useCustomShare = typeof onShare === "function";

  const handleShare = () => {
    if (shareDisabled || loading || empty) return;
    if (useCustomShare) {
      onShare();
      return;
    }
    setShareOpen(true);
  };

  const accentGradient =
    accent === "blue"
      ? "from-[#2563eb]/80 via-[#2563eb]/30 to-transparent"
      : accent === "neutral"
        ? "from-border/80 via-border/30 to-transparent"
        : "from-[#F7931A]/90 via-[#F7931A]/35 to-transparent";

  return (
    <section
      id={id}
      className={cn(id && "scroll-mt-24", className)}
    >
      <article className={cn(btcCardClass, "group/section overflow-hidden")}>
        <div
          className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-90", accentGradient)}
          aria-hidden
        />

        <header className="relative border-b border-border/40 px-5 py-4 sm:px-6 sm:py-5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-3 top-3 h-9 w-9 rounded-xl border border-transparent",
              "text-muted-foreground transition-all",
              "hover:border-border/60 hover:bg-background/60 hover:text-foreground",
              "sm:opacity-0 sm:group-hover/section:opacity-100 sm:focus-visible:opacity-100",
              (shareDisabled || loading || empty) && "pointer-events-none opacity-30",
            )}
            disabled={shareDisabled || loading || empty}
            onClick={handleShare}
            aria-label={`Share ${title}`}
          >
            <Share2 className="h-4 w-4" aria-hidden />
          </Button>

          <div className="pr-12">
            <p className={btcSectionLabelClass}>{kicker}</p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </header>

        <div className={cn("px-5 py-5 sm:px-6 sm:py-6", bodyClassName)}>
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-muted/20" />
          ) : empty ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
              Data unavailable for this section.
            </div>
          ) : (
            children
          )}
        </div>
      </article>

      {!useCustomShare && !empty && !loading ? (
        <BtcSectionShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          shareSlug={shareSlug}
          kicker={kicker}
          title={title}
          description={description}
          capturedAt={capturedAt}
          shareLines={shareLines}
        >
          <BtcShareExportSkin>{shareChildren ?? children}</BtcShareExportSkin>
        </BtcSectionShareModal>
      ) : null}
    </section>
  );
}
