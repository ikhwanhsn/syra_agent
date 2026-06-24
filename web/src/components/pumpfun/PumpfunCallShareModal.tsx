import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Download, ImageIcon, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PumpfunCallShareCard } from "@/components/pumpfun/PumpfunCallShareCard";
import { PumpfunCallShareDesignPicker } from "@/components/pumpfun/PumpfunCallShareDesignPicker";
import {
  blobFromPumpfunCallShare,
  buildPumpfunCallShareFilename,
  copyPumpfunCallShareToClipboard,
  exportPumpfunCallSharePng,
} from "@/components/pumpfun/pumpfunCallShareExport";
import {
  getStoredPumpfunShareDesign,
  setStoredPumpfunShareDesign,
  type PumpfunCallShareDesignId,
} from "@/components/pumpfun/pumpfunCallShareDesigns";
import {
  buildPumpfunCallShareText,
  type PumpfunScanRecord,
} from "@/lib/pumpfunScanHistoryApi";
import {
  PUMPFUN_CALL_SHARE_HEIGHT,
  PUMPFUN_CALL_SHARE_PREVIEW_WIDTH,
  PUMPFUN_CALL_SHARE_WIDTH,
} from "@/components/pumpfun/pumpfunCallShareDimensions";

/** Fit 16:9 card inside modal preview. */
const PREVIEW_SCALE = PUMPFUN_CALL_SHARE_PREVIEW_WIDTH / PUMPFUN_CALL_SHARE_WIDTH;

export interface PumpfunCallShareModalProps {
  open: boolean;
  onClose: () => void;
  record: PumpfunScanRecord;
  initialDesign?: PumpfunCallShareDesignId;
}

export function PumpfunCallShareModal({
  open,
  onClose,
  record,
  initialDesign,
}: PumpfunCallShareModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [design, setDesign] = useState<PumpfunCallShareDesignId>(
    initialDesign ?? getStoredPumpfunShareDesign(),
  );
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  useEffect(() => {
    if (open && initialDesign) {
      setDesign(initialDesign);
    }
  }, [open, initialDesign]);

  const shareText = buildPumpfunCallShareText(record);
  const busy = copying || downloading || sharing;
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleDesignChange = useCallback((next: PumpfunCallShareDesignId) => {
    setDesign(next);
    setStoredPumpfunShareDesign(next);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  const handleCopy = useCallback(async () => {
    if (!exportRef.current) return;
    setCopying(true);
    setCopied(false);
    try {
      const ok = await copyPumpfunCallShareToClipboard(exportRef.current);
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
      await exportPumpfunCallSharePng(
        exportRef.current,
        buildPumpfunCallShareFilename(record.symbol, record.callId),
      );
      toast.success("PNG downloaded");
    } catch {
      toast.error("Failed to export image");
    } finally {
      setDownloading(false);
    }
  }, [record.callId, record.symbol]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setTextCopied(true);
      toast.success("Caption copied");
      window.setTimeout(() => setTextCopied(false), 2200);
    } catch {
      toast.error("Failed to copy caption");
    }
  }, [shareText]);

  const handleNativeShare = useCallback(async () => {
    if (!exportRef.current || !canNativeShare) return;
    setSharing(true);
    try {
      const blob = await blobFromPumpfunCallShare(exportRef.current);
      if (
        blob &&
        navigator.canShare?.({
          files: [new File([blob], "call.png", { type: "image/png" })],
        })
      ) {
        const file = new File([blob], `syra-${record.symbol}-call.png`, { type: "image/png" });
        await navigator.share({ title: `$${record.symbol} call`, text: shareText, files: [file] });
      } else {
        await navigator.share({ title: `$${record.symbol} call`, text: shareText });
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error("Share failed");
      }
    } finally {
      setSharing(false);
    }
  }, [canNativeShare, record.symbol, shareText]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(94dvh,900px)] max-w-3xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-4 w-4 text-emerald-400" aria-hidden />
            Flex your call
          </DialogTitle>
          <DialogDescription>
            Pick a card design, then copy or download for X.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4 sm:p-5">
          <PumpfunCallShareDesignPicker value={design} onChange={handleDesignChange} compact />

          <div
            className="mx-auto w-full overflow-hidden rounded-lg border border-border/60 shadow-2xl"
            style={{ maxWidth: PUMPFUN_CALL_SHARE_PREVIEW_WIDTH }}
          >
            <div
              style={{
                width: PUMPFUN_CALL_SHARE_WIDTH * PREVIEW_SCALE,
                height: PUMPFUN_CALL_SHARE_HEIGHT * PREVIEW_SCALE,
              }}
              className="overflow-hidden"
            >
              <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}>
                <PumpfunCallShareCard record={record} design={design} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" className="rounded-xl" onClick={() => void handleCopy()} disabled={busy}>
              {copying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy image"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void handleDownload()}
              disabled={busy}
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PNG
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void handleCopyText()}
              disabled={busy}
            >
              <Copy className="mr-2 h-4 w-4" />
              {textCopied ? "Caption copied!" : "Copy caption"}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Share
              </Button>
            ) : null}
          </div>
        </div>

        {open ? (
          <div
            aria-hidden
            className="pointer-events-none fixed left-[-9999px] top-0 opacity-0"
            style={{ width: PUMPFUN_CALL_SHARE_WIDTH, height: PUMPFUN_CALL_SHARE_HEIGHT }}
          >
            <PumpfunCallShareCard ref={exportRef} record={record} design={design} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
