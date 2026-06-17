import { useCallback, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download, ExternalLink, ImageIcon, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BtcSectionShareFrame } from "@/components/btc/share/BtcSectionShareFrame";
import {
  blobFromBtcChartShare,
  copyBtcChartShareToClipboard,
  exportBtcChartSharePng,
} from "@/components/btc/share/btcChartShareExport";
import {
  buildBtcSectionShareFilename,
  buildBtcSectionShareOnXUrl,
  buildBtcSectionShareText,
  type BtcSectionShareCopyInput,
} from "@/components/btc/share/btcSectionShareCopy";

const PREVIEW_SCALE = 0.48;

interface BtcSectionShareModalProps {
  open: boolean;
  onClose: () => void;
  shareSlug: string;
  kicker: string;
  title: string;
  description?: string;
  capturedAt?: string;
  shareLines?: string[];
  children: ReactNode;
}

export function BtcSectionShareModal({
  open,
  onClose,
  shareSlug,
  kicker,
  title,
  description,
  capturedAt,
  shareLines,
  children,
}: BtcSectionShareModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  const copyInput: BtcSectionShareCopyInput = { kicker, title, description, lines: shareLines };
  const shareText = buildBtcSectionShareText(copyInput);
  const busy = copying || downloading || sharing;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  const handleCopy = useCallback(async () => {
    if (!exportRef.current) return;
    setCopying(true);
    setCopied(false);
    try {
      const ok = await copyBtcChartShareToClipboard(exportRef.current);
      if (ok) {
        setCopied(true);
        toast.success("Card copied — paste on X or Telegram");
        window.setTimeout(() => setCopied(false), 2200);
      } else {
        toast.error("Copy not supported — try Download PNG");
      }
    } catch {
      toast.error("Failed to copy image");
    } finally {
      setCopying(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!exportRef.current) return;
    setDownloading(true);
    try {
      await exportBtcChartSharePng(exportRef.current, buildBtcSectionShareFilename(shareSlug));
      toast.success("PNG downloaded");
    } catch {
      toast.error("Failed to export image");
    } finally {
      setDownloading(false);
    }
  }, [shareSlug]);

  const handleNativeShare = useCallback(async () => {
    if (!exportRef.current) return;
    setSharing(true);
    try {
      const blob = await blobFromBtcChartShare(exportRef.current);
      if (!blob) {
        toast.error("Could not build share image");
        return;
      }
      const file = new File([blob], buildBtcSectionShareFilename(shareSlug), { type: "image/png" });
      const shareData = { files: [file], title: "Syra BTC", text: shareText };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success("Shared");
      } else {
        toast.error("Native share not available — use Copy or Download");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Share failed — try Download PNG");
    } finally {
      setSharing(false);
    }
  }, [shareSlug, shareText]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setTextCopied(true);
      toast.success("Post copy ready");
      window.setTimeout(() => setTextCopied(false), 2200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, [shareText]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(94dvh,880px)] max-w-2xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-4 w-4 text-[#F7931A]" aria-hidden />
            Share card
          </DialogTitle>
          <DialogDescription>Export this insight as a branded PNG for social.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="mx-auto w-fit overflow-hidden rounded-xl border border-border/60 shadow-inner">
            <div style={{ width: 1000 * PREVIEW_SCALE }} className="overflow-hidden">
              <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}>
                <BtcSectionShareFrame
                  kicker={kicker}
                  title={title}
                  description={description}
                  capturedAt={capturedAt}
                >
                  {children}
                </BtcSectionShareFrame>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button type="button" className="rounded-xl" onClick={() => void handleCopy()} disabled={busy}>
              {copying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : copied ? (
                <Check className="mr-2 h-4 w-4" aria-hidden />
              ) : (
                <Copy className="mr-2 h-4 w-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy image"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void handleDownload()}
              disabled={busy}
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="mr-2 h-4 w-4" aria-hidden />
              )}
              Download PNG
            </Button>
            {canNativeShare ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => void handleNativeShare()}
                disabled={busy}
              >
                {sharing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" aria-hidden />
                )}
                Share…
              </Button>
            ) : null}
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Post copy
            </p>
            <pre className="max-h-24 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
              {shareText}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-lg" asChild>
                <a href={buildBtcSectionShareOnXUrl(shareText)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" aria-hidden />
                  Open on X
                </a>
              </Button>
              <Button type="button" size="sm" className="rounded-lg" onClick={() => void handleCopyText()}>
                {textCopied ? (
                  <Check className="mr-2 h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="mr-2 h-3.5 w-3.5" aria-hidden />
                )}
                {textCopied ? "Copied" : "Copy post text"}
              </Button>
            </div>
          </div>
        </div>

        <div aria-hidden className="pointer-events-none fixed left-[-9999px] top-0 opacity-0">
          <BtcSectionShareFrame
            ref={exportRef}
            kicker={kicker}
            title={title}
            description={description}
            capturedAt={capturedAt}
          >
            {children}
          </BtcSectionShareFrame>
        </div>
      </DialogContent>
    </Dialog>
  );
}
