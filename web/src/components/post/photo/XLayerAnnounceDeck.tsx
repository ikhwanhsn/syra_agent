import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { XLAYER_CARDS, type XLayerCardDef } from "@/content/announce/xlayerCards";
import { PostBackLink } from "@/components/post/PostBackLink";
import { XLayerSatoriPreview } from "@/components/post/photo/satori/XLayerSatoriPreview";
import {
  buildXLayerFilename,
  copyXLayerToClipboard,
  exportXLayerPng,
  XLAYER_HEIGHT,
  XLAYER_WIDTH,
} from "@/components/post/photo/xlayerExport";
import { cn } from "@/lib/utils";
import { SYRA_DOCUMENT_TITLE } from "@/lib/syraBranding";
import { Check, Copy, Download, ImageIcon, LayoutList } from "lucide-react";
import { toast } from "sonner";

const ARCHETYPE_LABEL: Record<XLayerCardDef["archetype"], string> = {
  showcase: "Showcase",
  metrics: "Metrics",
  pillars: "Pillars",
  flow: "Flow",
  quote: "Quote",
  comparison: "Comparison",
  checklist: "Checklist",
};

export function XLayerAnnounceDeck() {
  const [activeId, setActiveId] = useState(XLAYER_CARDS[0]?.id ?? "");
  const [busy, setBusy] = useState<"download" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);

  const card = XLAYER_CARDS.find((c) => c.id === activeId) ?? XLAYER_CARDS[0];

  useEffect(() => {
    document.title = `X-Layer Announce · ${SYRA_DOCUMENT_TITLE}`;
  }, []);

  const onDownload = useCallback(async () => {
    if (!card) return;
    setBusy("download");
    try {
      await exportXLayerPng(card);
      toast.success("Downloaded PNG");
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    } finally {
      setBusy(null);
    }
  }, [card]);

  const onCopy = useCallback(async () => {
    if (!card) return;
    setBusy("copy");
    try {
      const ok = await copyXLayerToClipboard(card);
      if (!ok) {
        toast.error("Clipboard unavailable");
        return;
      }
      setCopied(true);
      toast.success("Copied image");
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error(err);
      toast.error("Copy failed");
    } finally {
      setBusy(null);
    }
  }, [card]);

  if (!card) return null;

  return (
    <div className="post-studio-shell flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <PostBackLink />
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              Square announce · {XLAYER_WIDTH}×{XLAYER_HEIGHT}
            </p>
            <h1 className="truncate text-sm font-semibold tracking-tight md:text-base">
              X-Layer cards
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/post/photo"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55 hover:bg-white/5 hover:text-white"
          >
            <LayoutList className="h-3.5 w-3.5" />
            Ship log
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-white/10 lg:w-64 lg:border-b-0 lg:border-r">
          <div className="px-3 py-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
              Archetypes
            </p>
            <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {XLAYER_CARDS.map((item) => {
                const active = item.id === card.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={cn(
                      "flex min-w-[140px] flex-col rounded-lg px-2.5 py-2 text-left transition-colors lg:min-w-0",
                      active
                        ? "bg-white/12 text-white"
                        : "text-white/60 hover:bg-white/[0.04] hover:text-white/85",
                    )}
                  >
                    <span className="text-xs font-medium">
                      {ARCHETYPE_LABEL[item.archetype]}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                      {item.headlineLines.join(" · ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {busy === "download" ? "Exporting…" : "Download PNG"}
            </button>
            <button
              type="button"
              onClick={onCopy}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5 disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {busy === "copy" ? "Copying…" : copied ? "Copied" : "Copy image"}
            </button>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
              <ImageIcon className="h-3.5 w-3.5" />
              {buildXLayerFilename(card)}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900/60 p-3 md:p-4">
            <XLayerSatoriPreview card={card} />
          </div>

          <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/55">
            {card.shareCopy}
          </pre>
        </main>
      </div>
    </div>
  );
}
