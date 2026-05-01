import { forwardRef, useCallback, useMemo, useRef } from "react";
import { toPng } from "html-to-image";
import { Download, FileImage, Share2 } from "lucide-react";
import {
  ChangePill,
  TokenAvatar,
  VerifiedBadge,
  formatPctSigned,
  formatPriceSmart,
  shortenMint,
} from "@/components/rise/RiseShared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatUsd } from "@/lib/marketDisplayFormat";
import type { DashboardDictionary } from "@/lib/dashboardI18n";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { computeAlphaScore } from "@/components/terminal/IntelligenceEngine";
import type { AlphaScore } from "@/components/terminal/types";

type TerminalCopy = DashboardDictionary["terminal"];

const BRAG_CARD_PNG_OPTIONS = {
  cacheBust: true,
  pixelRatio: 2,
  backgroundColor: "#09090b",
} as const;

/** Canvas decode → PNG blob (best for system clipboard). Falls back to fetch of data URL. */
function dataUrlToPngBlob(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const fromFetch = () => {
      void fetch(dataUrl)
        .then((r) => r.arrayBuffer())
        .then((buf) => resolve(new Blob([buf], { type: "image/png" })))
        .catch(reject);
    };
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          fromFetch();
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fromFetch();
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (b) => {
            if (b && b.size > 0) resolve(b);
            else fromFetch();
          },
          "image/png",
          1.0,
        );
      } catch {
        fromFetch();
      }
    };
    img.onerror = () => fromFetch();
    img.src = dataUrl;
  });
}

async function writePngToClipboard(png: Blob): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) {
    throw new Error("clipboard write unavailable");
  }
  if (typeof ClipboardItem === "undefined") {
    throw new Error("ClipboardItem unavailable");
  }
  const body = png.type === "image/png" && png.size > 0 ? png : new Blob([await png.arrayBuffer()], { type: "image/png" });
  if (body.size === 0) throw new Error("empty png");

  // Sync blob (works in most Chromium builds)
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": body })]);
    return;
  } catch {
    // Promise-based item (Safari / some WebKit paths)
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": Promise.resolve(body),
      }),
    ]);
  } catch {
    throw new Error("clipboard write failed");
  }
}

export function buildTerminalShareUrl(mint: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/terminal?token=${encodeURIComponent(mint)}`;
}

function buildShareSocialText(
  t: TerminalCopy,
  market: RiseMarketRow,
  alphaRank: number | null,
  alphaScore: number,
  change24hLabel: string,
  url: string,
): string {
  const sym = market.symbol ? `$${market.symbol}` : market.name || "Token";
  const ranked = alphaRank !== null && alphaRank >= 1 && alphaRank <= 10;
  const template = ranked ? t.shareSocialTextRanked : t.shareSocialTextUnranked;
  let out = template
    .replaceAll("{symbol}", sym)
    .replaceAll("{score}", alphaScore.toFixed(1))
    .replaceAll("{change24h}", change24hLabel)
    .replaceAll("{url}", url);
  if (ranked && alphaRank !== null) {
    out = out.replaceAll("{rank}", String(alphaRank));
  }
  return out;
}

type BragCardProps = {
  market: RiseMarketRow;
  alpha: AlphaScore;
  alphaRank: number | null;
  t: TerminalCopy;
};

/** Share-card visual tier: higher podium = louder treatment (competition for #1). */
type BragShareTier = "champion" | "silver" | "bronze" | "listed" | "standard";

function bragShareTier(alphaRank: number | null): BragShareTier {
  if (alphaRank === null || alphaRank < 1 || alphaRank > 10) return "standard";
  if (alphaRank === 1) return "champion";
  if (alphaRank === 2) return "silver";
  if (alphaRank === 3) return "bronze";
  return "listed";
}

const BRAG_SHELL: Record<BragShareTier, string> = {
  champion:
    "border-amber-400/55 bg-[#0a0704] shadow-[0_0_0_1px_rgba(251,191,36,0.28)_inset,0_32px_100px_-24px_rgba(0,0,0,0.92),0_0_140px_-28px_rgba(251,191,36,0.65),0_0_90px_-35px_rgba(236,72,153,0.38),0_0_70px_-20px_rgba(250,204,21,0.35)]",
  silver:
    "border-slate-300/40 bg-[#050608] shadow-[0_0_0_1px_rgba(226,232,240,0.18)_inset,0_28px_90px_-22px_rgba(0,0,0,0.88),0_0_110px_-28px_rgba(56,189,248,0.42),0_0_70px_-28px_rgba(148,163,184,0.28)]",
  bronze:
    "border-orange-400/45 bg-[#090604] shadow-[0_0_0_1px_rgba(251,146,60,0.22)_inset,0_28px_88px_-22px_rgba(0,0,0,0.88),0_0_100px_-26px_rgba(249,115,22,0.42),0_0_65px_-24px_rgba(180,83,9,0.35)]",
  listed:
    "border-emerald-400/30 bg-[#050508] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_28px_80px_-24px_rgba(0,0,0,0.85),0_0_95px_-30px_rgba(45,212,191,0.38),0_0_60px_-22px_rgba(168,85,247,0.22)]",
  standard:
    "border-white/[0.14] bg-[#050508] shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset,0_28px_80px_-24px_rgba(0,0,0,0.85),0_0_70px_-35px_rgba(45,212,191,0.18)]",
};

const BRAG_RIBBON: Record<Exclude<BragShareTier, "standard">, string> = {
  champion:
    "border-amber-200/60 bg-gradient-to-r from-amber-400/50 via-yellow-300/40 to-amber-500/50 text-amber-50 shadow-[0_0_40px_rgba(251,191,36,0.65),0_0_60px_rgba(250,204,21,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] scale-[1.02] sm:scale-105",
  silver:
    "border-slate-200/50 bg-gradient-to-r from-slate-400/45 via-cyan-200/35 to-slate-500/40 text-slate-50 shadow-[0_0_32px_rgba(56,189,248,0.45),inset_0_1px_0_rgba(255,255,255,0.28)]",
  bronze:
    "border-orange-300/50 bg-gradient-to-r from-orange-500/45 via-amber-700/35 to-orange-700/45 text-orange-50 shadow-[0_0_28px_rgba(249,115,22,0.45),inset_0_1px_0_rgba(255,255,255,0.22)]",
  listed:
    "border-amber-400/40 bg-gradient-to-r from-amber-600/28 via-amber-500/22 to-amber-700/28 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.38),inset_0_1px_0_rgba(255,255,255,0.2)]",
};

function BragCardUnderlay({ tier }: { tier: BragShareTier }) {
  const gridOpacity = tier === "champion" ? "opacity-[0.18]" : tier === "standard" ? "opacity-[0.08]" : "opacity-[0.14]";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden>
      {tier === "champion" ? (
        <>
          <div className="absolute inset-0 bg-[conic-gradient(at_30%_20%,rgba(251,191,36,0.45),transparent_35%,rgba(236,72,153,0.2),transparent_55%,rgba(250,204,21,0.25),transparent_75%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(251,191,36,0.45),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_95%_85%,rgba(236,72,153,0.22),transparent_50%)]" />
          <div className="absolute -left-[20%] bottom-0 top-0 w-[58%] skew-x-[-14deg] bg-gradient-to-br from-amber-400/35 via-yellow-500/15 to-transparent" />
          <div className="absolute left-[30%] top-[-20%] h-[140%] w-[40%] rotate-12 bg-gradient-to-b from-yellow-200/12 via-transparent to-transparent blur-2xl" />
        </>
      ) : tier === "silver" ? (
        <>
          <div className="absolute inset-0 bg-[conic-gradient(at_22%_38%,rgba(56,189,248,0.28),transparent_40%,rgba(148,163,184,0.2),transparent_65%,rgba(186,230,253,0.15),transparent_80%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_10%_45%,rgba(56,189,248,0.32),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_88%_12%,rgba(226,232,240,0.2),transparent_52%)]" />
          <div className="absolute -left-[18%] bottom-0 top-0 w-[52%] skew-x-[-12deg] bg-gradient-to-br from-sky-400/22 via-slate-400/12 to-transparent" />
        </>
      ) : tier === "bronze" ? (
        <>
          <div className="absolute inset-0 bg-[conic-gradient(at_20%_40%,rgba(249,115,22,0.28),transparent_42%,rgba(180,83,9,0.18),transparent_68%,rgba(251,146,60,0.14),transparent_82%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_72%_52%_at_14%_48%,rgba(234,88,12,0.32),transparent_54%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_38%_at_90%_18%,rgba(254,215,170,0.16),transparent_50%)]" />
          <div className="absolute -left-[18%] bottom-0 top-0 w-[50%] skew-x-[-12deg] bg-gradient-to-br from-orange-500/26 via-amber-800/12 to-transparent" />
        </>
      ) : tier === "listed" ? (
        <>
          <div className="absolute inset-0 bg-[conic-gradient(at_18%_42%,rgba(16,185,129,0.22),transparent_42%,rgba(168,85,247,0.14),transparent_68%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_12%_50%,rgba(16,185,129,0.32),transparent_58%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_92%_18%,rgba(236,72,153,0.14),transparent_55%)]" />
          <div className="absolute -left-[18%] bottom-0 top-0 w-[52%] skew-x-[-12deg] bg-gradient-to-br from-emerald-500/22 via-teal-500/10 to-transparent opacity-90" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(16,185,129,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 to-black" />
          <div className="absolute -left-[16%] bottom-0 top-0 w-[45%] skew-x-[-10deg] bg-gradient-to-br from-emerald-600/10 to-transparent" />
        </>
      )}
      <div className={cn("absolute inset-0 grid-pattern", gridOpacity)} />
      {tier !== "standard" ? (
        <div className="absolute -left-[14%] bottom-0 top-0 w-[46%] skew-x-[-12deg] border-r border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-transparent" />
      ) : null}
      {/* Corner brackets — amp up for podium */}
      <div
        className={cn(
          "absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 sm:left-4 sm:top-4",
          tier === "champion" && "h-7 w-7 border-amber-300/70 shadow-[0_0_12px_rgba(251,191,36,0.5)]",
          tier === "silver" && "border-sky-300/55",
          tier === "bronze" && "border-orange-400/55",
          (tier === "listed" || tier === "standard") && "border-emerald-400/45",
        )}
      />
      <div
        className={cn(
          "absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 sm:right-4 sm:top-4",
          tier === "champion" && "h-7 w-7 border-fuchsia-400/55 shadow-[0_0_12px_rgba(236,72,153,0.35)]",
          tier === "silver" && "border-cyan-300/45",
          tier === "bronze" && "border-amber-600/45",
          tier === "listed" && "border-fuchsia-400/35",
          tier === "standard" && "border-white/20",
        )}
      />
      <div
        className={cn(
          "absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 sm:bottom-4 sm:left-4",
          tier === "champion" && "border-yellow-200/40",
          tier === "silver" && "border-slate-400/40",
          tier === "bronze" && "border-orange-300/40",
          tier === "listed" && "border-white/22",
          tier === "standard" && "border-white/18",
        )}
      />
      <div
        className={cn(
          "absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 sm:bottom-4 sm:right-4",
          tier === "champion" && "border-amber-400/50",
          tier === "silver" && "border-sky-400/45",
          tier === "bronze" && "border-orange-500/45",
          tier === "listed" && "border-cyan-400/30",
          tier === "standard" && "border-white/15",
        )}
      />
      {/* Giant watermark — podium shows rank digit */}
      {tier === "champion" ? (
        <>
          <span className="absolute -right-2 bottom-[-10%] select-none font-black leading-none tracking-tighter text-amber-400/[0.09] sm:bottom-[-6%] sm:right-2 text-[6rem] sm:text-[8.5rem]">
            1
          </span>
          <span className="absolute right-[8%] top-[18%] rotate-[-8deg] select-none font-black uppercase tracking-[0.35em] text-amber-300/[0.12] text-[0.55rem] sm:text-[0.68rem]">
            KING
          </span>
        </>
      ) : tier === "silver" ? (
        <span className="absolute -right-2 bottom-[-10%] select-none font-black leading-none tracking-tighter text-sky-200/[0.08] sm:bottom-[-6%] sm:right-2 text-[6rem] sm:text-[8rem]">
          2
        </span>
      ) : tier === "bronze" ? (
        <span className="absolute -right-2 bottom-[-10%] select-none font-black leading-none tracking-tighter text-orange-400/[0.09] sm:bottom-[-6%] sm:right-2 text-[6rem] sm:text-[8rem]">
          3
        </span>
      ) : (
        <span className="absolute -right-4 bottom-[-8%] select-none font-black uppercase leading-none tracking-tighter text-white/[0.04] text-[5rem] sm:bottom-[-4%] sm:right-4 sm:text-[7rem]">
          α
        </span>
      )}
      {tier !== "standard" ? (
        <span className="absolute right-[12%] top-1/2 -translate-y-1/2 rotate-[-12deg] select-none whitespace-nowrap font-black uppercase tracking-[0.2em] text-white/[0.035] text-[0.55rem] sm:text-[0.65rem]">
          SIGNAL
        </span>
      ) : (
        <span className="absolute right-[14%] top-1/2 -translate-y-1/2 rotate-[-12deg] select-none whitespace-nowrap font-semibold uppercase tracking-[0.18em] text-white/[0.025] text-[0.5rem] sm:text-[0.58rem]">
          TERMINAL
        </span>
      )}
      {tier === "champion" ? (
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-18deg,transparent,transparent_38px,rgba(251,191,36,0.03)_38px,rgba(251,191,36,0.03)_39px)]" />
      ) : null}
    </div>
  );
}

const BragCard = forwardRef<HTMLDivElement, BragCardProps>(function BragCard(
  { market, alpha, alphaRank, t },
  ref,
) {
  const tone = alpha.score >= 75 ? "up" : alpha.score >= 50 ? "neutral" : "down";
  const tier = bragShareTier(alphaRank);
  const showRankRibbon = alphaRank !== null && alphaRank >= 1 && alphaRank <= 10;
  const eyebrowParts = t.shareCardEyebrow.split(" · ").map((s) => s.trim());

  const avatarGlowGradient =
    tier === "champion"
      ? "from-amber-400/45 via-yellow-300/20 to-rose-500/25"
      : tier === "silver"
        ? "from-sky-400/35 via-slate-300/15 to-cyan-400/25"
        : tier === "bronze"
          ? "from-orange-400/40 via-amber-600/20 to-orange-700/25"
          : tier === "listed"
            ? "from-emerald-400/35 via-transparent to-fuchsia-500/20"
            : "from-emerald-400/22 via-transparent to-zinc-600/15";

  const avatarFrame =
    tier === "champion"
      ? "border-amber-200/35 shadow-[0_16px_50px_-6px_rgba(251,191,36,0.55)] ring-2 ring-amber-300/40"
      : tier === "silver"
        ? "border-sky-200/35 shadow-[0_14px_44px_-8px_rgba(56,189,248,0.45)] ring-2 ring-sky-300/35"
        : tier === "bronze"
          ? "border-orange-300/35 shadow-[0_14px_44px_-8px_rgba(249,115,22,0.45)] ring-2 ring-orange-400/35"
          : tier === "listed"
            ? "border-white/25 shadow-[0_12px_40px_-8px_rgba(16,185,129,0.45)] ring-2 ring-white/15"
            : "border-white/22 shadow-[0_10px_32px_-8px_rgba(16,185,129,0.28)] ring-2 ring-white/12";

  const scorePanelRing =
    tier === "champion"
      ? "border-amber-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_50px_-18px_rgba(251,191,36,0.25)]"
      : tier === "silver"
        ? "border-sky-300/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_44px_-18px_rgba(56,189,248,0.2)]"
        : tier === "bronze"
          ? "border-orange-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_18px_44px_-18px_rgba(249,115,22,0.22)]"
          : tier === "listed"
            ? "border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_40px_-20px_rgba(0,0,0,0.5)]"
            : "border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_36px_-20px_rgba(0,0,0,0.45)]";

  const ctaGradient =
    tier === "champion"
      ? "from-amber-100 via-yellow-200 to-rose-200"
      : tier === "silver"
        ? "from-sky-100 via-cyan-100 to-slate-100"
        : tier === "bronze"
          ? "from-orange-100 via-amber-200 to-orange-200"
          : tier === "listed"
            ? "from-emerald-200 via-teal-200 to-cyan-200"
            : "from-emerald-200/90 via-teal-200/90 to-cyan-200/90";

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full max-w-[600px] text-white",
        "rounded-[1.35rem] sm:rounded-[1.65rem] border",
        BRAG_SHELL[tier],
        "min-h-0 min-w-[min(100%,320px)]",
      )}
    >
      <BragCardUnderlay tier={tier} />

      {showRankRibbon ? (
        <div
          className={cn(
            "absolute z-20 px-3 sm:px-4",
            tier === "champion"
              ? "left-0 right-0 top-3 flex justify-center sm:top-4"
              : "left-0 top-3 sm:left-4 sm:top-4",
          )}
        >
          <div
            className={cn(
              "rounded-full border px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.16em] backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[0.62rem]",
              BRAG_RIBBON[tier as keyof typeof BRAG_RIBBON],
            )}
          >
            {t.topNAlpha.replace("{rank}", String(alphaRank))}
          </div>
        </div>
      ) : null}

      {/* Landscape split: identity rail | alpha dashboard */}
      <div
        className={cn(
          "relative z-10 flex min-h-[220px] w-full min-w-0 flex-row gap-0 sm:min-h-[248px]",
          showRankRibbon && tier === "champion" ? "pt-[3.15rem] sm:pt-14" : showRankRibbon ? "pt-11 sm:pt-12" : "pt-4 sm:pt-5",
        )}
      >
        <div className="flex w-[38%] max-w-[210px] shrink-0 flex-col justify-center gap-2 border-r border-white/[0.08] bg-gradient-to-b from-black/20 to-transparent px-3 py-4 sm:w-[40%] sm:max-w-[230px] sm:gap-3 sm:px-4 sm:py-5">
          <div className="relative mx-auto flex flex-col items-center sm:mx-0 sm:items-start">
            <div
              className={cn(
                "absolute -inset-3 rounded-3xl bg-gradient-to-tr opacity-80 blur-xl",
                avatarGlowGradient,
              )}
            />
            <TokenAvatar
              imageUrl={market.imageUrl}
              symbol={market.symbol}
              size="lg"
              className={cn(
                "relative z-[1] !h-16 !w-16 rounded-2xl border sm:!h-[4.5rem] sm:!w-[4.5rem]",
                avatarFrame,
              )}
            />
          </div>
          <div className="mt-1 flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <span className="text-xl font-black tracking-[-0.05em] sm:text-2xl">
                ${market.symbol || "—"}
              </span>
              <VerifiedBadge verified={market.isVerified} />
            </div>
            <p className="line-clamp-2 w-full text-[0.7rem] font-medium leading-snug text-white/55 sm:text-xs">
              {market.name || "—"}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 px-3 py-3 sm:gap-2.5 sm:px-4 sm:py-4">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              {eyebrowParts.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-[0.55rem] font-bold leading-tight sm:text-[0.58rem]",
                    i === 0 ? "uppercase tracking-[0.14em] text-white/70" : "text-white/45",
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-wider sm:px-2.5 sm:text-[0.58rem]",
                tier === "champion" &&
                  "border-amber-400/50 bg-amber-500/25 text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.45)]",
                tier === "silver" &&
                  "border-sky-400/45 bg-sky-500/20 text-sky-50 shadow-[0_0_16px_rgba(56,189,248,0.35)]",
                tier === "bronze" &&
                  "border-orange-400/45 bg-orange-500/22 text-orange-50 shadow-[0_0_16px_rgba(249,115,22,0.35)]",
                (tier === "listed" || tier === "standard") &&
                  "border-emerald-400/40 bg-emerald-500/20 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.35)]",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.9)]",
                  tier === "champion" && "bg-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.9)]",
                  tier === "silver" && "bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.85)]",
                  tier === "bronze" && "bg-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.85)]",
                  (tier === "listed" || tier === "standard") && "bg-emerald-300",
                )}
              />
              {t.shareCardLive}
            </span>
          </div>

          <div
            className={cn(
              "relative min-w-0 rounded-xl border bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-black/40 p-2.5 backdrop-blur-[2px] sm:rounded-2xl sm:p-3",
              scorePanelRing,
            )}
          >
            <div
              className={cn(
                "absolute -right-1 -top-1 h-10 w-10 rounded-full blur-lg",
                tier === "champion" && "bg-gradient-to-br from-amber-300/30 to-transparent",
                tier === "silver" && "bg-gradient-to-br from-sky-300/28 to-transparent",
                tier === "bronze" && "bg-gradient-to-br from-orange-400/28 to-transparent",
                (tier === "listed" || tier === "standard") && "bg-gradient-to-br from-cyan-400/25 to-transparent",
              )}
            />
            <div className="relative flex min-w-0 items-end justify-between gap-2">
              <div className="min-w-0 pb-0.5">
                <p className="text-[0.55rem] font-black uppercase tracking-[0.18em] text-white/45 sm:text-[0.58rem]">
                  {t.shareCardScoreLabel}
                </p>
                <p className="mt-0.5 text-[0.6rem] font-semibold text-white/35">{t.shareCardScoreRange}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-5xl font-black tabular-nums leading-none tracking-[-0.06em] sm:text-6xl",
                  tier === "champion" &&
                    tone === "up" &&
                    "bg-gradient-to-br from-amber-100 via-yellow-300 to-rose-300 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(251,191,36,0.45)]",
                  tier === "champion" && tone === "neutral" && "text-amber-50 drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]",
                  tier === "champion" &&
                    tone === "down" &&
                    "bg-gradient-to-br from-rose-100 via-rose-400 to-orange-500 bg-clip-text text-transparent",
                  tier === "silver" &&
                    tone === "up" &&
                    "bg-gradient-to-br from-sky-100 via-cyan-300 to-slate-100 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(56,189,248,0.4)]",
                  tier === "silver" && tone === "neutral" && "text-slate-100 drop-shadow-[0_0_16px_rgba(148,163,184,0.35)]",
                  tier === "silver" &&
                    tone === "down" &&
                    "bg-gradient-to-br from-rose-100 via-rose-400 to-orange-500 bg-clip-text text-transparent",
                  tier === "bronze" &&
                    tone === "up" &&
                    "bg-gradient-to-br from-orange-100 via-amber-300 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(249,115,22,0.4)]",
                  tier === "bronze" && tone === "neutral" && "text-orange-50 drop-shadow-[0_0_16px_rgba(249,115,22,0.3)]",
                  tier === "bronze" &&
                    tone === "down" &&
                    "bg-gradient-to-br from-rose-100 via-rose-400 to-orange-500 bg-clip-text text-transparent",
                  (tier === "listed" || tier === "standard") &&
                    tone === "up" &&
                    "bg-gradient-to-br from-emerald-100 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(16,185,129,0.35)]",
                  (tier === "listed" || tier === "standard") && tone === "neutral" && "text-white",
                  (tier === "listed" || tier === "standard") &&
                    tone === "down" &&
                    "bg-gradient-to-br from-rose-100 via-rose-400 to-orange-500 bg-clip-text text-transparent",
                )}
              >
                {alpha.score.toFixed(1)}
              </span>
            </div>
            <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-zinc-900/90 ring-1 ring-white/10">
              <div
                className={cn(
                  "h-full rounded-full shadow-[0_0_12px_rgba(52,211,153,0.5)]",
                  tone === "up" && "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300",
                  tone === "neutral" && "bg-zinc-400",
                  tone === "down" && "bg-gradient-to-r from-rose-500 to-orange-400",
                )}
                style={{ width: `${Math.max(5, Math.min(100, alpha.score))}%` }}
              />
            </div>
          </div>

          <p className="line-clamp-2 text-[0.68rem] font-semibold italic leading-snug text-white/75 sm:text-[0.72rem]">
            {showRankRibbon && alphaRank !== null
              ? t.shareCardBraglineRanked.replace("{rank}", String(alphaRank))
              : t.shareCardBragline}
          </p>

          <div className="grid min-w-0 grid-cols-4 gap-1 sm:gap-1.5">
            <div className="min-w-0 rounded-lg border border-white/10 bg-black/35 px-1.5 py-1.5 sm:rounded-xl sm:px-2 sm:py-2">
              <p className="truncate text-[0.48rem] font-black uppercase tracking-[0.08em] text-white/35 sm:text-[0.5rem]">
                {t.price}
              </p>
              <p className="mt-1 truncate font-mono text-[0.62rem] font-bold tabular-nums text-white sm:text-[0.68rem]">
                {formatPriceSmart(market.priceUsd)}
              </p>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-black/35 px-1.5 py-1.5 sm:rounded-xl sm:px-2 sm:py-2">
              <p className="truncate text-[0.48rem] font-black uppercase tracking-[0.08em] text-white/35 sm:text-[0.5rem]">
                {t.h24}
              </p>
              <div className="mt-1 scale-90 origin-left">
                <ChangePill pct={market.priceChange24hPct} className="border-white/25 bg-white/[0.06] px-1 text-[0.55rem]" />
              </div>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-black/35 px-1.5 py-1.5 sm:rounded-xl sm:px-2 sm:py-2">
              <p className="truncate text-[0.48rem] font-black uppercase tracking-[0.08em] text-white/35 sm:text-[0.5rem]">
                {t.vol24hLabel}
              </p>
              <p className="mt-1 truncate font-mono text-[0.62rem] font-bold tabular-nums text-white sm:text-[0.68rem]">
                {formatUsd(market.volume24hUsd, { compact: true })}
              </p>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-black/35 px-1.5 py-1.5 sm:rounded-xl sm:px-2 sm:py-2">
              <p className="truncate text-[0.48rem] font-black uppercase tracking-[0.08em] text-white/35 sm:text-[0.5rem]">
                {t.mcapLabel}
              </p>
              <p className="mt-1 truncate font-mono text-[0.62rem] font-bold tabular-nums text-white sm:text-[0.68rem]">
                {formatUsd(market.marketCapUsd, { compact: true })}
              </p>
            </div>
          </div>

          <div className="border-t border-white/[0.09] pt-2">
            <p
              className={cn(
                "text-center text-[0.72rem] font-black tracking-tight text-transparent bg-gradient-to-r bg-clip-text sm:text-sm",
                ctaGradient,
              )}
            >
              {t.shareCardCta.replace("{symbol}", market.symbol ? `$${market.symbol}` : market.name || "—")}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.55rem] text-white/35 sm:text-[0.58rem]">
              <span className="text-white/45">{t.shareCardMintLabel}</span>
              <span className="font-mono text-white/55">{shortenMint(market.mint, 5, 5)}</span>
              <span className="hidden text-white/25 sm:inline">·</span>
              <span className="text-white/30">{t.shareCardVia}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export type ShareTokenDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: RiseMarketRow | null;
  alphaRank: number | null;
  alpha: AlphaScore | null;
  terminalCopy: TerminalCopy;
};

export function ShareTokenDialog({ open, onOpenChange, market, alphaRank, alpha, terminalCopy: t }: ShareTokenDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const resolvedAlpha = useMemo(() => {
    if (!market) return null;
    return alpha ?? computeAlphaScore(market);
  }, [market, alpha]);

  const url = useMemo(() => (market?.mint ? buildTerminalShareUrl(market.mint) : ""), [market?.mint]);

  const change24hLabel = useMemo(
    () => (market ? formatPctSigned(market.priceChange24hPct) : "—"),
    [market],
  );

  const shareText = useMemo(() => {
    if (!market || !resolvedAlpha) return "";
    return buildShareSocialText(t, market, alphaRank, resolvedAlpha.score, change24hLabel, url);
  }, [t, market, alphaRank, resolvedAlpha, change24hLabel, url]);

  const handleDownload = useCallback(async () => {
    const node = cardRef.current;
    if (!node || !market) return;
    try {
      const dataUrl = await toPng(node, BRAG_CARD_PNG_OPTIONS);
      const safe = (market.symbol || "token").replace(/[^\w-]/g, "-").slice(0, 32);
      const a = document.createElement("a");
      a.download = `${safe}-alpha-card.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      toast.error(t.shareDownloadFailed);
    }
  }, [market, t.shareDownloadFailed]);

  const handleCopyImage = useCallback(async () => {
    const node = cardRef.current;
    if (!node || !market) return;
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error(t.shareCopyImageUnsupported);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      toast.error(t.shareCopyImageUnsupported);
      return;
    }
    try {
      const dataUrl = await toPng(node, BRAG_CARD_PNG_OPTIONS);
      const pngBlob = await dataUrlToPngBlob(dataUrl);
      await writePngToClipboard(pngBlob);
      toast.success(t.shareCopiedImage);
    } catch {
      toast.error(t.shareCopyImageFailed);
    }
  }, [market, t.shareCopiedImage, t.shareCopyImageFailed, t.shareCopyImageUnsupported]);

  const openX = useCallback(() => {
    const q = new URLSearchParams({ text: shareText });
    window.open(`https://twitter.com/intent/tweet?${q.toString()}`, "_blank", "noopener,noreferrer");
  }, [shareText]);

  const openTelegram = useCallback(() => {
    const q = new URLSearchParams({ url, text: shareText });
    window.open(`https://t.me/share/url?${q.toString()}`, "_blank", "noopener,noreferrer");
  }, [shareText, url]);

  const nativeShare = useCallback(async () => {
    if (!navigator.share || !market || !resolvedAlpha) return;
    try {
      await navigator.share({
        title: t.shareDialogTitle,
        text: shareText,
        url,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      toast.error(t.shareDownloadFailed);
    }
  }, [market, resolvedAlpha, shareText, t.shareDialogTitle, t.shareDownloadFailed, url]);

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (!market || !resolvedAlpha) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md border-border/50">
          <DialogHeader>
            <DialogTitle>{t.shareDialogTitle}</DialogTitle>
            <DialogDescription>{t.shareDialogDescription}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[95vh] max-w-[min(96vw,620px)] overflow-y-auto border-border/50 bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6",
        )}
      >
        <DialogHeader className="space-y-1 pr-8 text-left">
          <DialogTitle className="text-xl tracking-tight">{t.shareDialogTitle}</DialogTitle>
          <DialogDescription>{t.shareDialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 flex justify-center overflow-x-auto px-1 py-2">
          <BragCard ref={cardRef} market={market} alpha={resolvedAlpha} alphaRank={alphaRank} t={t} />
        </div>

        <DialogFooter className="mt-3 flex-col gap-0 sm:flex-col">
          <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2">
            {canNativeShare ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-10 min-w-0 gap-2 rounded-xl"
                onClick={() => void nativeShare()}
              >
                <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{t.shareNative}</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 min-w-0 gap-2 rounded-xl"
              onClick={() => void handleDownload()}
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t.shareDownloadImage}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 min-w-0 gap-2 rounded-xl"
              onClick={() => void handleCopyImage()}
            >
              <FileImage className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t.shareCopyImage}</span>
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-10 min-w-0 rounded-xl" onClick={openX}>
              {t.shareOnX}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-10 min-w-0 rounded-xl", canNativeShare && "col-span-2")}
              onClick={openTelegram}
            >
              {t.shareOnTelegram}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
