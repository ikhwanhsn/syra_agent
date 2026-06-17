import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { BtcChartShareFrame } from "@/components/btc/share/BtcChartShareFrame";
import { BtcChartShareThemePicker } from "@/components/btc/share/BtcChartShareThemePicker";
import {
  blobFromBtcChartShare,
  BTC_CHART_SHARE_WIDTH,
  buildBtcChartShareFilename,
  copyBtcChartShareToClipboard,
  exportBtcChartSharePng,
} from "@/components/btc/share/btcChartShareExport";
import {
  buildBtcChartShareOnXUrl,
  buildBtcChartShareText,
  copyBtcChartShareText,
  type BtcChartShareCopyContext,
} from "@/components/btc/share/btcChartShareCopy";
import {
  DEFAULT_SHARE_THEME,
  loadPersistedCustomColors,
  resolveShareTheme,
  shareThemeStorageKey,
  type BtcChartShareTheme,
} from "@/components/btc/share/btcChartShareTheme";
import type { BtcBubblemapData, BtcExchange, BtcInterval } from "@/lib/btcApi";
import type { BtcChartVariant, ChartRow } from "@/components/btc/chart/btcChartShared";
import { BTC_CHART_VARIANTS } from "@/components/btc/chart/btcChartShared";

const PREVIEW_SCALE = 0.42;

interface BtcChartShareModalProps {
  open: boolean;
  onClose: () => void;
  data: BtcBubblemapData | null;
  rows: ChartRow[];
  exchange: BtcExchange;
  interval: BtcInterval;
  variant: BtcChartVariant;
}

export function BtcChartShareModal({
  open,
  onClose,
  data,
  rows,
  exchange,
  interval,
  variant,
}: BtcChartShareModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);
  const [shareThemeState, setShareThemeState] = useState<BtcChartShareTheme>(DEFAULT_SHARE_THEME);

  useEffect(() => {
    if (!open) return;
    setShareThemeState({
      mode: DEFAULT_SHARE_THEME.mode,
      custom: loadPersistedCustomColors(),
    });
  }, [open]);

  const resolvedShareTheme = useMemo(() => resolveShareTheme(shareThemeState), [shareThemeState]);
  const themeKey = shareThemeStorageKey(shareThemeState);

  const copyContext = useMemo<BtcChartShareCopyContext | null>(
    () => (data != null ? { data, exchange, interval, variant } : null),
    [data, exchange, interval, variant],
  );
  const shareText = copyContext ? buildBtcChartShareText(copyContext) : "";
  const variantLabel = BTC_CHART_VARIANTS.find((v) => v.id === variant)?.label ?? variant;

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
        toast.success("Chart image copied — paste on X or Telegram");
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
    if (!exportRef.current || !data) return;
    setDownloading(true);
    try {
      await exportBtcChartSharePng(
        exportRef.current,
        buildBtcChartShareFilename(exchange, interval, variant, shareThemeState.mode),
      );
      toast.success("PNG downloaded");
    } catch {
      toast.error("Failed to export image");
    } finally {
      setDownloading(false);
    }
  }, [data, exchange, interval, variant, shareThemeState.mode]);

  const handleNativeShare = useCallback(async () => {
    if (!exportRef.current || !copyContext) return;
    setSharing(true);
    try {
      const blob = await blobFromBtcChartShare(exportRef.current);
      if (!blob) {
        toast.error("Could not build share image");
        return;
      }
      const file = new File(
        [blob],
        buildBtcChartShareFilename(exchange, interval, variant, shareThemeState.mode),
        { type: "image/png" },
      );
      const shareData = { files: [file], title: "Syra BTC chart", text: buildBtcChartShareText(copyContext) };
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
  }, [copyContext, exchange, interval, variant, shareThemeState.mode]);

  const handleCopyText = useCallback(async () => {
    if (!copyContext) return;
    try {
      const ok = await copyBtcChartShareText(copyContext);
      if (ok) {
        setTextCopied(true);
        toast.success("Post copy ready — paste after attaching image");
        window.setTimeout(() => setTextCopied(false), 2200);
      } else {
        toast.error("Could not copy to clipboard");
      }
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, [copyContext]);

  const busy = copying || downloading || sharing;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(94dvh,900px)] max-w-3xl overflow-y-auto gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-4 w-4 text-[#F7931A]" aria-hidden />
            Share chart
          </DialogTitle>
          <DialogDescription>
            Export your {variantLabel} bubblemap · {BTC_CHART_SHARE_WIDTH}px wide · PNG
          </DialogDescription>
        </DialogHeader>

        {data && rows.length >= 2 ? (
          <div className="space-y-4 p-4 sm:p-5">
            <BtcChartShareThemePicker theme={shareThemeState} onChange={setShareThemeState} />

            <div
              className="mx-auto w-fit overflow-hidden rounded-xl border border-border/60 shadow-inner"
              style={{ backgroundColor: resolvedShareTheme.exportBackground }}
            >
              <div
                style={{
                  width: BTC_CHART_SHARE_WIDTH * PREVIEW_SCALE,
                  height: 720 * PREVIEW_SCALE,
                }}
                className="overflow-hidden"
              >
                <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}>
                  <BtcChartShareFrame
                    key={`preview-${themeKey}`}
                    data={data}
                    exchange={exchange}
                    interval={interval}
                    variant={variant}
                    rows={rows}
                    shareTheme={resolvedShareTheme}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => void handleCopy()}
                disabled={busy}
              >
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

            {copyContext ? (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  X post copy
                </p>
                <pre className="max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                  {shareText}
                </pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="rounded-lg" asChild>
                    <a href={buildBtcChartShareOnXUrl(copyContext)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" aria-hidden />
                      Open on X
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => void handleCopyText()}
                  >
                    {textCopied ? (
                      <Check className="mr-2 h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Copy className="mr-2 h-3.5 w-3.5" aria-hidden />
                    )}
                    {textCopied ? "Copied" : "Copy post text"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {data && rows.length >= 2 ? (
          <div
            aria-hidden
            className="pointer-events-none fixed left-[-9999px] top-0 opacity-0"
            style={{ width: BTC_CHART_SHARE_WIDTH }}
          >
            <BtcChartShareFrame
              key={`export-${themeKey}`}
              ref={exportRef}
              data={data}
              exchange={exchange}
              interval={interval}
              variant={variant}
              rows={rows}
              shareTheme={resolvedShareTheme}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
