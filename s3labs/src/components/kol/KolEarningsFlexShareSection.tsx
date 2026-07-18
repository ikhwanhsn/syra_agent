import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Flame, Share2 } from "lucide-react";
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
import {
  KolEarningsFlexShareCard,
  type KolEarningsFlexShareCardData,
} from "@/components/kol/KolEarningsFlexShareCard";
import {
  buildKolEarningsCheckUrl,
  buildKolEarningsFlexFilename,
  buildKolEarningsFlexTweetText,
  copyKolRankShareToClipboard,
  exportKolRankSharePng,
  KOL_RANK_SHARE_HEIGHT,
  KOL_RANK_SHARE_WIDTH,
} from "@/components/kol/kolRankShareExport";
import type { KolHandleEarnings } from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

function toFlexCardData(data: KolHandleEarnings): KolEarningsFlexShareCardData {
  return {
    handle: data.handle,
    displayName: data.name || data.handle,
    verified: data.verified,
    profilePicture: data.profilePicture,
    followers: data.followers,
    totalEarnedSol: data.totals.totalEarnedSol,
    paidSol: data.totals.paidSol,
    projectedSol: data.totals.projectedSol,
    campaignCount: data.campaignCount,
    submissionCount: data.submissionCount,
    reputationScore: data.reputationScore,
    shareUrl: buildKolEarningsCheckUrl(data.handle),
  };
}

interface KolEarningsFlexShareSectionProps {
  data: KolHandleEarnings;
}

export function KolEarningsFlexShareSection({ data }: KolEarningsFlexShareSectionProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const previewSlotRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"copy" | "download" | null>(null);
  const [previewScale, setPreviewScale] = useState(0.35);

  const cardData = useMemo(() => toFlexCardData(data), [data]);
  const shareUrl = cardData.shareUrl;
  const shareText = useMemo(
    () =>
      buildKolEarningsFlexTweetText({
        handle: data.handle,
        displayName: data.name,
        totalEarnedSol: data.totals.totalEarnedSol,
        campaignCount: data.campaignCount,
        url: shareUrl,
        firstPerson: false,
      }),
    [data.campaignCount, data.handle, data.name, data.totals.totalEarnedSol, shareUrl],
  );

  useEffect(() => {
    if (!open) return;
    const slot = previewSlotRef.current;
    if (!slot) return;

    const updateScale = () => {
      const width = slot.clientWidth;
      if (width <= 0) return;
      // Fit to full modal width; only shrink further if height would force scroll.
      const chromeBudget = 148;
      const maxHeight = Math.max(140, window.innerHeight * 0.9 - chromeBudget);
      const next = Math.min(
        width / KOL_RANK_SHARE_WIDTH,
        maxHeight / KOL_RANK_SHARE_HEIGHT,
        1,
      );
      setPreviewScale(Math.max(0.16, next));
    };

    // Wait one frame so dialog layout is settled before measuring.
    const raf = requestAnimationFrame(updateScale);
    const ro = new ResizeObserver(updateScale);
    ro.observe(slot);
    window.addEventListener("resize", updateScale);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [open]);

  const handleDownload = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;
    setBusy("download");
    try {
      await exportKolRankSharePng(node, buildKolEarningsFlexFilename(data.handle));
      toast.success("Flex card downloaded");
    } catch {
      toast.error("Download failed — try again");
    } finally {
      setBusy(null);
    }
  }, [data.handle]);

  const handleCopyImage = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("Copy requires HTTPS (or localhost)");
      return;
    }
    setBusy("copy");
    try {
      const ok = await copyKolRankShareToClipboard(node);
      if (ok) {
        toast.success("Image copied — paste into X or Discord");
        return;
      }
      await exportKolRankSharePng(node, buildKolEarningsFlexFilename(data.handle));
      toast.message("Clipboard blocked — PNG downloaded instead");
    } catch {
      toast.error("Copy failed — try Download PNG");
    } finally {
      setBusy(null);
    }
  }, [data.handle]);

  const openX = useCallback(() => {
    const q = new URLSearchParams({ text: shareText });
    window.open(`https://twitter.com/intent/tweet?${q.toString()}`, "_blank", "noopener,noreferrer");
  }, [shareText]);

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleNativeShare = useCallback(async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `${data.name} on S3 Labs`,
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      toast.error("Share failed");
    }
  }, [canNativeShare, data.name, shareText, shareUrl]);

  const headlineSol = data.totals.totalEarnedSol;

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-primary/25",
          "bg-gradient-to-br from-primary/[0.12] via-background/80 to-background",
          "shadow-elevated",
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Flame className="h-3 w-3" aria-hidden />
              Flex card
            </div>
            <h3 className="heading-section text-2xl sm:text-3xl tracking-tight">
              Share @{data.handle}&apos;s{" "}
              <span className="text-gradient">{formatSol(headlineSol)} SOL</span> receipts
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              Drop a 16:9 card on X — real campaigns, real SOL, S3 Labs KOL Arena. Drive the next
              wave of KOLs to check their bag.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 sm:flex-row sm:flex-wrap lg:flex-col xl:flex-row">
            <Button
              type="button"
              variant="hero"
              className="btn-premium rounded-full gap-2 w-full sm:w-auto"
              onClick={() => setOpen(true)}
            >
              <Share2 className="h-4 w-4" />
              Open flex card
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full gap-2 w-full sm:w-auto"
              onClick={openX}
            >
              Post on X
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "flex w-[min(96vw,880px)] max-w-[min(96vw,880px)] flex-col gap-2.5 overflow-hidden border-border/60 bg-background/95 p-3.5 shadow-2xl backdrop-blur-xl sm:gap-3 sm:p-4",
            "h-auto max-h-[min(92dvh,calc(100dvh-4.5rem))]",
            "top-[calc(50%+0.35rem)] sm:top-[50%]",
          )}
        >
          <DialogHeader className="shrink-0 space-y-0 pr-8 text-left">
            <DialogTitle className="text-base tracking-tight sm:text-lg">
              Earnings flex card
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              @{data.handle} · copy or download for X
            </DialogDescription>
          </DialogHeader>

          <div ref={previewSlotRef} className="w-full shrink-0 overflow-hidden rounded-lg">
            <KolEarningsFlexShareCard
              ref={cardRef}
              data={cardData}
              previewScale={previewScale}
              className="mx-auto block max-w-full rounded-lg shadow-elevated ring-1 ring-white/10"
            />
          </div>

          <DialogFooter className="mt-0 shrink-0 flex-col gap-0 sm:flex-col">
            <div
              className={cn(
                "grid w-full gap-2",
                canNativeShare ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3",
              )}
            >
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-9 gap-2 rounded-xl text-sm"
                disabled={busy !== null}
                onClick={() => void handleCopyImage()}
              >
                <Copy className="h-4 w-4 shrink-0" aria-hidden />
                {busy === "copy" ? "Copying…" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 gap-2 rounded-xl text-sm"
                disabled={busy !== null}
                onClick={() => void handleDownload()}
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                {busy === "download" ? "Saving…" : "Download"}
              </Button>
              {canNativeShare ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 gap-2 rounded-xl text-sm"
                  onClick={() => void handleNativeShare()}
                >
                  <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                  Share
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl text-sm"
                onClick={openX}
              >
                Post on X
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
