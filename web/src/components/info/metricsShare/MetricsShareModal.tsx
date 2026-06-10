"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MetricsShareCard } from "@/components/info/metricsShare/MetricsShareCard";
import {
  buildMetricShareFilename,
  copyMetricShareToClipboard,
  exportMetricSharePng,
} from "@/components/info/metricsShare/metricsShareExport";
import {
  METRIC_SHARE_HEIGHT,
  METRIC_SHARE_WIDTH,
  type MetricShareSectionBundle,
  type MetricShareVariantIndex,
} from "@/components/info/metricsShare/types";
import { getSectionVariants, getVariantMeta } from "@/components/info/metricsShare/variantRegistry";

type MetricsShareModalProps = {
  bundle: MetricShareSectionBundle | null;
  onClose: () => void;
};

function VariantButton({
  label,
  description,
  active,
  onSelect,
}: {
  label: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "metrics-share-variant-btn w-full rounded-xl border px-3 py-2.5 text-left transition-all",
        active
          ? "border-[#F3BA2F]/40 bg-[#F3BA2F]/10 ring-1 ring-[#F3BA2F]/20"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
      )}
    >
      <span className={cn("block text-sm font-medium", active ? "text-[#F3BA2F]" : "text-white/85")}>{label}</span>
      <span className="mt-0.5 block text-[11px] leading-snug text-white/45">{description}</span>
    </button>
  );
}

export function MetricsShareModal({ bundle, onClose }: MetricsShareModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [cardId, setCardId] = useState<string>("");
  const [variantIndex, setVariantIndex] = useState<MetricShareVariantIndex>(0);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (bundle?.cards[0]) {
      setCardId(bundle.cards[0].id);
      setVariantIndex(0);
      setCopied(false);
    }
  }, [bundle]);

  const sectionVariants = bundle ? getSectionVariants(bundle.sectionId) : [];
  const variantMeta = bundle ? getVariantMeta(bundle.sectionId, variantIndex) : null;

  const selectedCard = bundle?.cards.find((c) => c.id === cardId) ?? bundle?.cards[0];
  const isPerItem = bundle?.mode === "per-item";

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const handleCopy = useCallback(async () => {
    if (!exportRef.current || !bundle || !selectedCard) return;
    setCopying(true);
    setCopied(false);
    try {
      const ok = await copyMetricShareToClipboard(exportRef.current);
      if (ok) {
        setCopied(true);
        toast.success("Image copied to clipboard");
        window.setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error("Copy not supported — try Download PNG");
      }
    } catch {
      toast.error("Failed to copy image");
    } finally {
      setCopying(false);
    }
  }, [bundle, selectedCard]);

  const handleDownload = useCallback(async () => {
    if (!exportRef.current || !bundle || !selectedCard) return;
    setDownloading(true);
    try {
      await exportMetricSharePng(
        exportRef.current,
        buildMetricShareFilename(bundle.sectionId, selectedCard.id, variantMeta?.id ?? String(variantIndex)),
      );
      toast.success("PNG downloaded");
    } catch {
      toast.error("Failed to export image");
    } finally {
      setDownloading(false);
    }
  }, [bundle, selectedCard, variantIndex, variantMeta]);

  const scale = 0.38;
  const cardCount = bundle?.cards.length ?? 0;
  const variantCount = sectionVariants.length;

  return (
    <Dialog open={bundle != null} onOpenChange={handleOpenChange}>
      <DialogContent className="metrics-share-dialog max-h-[min(94dvh,920px)] max-w-5xl overflow-hidden border-white/10 bg-[#0a0a0a] p-0 text-white gap-0">
        <DialogHeader className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg text-white">
            <ImageIcon className="h-4 w-4 text-[#F3BA2F]" aria-hidden />
            Share metrics
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {bundle ? (
              <>
                <span className="font-medium text-[#F3BA2F]/90">{bundle.sectionTitle}</span>
                {isPerItem ? (
                  <> · {cardCount} metrics × {variantCount} designs · pick one to export</>
                ) : (
                  <> · {variantCount} designs · 1200×675</>
                )}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {bundle && selectedCard && bundle.section ? (
          <div className="grid min-h-0 lg:grid-cols-[240px_minmax(0,1fr)_220px]">
            {isPerItem ? (
              <div className="max-h-[52dvh] overflow-y-auto border-b border-white/[0.08] p-3 lg:max-h-none lg:border-b-0 lg:border-r">
                <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#F3BA2F]/70">
                  Metrics · {cardCount}
                </p>
                <div className="grid gap-1.5">
                  {bundle.cards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setCardId(card.id)}
                      className={cn(
                        "rounded-lg px-2.5 py-2 text-left transition-colors",
                        cardId === card.id
                          ? "bg-[#F3BA2F]/12 text-[#F3BA2F]"
                          : "text-white/55 hover:bg-white/[0.04] hover:text-white/80",
                      )}
                    >
                      <span className="block truncate text-xs font-medium">{card.label}</span>
                      <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-white/40">
                        {card.item.value}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={cn("flex flex-col p-4 sm:p-5", !isPerItem && "lg:col-span-2")}>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                {isPerItem ? selectedCard.label : bundle.sectionTitle}
                {" · "}
                {variantMeta?.label}
                {" · 1200×675"}
              </p>
              <div className="mx-auto w-fit overflow-hidden rounded-xl border border-white/10 shadow-inner">
                <div
                  style={{
                    width: METRIC_SHARE_WIDTH * scale,
                    height: METRIC_SHARE_HEIGHT * scale,
                  }}
                >
                  <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                    <MetricsShareCard
                      variantIndex={variantIndex}
                      mode={bundle.mode}
                      section={bundle.section}
                      item={selectedCard.item}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  className="flex-1 rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
                  onClick={() => void handleCopy()}
                  disabled={copying || downloading}
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
                  className="flex-1 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => void handleDownload()}
                  disabled={copying || downloading}
                >
                  {downloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Download PNG
                </Button>
              </div>
            </div>

            <div className="border-t border-white/[0.08] p-3 lg:border-t-0 lg:border-l">
              <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#F3BA2F]/70">
                Design · {variantCount}
              </p>
              <div className="grid gap-2">
                {sectionVariants.map((v) => (
                  <VariantButton
                    key={v.id}
                    label={v.label}
                    description={v.description}
                    active={variantIndex === v.index}
                    onSelect={() => setVariantIndex(v.index)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {bundle && selectedCard && bundle.section ? (
          <div
            aria-hidden
            className="pointer-events-none fixed left-[-9999px] top-0 opacity-0"
            style={{ width: METRIC_SHARE_WIDTH, height: METRIC_SHARE_HEIGHT }}
          >
            <MetricsShareCard
              ref={exportRef}
              variantIndex={variantIndex}
              mode={bundle.mode}
              section={bundle.section}
              item={selectedCard.item}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function MetricsSectionShareButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-8 shrink-0 gap-1.5 rounded-xl border-border/60 text-xs", className)}
      onClick={onClick}
    >
      <ImageIcon className="h-3.5 w-3.5" aria-hidden />
      Share
    </Button>
  );
}
