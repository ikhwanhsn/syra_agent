import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, ImageIcon, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PumpfunCallShareDesignPicker } from "@/components/pumpfun/PumpfunCallShareDesignPicker";
import { PumpfunCallShareCard } from "@/components/pumpfun/PumpfunCallShareCard";
import { PumpfunCallSharePreview } from "@/components/pumpfun/PumpfunCallSharePreview";
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
import { notify } from "@/lib/notify";

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
    if (!exportRef.current) {
      notify.error("Card not ready", "Try again in a moment");
      return;
    }
    if (copying) return;
    setCopying(true);
    setCopied(false);
    try {
      const ok = await copyPumpfunCallShareToClipboard(exportRef.current);
      if (ok) {
        setCopied(true);
        notify.success("Image copied", "Paste on X or Telegram");
        window.setTimeout(() => setCopied(false), 2200);
      } else {
        notify.error("Copy not supported", "Try Download PNG instead");
      }
    } catch {
      notify.error("Failed to copy image", "Try Download PNG instead");
    } finally {
      setCopying(false);
    }
  }, [copying]);

  const handleDownload = useCallback(async () => {
    if (!exportRef.current) {
      notify.error("Card not ready", "Try again in a moment");
      return;
    }
    if (downloading) return;
    setDownloading(true);
    try {
      await exportPumpfunCallSharePng(
        exportRef.current,
        buildPumpfunCallShareFilename(record.symbol, record.callId),
      );
      notify.success("PNG downloaded", "Check your downloads folder");
    } catch {
      notify.error("Failed to export image", "Try again in a moment");
    } finally {
      setDownloading(false);
    }
  }, [downloading, record.callId, record.symbol]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setTextCopied(true);
      notify.success("Caption copied", "Paste after attaching the image");
      window.setTimeout(() => setTextCopied(false), 2200);
    } catch {
      notify.error("Failed to copy caption");
    }
  }, [shareText]);

  const handleNativeShare = useCallback(async () => {
    const node = exportRef.current;
    if (!node || !canNativeShare || sharing) return;
    setSharing(true);
    try {
      const blob = await blobFromPumpfunCallShare(node);
      if (
        blob &&
        navigator.canShare?.({
          files: [new File([blob], "call.png", { type: "image/png" })],
        })
      ) {
        const file = new File([blob], `syra-${record.symbol}-call.png`, { type: "image/png" });
        await navigator.share({ title: `$${record.symbol} call`, text: shareText, files: [file] });
        notify.success("Shared");
      } else {
        await navigator.share({ title: `$${record.symbol} call`, text: shareText });
        notify.success("Shared");
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        notify.error("Share failed", "Try Copy or Download instead");
      }
    } finally {
      setSharing(false);
    }
  }, [canNativeShare, record.symbol, shareText, sharing]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-3.5 sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-4 w-4 text-emerald-400" aria-hidden />
              Flex your call
            </DialogTitle>
            <DialogDescription>
              Pick a card design, then copy or download for X.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 p-4 sm:p-5">
            <PumpfunCallShareDesignPicker value={design} onChange={handleDesignChange} compact />

            {open ? <PumpfunCallSharePreview record={record} design={design} /> : null}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" className="rounded-xl" onClick={() => void handleCopy()} disabled={busy}>
              {copying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : copied ? (
                <Check className="mr-2 h-4 w-4" />
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
      </DialogContent>
    </Dialog>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div ref={exportRef} className="pumpfun-call-share-export-root" aria-hidden>
              <PumpfunCallShareCard record={record} design={design} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
