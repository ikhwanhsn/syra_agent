import { useCallback, useRef, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
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
  KolProfileShareCard,
  type KolProfileShareCardData,
} from "@/components/profile/KolProfileShareCard";
import {
  buildKolProfileShareFilename,
  buildKolProfileShareTweetText,
  copyKolRankShareToClipboard,
  exportKolRankSharePng,
} from "@/components/kol/kolRankShareExport";
import { resolveProfileShareHero } from "@/lib/profileShareData";
import { cn } from "@/lib/utils";

interface KolProfileShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KolProfileShareCardData | null;
  thirdPerson?: boolean;
}

export function KolProfileShareDialog({
  open,
  onOpenChange,
  data,
  thirdPerson = false,
}: KolProfileShareDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"copy" | "download" | null>(null);

  const shareUrl = data?.shareUrl ?? "";
  const hero = data ? resolveProfileShareHero(data) : { label: "", value: "" };

  const shareText =
    data != null
      ? buildKolProfileShareTweetText(
          data.handle,
          hero.label,
          hero.value,
          data.earnedSol,
          data.totalPoints,
          shareUrl,
          { thirdPerson, displayName: data.displayName },
        )
      : "";

  const handleDownload = useCallback(async () => {
    const node = cardRef.current;
    if (!node || !data) return;
    setBusy("download");
    try {
      await exportKolRankSharePng(node, buildKolProfileShareFilename(data.handle));
      toast.success("Profile card downloaded");
    } catch {
      toast.error("Download failed — try again");
    } finally {
      setBusy(null);
    }
  }, [data]);

  const handleCopyImage = useCallback(async () => {
    const node = cardRef.current;
    if (!node || !data) return;

    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("Copy requires HTTPS");
      return;
    }

    setBusy("copy");
    try {
      const ok = await copyKolRankShareToClipboard(node);
      if (ok) {
        toast.success("Image copied — paste into X, Telegram, or Discord");
      } else {
        toast.error("Copy not supported in this browser — use Download");
      }
    } catch {
      toast.error("Copy failed — try Download instead");
    } finally {
      setBusy(null);
    }
  }, [data]);

  const openX = useCallback(() => {
    const q = new URLSearchParams({ text: shareText });
    window.open(`https://twitter.com/intent/tweet?${q.toString()}`, "_blank", "noopener,noreferrer");
  }, [shareText]);

  const openTelegram = useCallback(() => {
    const q = new URLSearchParams({ url: shareUrl, text: shareText });
    window.open(`https://t.me/share/url?${q.toString()}`, "_blank", "noopener,noreferrer");
  }, [shareText, shareUrl]);

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleNativeShare = useCallback(async () => {
    if (!canNativeShare || !data) return;
    try {
      await navigator.share({
        title: `${data.displayName} — S3 Labs KOL Profile`,
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      toast.error("Share failed");
    }
  }, [canNativeShare, data, shareText, shareUrl]);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[95vh] max-w-[min(96vw,720px)] overflow-y-auto border-border/60 bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6",
        )}
      >
        <DialogHeader className="space-y-1 pr-8 text-left">
          <DialogTitle className="text-xl tracking-tight">Share profile card</DialogTitle>
          <DialogDescription>
            16:9 reputation card — flex your score, points, and earnings on X, Telegram, and Discord.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 flex justify-center overflow-x-auto px-1 py-2">
          <KolProfileShareCard ref={cardRef} data={data} previewScale={0.36} />
        </div>

        <DialogFooter className="mt-2 flex-col gap-0 sm:flex-col">
          <div className="grid w-full grid-cols-2 gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-10 gap-2 rounded-xl"
              disabled={busy !== null}
              onClick={() => void handleCopyImage()}
            >
              <Copy className="h-4 w-4 shrink-0" aria-hidden />
              {busy === "copy" ? "Copying…" : "Copy image"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 gap-2 rounded-xl"
              disabled={busy !== null}
              onClick={() => void handleDownload()}
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              {busy === "download" ? "Saving…" : "Download PNG"}
            </Button>
            {canNativeShare ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-10 gap-2 rounded-xl"
                onClick={() => void handleNativeShare()}
              >
                <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                Share…
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-xl"
              onClick={openX}
            >
              Post on X
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-10 gap-2 rounded-xl", !canNativeShare && "col-span-2")}
              onClick={openTelegram}
            >
              Telegram
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
