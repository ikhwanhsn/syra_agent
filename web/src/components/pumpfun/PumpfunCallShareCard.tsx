import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
  formatCompactUsd,
  formatGainMultiplier,
  truncateWallet,
  type PumpfunScanRecord,
} from "@/lib/pumpfunScanHistoryApi";
import {
  PUMPFUN_CALL_SHARE_BG,
  PUMPFUN_CALL_SHARE_HEIGHT,
  PUMPFUN_CALL_SHARE_WIDTH,
} from "@/components/pumpfun/pumpfunCallShareDimensions";
export {
  PUMPFUN_CALL_SHARE_WIDTH,
  PUMPFUN_CALL_SHARE_HEIGHT,
} from "@/components/pumpfun/pumpfunCallShareDimensions";
const FONT_DISPLAY = '"Space Grotesk", system-ui, sans-serif';
const FONT_MONO = '"JetBrains Mono", "Fira Code", monospace';
/** Visual tier — mirrors UpOnly fund alpha card BragCard tiers. */
type GainTier = "champion" | "listed" | "bronze" | "standard";
type TierTheme = {
  tier: GainTier;
  stamp: string;
  shellBorder: string;
  shellBg: string;
  shellShadow: string;
  ribbonBorder: string;
  ribbonBg: string;
  ribbonColor: string;
  ribbonShadow: string;
  bracketTL: string;
  bracketTR: string;
  bracketBL: string;
  bracketBR: string;
  avatarGlow: string;
  avatarFrame: string;
  scorePanelBorder: string;
  scorePanelShadow: string;
  scoreColor: string;
  scoreGlow: string;
  liveDot: string;
  liveBorder: string;
  liveBg: string;
  liveColor: string;
  liveShadow: string;
  ctaFrom: string;
  ctaVia: string;
  ctaTo: string;
  accent: string;
  secondary: string;
};
function resolveGainTier(multiplier: number | null): GainTier {
  const m = multiplier ?? 1;
  if (m >= 100) return "champion";
  if (m >= 10) return "listed";
  if (m >= 2) return "bronze";
  return "standard";
}
function resolveTheme(multiplier: number | null): TierTheme & { num: string; watermark: string } {
  const raw = formatGainMultiplier(multiplier);
  const num = raw.endsWith("x") ? raw.slice(0, -1) : raw;
  const tier = resolveGainTier(multiplier);
  const base: Record<GainTier, TierTheme> = {
    champion: {
      tier: "champion",
      stamp: "LEGENDARY CALL",
      shellBorder: "rgba(251, 191, 36, 0.55)",
      shellBg: "#0a0704",
      shellShadow:
        "0 0 0 1px rgba(251,191,36,0.28) inset, 0 32px 100px -24px rgba(0,0,0,0.92), 0 0 140px -28px rgba(251,191,36,0.65), 0 0 90px -35px rgba(236,72,153,0.38)",
      ribbonBorder: "rgba(254, 243, 199, 0.6)",
      ribbonBg: "linear-gradient(90deg, rgba(251,191,36,0.5), rgba(253,224,71,0.4), rgba(245,158,11,0.5))",
      ribbonColor: "#FFFBEB",
      ribbonShadow: "0 0 40px rgba(251,191,36,0.65), inset 0 1px 0 rgba(255,255,255,0.35)",
      bracketTL: "rgba(252, 211, 77, 0.7)",
      bracketTR: "rgba(232, 121, 249, 0.55)",
      bracketBL: "rgba(254, 240, 138, 0.4)",
      bracketBR: "rgba(251, 191, 36, 0.5)",
      avatarGlow: "linear-gradient(135deg, rgba(251,191,36,0.45), rgba(253,224,71,0.2), rgba(244,63,94,0.25))",
      avatarFrame: "rgba(254, 243, 199, 0.35)",
      scorePanelBorder: "rgba(251, 191, 36, 0.35)",
      scorePanelShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 20px 50px -18px rgba(251,191,36,0.25)",
      scoreColor: "#FEF3C7",
      scoreGlow: "0 0 48px rgba(251,191,36,0.55), 0 0 80px rgba(251,191,36,0.25)",
      liveDot: "#FDE68A",
      liveBorder: "rgba(251, 191, 36, 0.5)",
      liveBg: "rgba(245, 158, 11, 0.25)",
      liveColor: "#FFFBEB",
      liveShadow: "0 0 18px rgba(251,191,36,0.45)",
      ctaFrom: "#FEF3C7",
      ctaVia: "#FDE68A",
      ctaTo: "#FECDD3",
      accent: "#FBBF24",
      secondary: "#F472B6",
    },
    listed: {
      tier: "listed",
      stamp: "ALPHA CALL",
      shellBorder: "rgba(52, 211, 153, 0.3)",
      shellBg: "#050508",
      shellShadow:
        "0 0 0 1px rgba(255,255,255,0.08) inset, 0 28px 80px -24px rgba(0,0,0,0.85), 0 0 95px -30px rgba(45,212,191,0.38), 0 0 60px -22px rgba(168,85,247,0.22)",
      ribbonBorder: "rgba(251, 191, 36, 0.4)",
      ribbonBg: "linear-gradient(90deg, rgba(217,119,6,0.28), rgba(245,158,11,0.22), rgba(180,83,9,0.28))",
      ribbonColor: "#FEF3C7",
      ribbonShadow: "0 0 22px rgba(251,191,36,0.38), inset 0 1px 0 rgba(255,255,255,0.2)",
      bracketTL: "rgba(52, 211, 153, 0.45)",
      bracketTR: "rgba(232, 121, 249, 0.35)",
      bracketBL: "rgba(255, 255, 255, 0.22)",
      bracketBR: "rgba(34, 211, 238, 0.3)",
      avatarGlow: "linear-gradient(135deg, rgba(52,211,153,0.35), transparent, rgba(217,70,239,0.2))",
      avatarFrame: "rgba(255, 255, 255, 0.25)",
      scorePanelBorder: "rgba(255, 255, 255, 0.15)",
      scorePanelShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 40px -20px rgba(0,0,0,0.5)",
      scoreColor: "#6EE7B7",
      scoreGlow: "0 0 40px rgba(16,185,129,0.45), 0 0 64px rgba(45,212,191,0.2)",
      liveDot: "#6EE7B7",
      liveBorder: "rgba(52, 211, 153, 0.4)",
      liveBg: "rgba(16, 185, 129, 0.2)",
      liveColor: "#D1FAE5",
      liveShadow: "0 0 16px rgba(16,185,129,0.35)",
      ctaFrom: "#A7F3D0",
      ctaVia: "#5EEAD4",
      ctaTo: "#A5F3FC",
      accent: "#34D399",
      secondary: "#22D3EE",
    },
    bronze: {
      tier: "bronze",
      stamp: "SOLID CALL",
      shellBorder: "rgba(251, 146, 60, 0.45)",
      shellBg: "#090604",
      shellShadow:
        "0 0 0 1px rgba(251,146,60,0.22) inset, 0 28px 88px -22px rgba(0,0,0,0.88), 0 0 100px -26px rgba(249,115,22,0.42)",
      ribbonBorder: "rgba(253, 186, 116, 0.5)",
      ribbonBg: "linear-gradient(90deg, rgba(249,115,22,0.45), rgba(180,83,9,0.35), rgba(194,65,12,0.45))",
      ribbonColor: "#FFF7ED",
      ribbonShadow: "0 0 28px rgba(249,115,22,0.45), inset 0 1px 0 rgba(255,255,255,0.22)",
      bracketTL: "rgba(251, 146, 60, 0.55)",
      bracketTR: "rgba(180, 83, 9, 0.45)",
      bracketBL: "rgba(253, 186, 116, 0.4)",
      bracketBR: "rgba(249, 115, 22, 0.45)",
      avatarGlow: "linear-gradient(135deg, rgba(251,146,60,0.4), rgba(180,83,9,0.2), rgba(194,65,12,0.25))",
      avatarFrame: "rgba(253, 186, 116, 0.35)",
      scorePanelBorder: "rgba(251, 146, 60, 0.35)",
      scorePanelShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 18px 44px -18px rgba(249,115,22,0.22)",
      scoreColor: "#FFEDD5",
      scoreGlow: "0 0 40px rgba(249,115,22,0.45), 0 0 64px rgba(249,115,22,0.2)",
      liveDot: "#FDBA74",
      liveBorder: "rgba(251, 146, 60, 0.45)",
      liveBg: "rgba(249, 115, 22, 0.22)",
      liveColor: "#FFF7ED",
      liveShadow: "0 0 16px rgba(249,115,22,0.35)",
      ctaFrom: "#FFEDD5",
      ctaVia: "#FED7AA",
      ctaTo: "#FDBA74",
      accent: "#FB923C",
      secondary: "#F97316",
    },
    standard: {
      tier: "standard",
      stamp: "I CALLED IT",
      shellBorder: "rgba(255, 255, 255, 0.14)",
      shellBg: "#050508",
      shellShadow:
        "0 0 0 1px rgba(255,255,255,0.07) inset, 0 28px 80px -24px rgba(0,0,0,0.85), 0 0 70px -35px rgba(45,212,191,0.18)",
      ribbonBorder: "rgba(52, 211, 153, 0.35)",
      ribbonBg: "linear-gradient(90deg, rgba(16,185,129,0.22), rgba(45,212,191,0.18))",
      ribbonColor: "#D1FAE5",
      ribbonShadow: "0 0 16px rgba(16,185,129,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
      bracketTL: "rgba(52, 211, 153, 0.45)",
      bracketTR: "rgba(255, 255, 255, 0.2)",
      bracketBL: "rgba(255, 255, 255, 0.18)",
      bracketBR: "rgba(255, 255, 255, 0.15)",
      avatarGlow: "linear-gradient(135deg, rgba(52,211,153,0.22), transparent, rgba(82,82,91,0.15))",
      avatarFrame: "rgba(255, 255, 255, 0.22)",
      scorePanelBorder: "rgba(255, 255, 255, 0.12)",
      scorePanelShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 36px -20px rgba(0,0,0,0.45)",
      scoreColor: "#FFFFFF",
      scoreGlow: "0 0 32px rgba(45,212,191,0.25)",
      liveDot: "#6EE7B7",
      liveBorder: "rgba(52, 211, 153, 0.4)",
      liveBg: "rgba(16, 185, 129, 0.2)",
      liveColor: "#D1FAE5",
      liveShadow: "0 0 16px rgba(16,185,129,0.35)",
      ctaFrom: "rgba(167, 243, 208, 0.9)",
      ctaVia: "rgba(94, 234, 212, 0.9)",
      ctaTo: "rgba(165, 243, 252, 0.9)",
      accent: "#2DD4BF",
      secondary: "#A78BFA",
    },
  };
  return { ...base[tier], num, watermark: `${num}×` };
}
function formatScanDate(iso: string): string {
  try {
    return new Date(iso)
      .toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
      .toUpperCase();
  } catch {
    return "";
  }
}
function bragLine(tier: GainTier, num: string): string {
  if (tier === "champion") return `Called it early — ${num}× peak. This is the flex.`;
  if (tier === "listed") return `Alpha signal confirmed — ${num}× from call.`;
  if (tier === "bronze") return `Solid entry — ${num}× peak since scan.`;
  return `On-chain call logged — tracking from here.`;
}
function CardUnderlay({ theme }: { theme: ReturnType<typeof resolveTheme> }) {
  const gridOpacity = theme.tier === "champion" ? 0.18 : theme.tier === "standard" ? 0.08 : 0.14;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: "inherit" }} aria-hidden>
      {theme.tier === "champion" ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(at 30% 20%, rgba(251,191,36,0.45), transparent 35%, rgba(236,72,153,0.2), transparent 55%, rgba(250,204,21,0.25), transparent 75%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(251,191,36,0.45), transparent 55%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 55% 45% at 95% 85%, rgba(236,72,153,0.22), transparent 50%)",
            }}
          />
          <div
            className="absolute bottom-0 top-0 w-[58%]"
            style={{
              left: "-20%",
              transform: "skewX(-14deg)",
              background: "linear-gradient(to bottom right, rgba(251,191,36,0.35), rgba(234,179,8,0.15), transparent)",
            }}
          />
        </>
      ) : theme.tier === "listed" ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(at 18% 42%, rgba(16,185,129,0.22), transparent 42%, rgba(168,85,247,0.14), transparent 68%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 70% 55% at 12% 50%, rgba(16,185,129,0.32), transparent 58%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 55% 50% at 92% 18%, rgba(236,72,153,0.14), transparent 55%)",
            }}
          />
          <div
            className="absolute bottom-0 top-0 w-[52%] opacity-90"
            style={{
              left: "-18%",
              transform: "skewX(-12deg)",
              background: "linear-gradient(to bottom right, rgba(16,185,129,0.22), rgba(20,184,166,0.1), transparent)",
            }}
          />
        </>
      ) : theme.tier === "bronze" ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(at 20% 40%, rgba(249,115,22,0.28), transparent 42%, rgba(180,83,9,0.18), transparent 68%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 72% 52% at 14% 48%, rgba(234,88,12,0.32), transparent 54%)",
            }}
          />
          <div
            className="absolute bottom-0 top-0 w-[50%]"
            style={{
              left: "-18%",
              transform: "skewX(-12deg)",
              background: "linear-gradient(to bottom right, rgba(249,115,22,0.26), rgba(180,83,9,0.12), transparent)",
            }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(16,185,129,0.08), transparent 50%)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom right, rgba(24,24,27,0.8), #000000)" }} />
          <div
            className="absolute bottom-0 top-0 w-[45%]"
            style={{
              left: "-16%",
              transform: "skewX(-10deg)",
              background: "linear-gradient(to bottom right, rgba(5,150,105,0.1), transparent)",
            }}
          />
        </>
      )}
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: gridOpacity,
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {theme.tier !== "standard" ? (
        <div
          className="absolute bottom-0 top-0 w-[46%] border-r"
          style={{
            left: "-14%",
            transform: "skewX(-12deg)",
            borderColor: "rgba(255,255,255,0.07)",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)",
          }}
        />
      ) : null}
      {/* Corner brackets */}
      {[
        { top: 28, left: 28, borders: ["borderLeft", "borderTop"], color: theme.bracketTL },
        { top: 28, right: 28, borders: ["borderRight", "borderTop"], color: theme.bracketTR },
        { bottom: 28, left: 28, borders: ["borderLeft", "borderBottom"], color: theme.bracketBL },
        { bottom: 28, right: 28, borders: ["borderRight", "borderBottom"], color: theme.bracketBR },
      ].map((corner, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: corner.top,
            left: corner.left,
            right: corner.right,
            bottom: corner.bottom,
            width: theme.tier === "champion" ? 28 : 24,
            height: theme.tier === "champion" ? 28 : 24,
            borderTop: corner.borders.includes("borderTop") ? `3px solid ${corner.color}` : undefined,
            borderBottom: corner.borders.includes("borderBottom") ? `3px solid ${corner.color}` : undefined,
            borderLeft: corner.borders.includes("borderLeft") ? `3px solid ${corner.color}` : undefined,
            borderRight: corner.borders.includes("borderRight") ? `3px solid ${corner.color}` : undefined,
            boxShadow: theme.tier === "champion" && i < 2 ? `0 0 12px ${corner.color}` : undefined,
          }}
        />
      ))}
      {/* Watermark */}
      {theme.tier === "champion" ? (
        <>
          <span
            className="absolute select-none font-black leading-none"
            style={{
              right: 16,
              bottom: "-8%",
              fontSize: 280,
              letterSpacing: "-0.06em",
              color: "rgba(251, 191, 36, 0.09)",
            }}
          >
            {theme.num}
          </span>
          <span
            className="absolute select-none font-black uppercase"
            style={{
              right: "8%",
              top: "18%",
              transform: "rotate(-8deg)",
              fontSize: 18,
              letterSpacing: "0.35em",
              color: "rgba(253, 224, 71, 0.12)",
            }}
          >
            KING
          </span>
        </>
      ) : (
        <span
          className="absolute select-none font-black uppercase leading-none"
          style={{
            right: 24,
            bottom: "-6%",
            fontSize: 240,
            letterSpacing: "-0.06em",
            color:
              theme.tier === "listed"
                ? "rgba(52, 211, 153, 0.07)"
                : theme.tier === "bronze"
                  ? "rgba(251, 146, 60, 0.09)"
                  : "rgba(255, 255, 255, 0.04)",
          }}
        >
          {theme.tier === "listed" || theme.tier === "standard" ? "α" : theme.num}
        </span>
      )}
      <span
        className="absolute select-none whitespace-nowrap font-black uppercase"
        style={{
          right: "12%",
          top: "50%",
          transform: "translateY(-50%) rotate(-12deg)",
          fontSize: 16,
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.035)",
        }}
      >
        {theme.tier !== "standard" ? "SIGNAL" : "PUMPFUN"}
      </span>
      {theme.tier === "champion" ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(-18deg, transparent, transparent 38px, rgba(251,191,36,0.03) 38px, rgba(251,191,36,0.03) 39px)",
          }}
        />
      ) : null}
    </div>
  );
}
function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        minWidth: 0,
        flex: 1,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.35)",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          fontFamily: FONT_MONO,
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </p>
      <p
        style={{
          marginTop: 10,
          fontFamily: FONT_MONO,
          fontSize: 24,
          fontWeight: 700,
          color: accent ?? "#FFFFFF",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </p>
    </div>
  );
}
export interface PumpfunCallShareCardProps {
  record: PumpfunScanRecord;
  className?: string;
}
export const PumpfunCallShareCard = forwardRef<HTMLDivElement, PumpfunCallShareCardProps>(
  function PumpfunCallShareCard({ record, className }, ref) {
    const peakGain = record.peakGainMultiplier ?? record.gainMultiplier;
    const theme = resolveTheme(peakGain);
    const scannedDate = formatScanDate(record.scannedAt);
    const scoreBarWidth = Math.max(5, Math.min(100, record.syraAlphaScore));
    const scoreTone =
      record.syraAlphaScore >= 75 ? "up" : record.syraAlphaScore >= 50 ? "neutral" : "down";
    const showRibbon = theme.tier !== "standard";
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        style={{
          width: PUMPFUN_CALL_SHARE_WIDTH,
          height: PUMPFUN_CALL_SHARE_HEIGHT,
          background: PUMPFUN_CALL_SHARE_BG,
          color: "#FFFFFF",
          fontFamily: FONT_DISPLAY,
          padding: 40,
          boxSizing: "border-box",
        }}
        data-export-bg={PUMPFUN_CALL_SHARE_BG}
      >
        {/* Card shell — UpOnly BragCard frame */}
        <div
          className="relative flex h-full w-full flex-col overflow-hidden"
          style={{
            borderRadius: 52,
            border: `1px solid ${theme.shellBorder}`,
            background: theme.shellBg,
            boxShadow: theme.shellShadow,
          }}
        >
          <CardUnderlay theme={theme} />
          {/* Ribbon */}
          {showRibbon ? (
            <div
              className="absolute z-20 flex justify-center"
              style={{
                left: theme.tier === "champion" ? 0 : 48,
                right: theme.tier === "champion" ? 0 : undefined,
                top: theme.tier === "champion" ? 36 : 40,
              }}
            >
              <div
                style={{
                  borderRadius: 999,
                  border: `1px solid ${theme.ribbonBorder}`,
                  background: theme.ribbonBg,
                  color: theme.ribbonColor,
                  boxShadow: theme.ribbonShadow,
                  padding: "12px 32px",
                  fontFamily: FONT_MONO,
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                {theme.stamp}
              </div>
            </div>
          ) : null}
          {/* Landscape split */}
          <div
            className="relative z-10 flex min-h-0 flex-1 flex-row"
            style={{
              paddingTop: showRibbon ? (theme.tier === "champion" ? 100 : 88) : 48,
            }}
          >
            {/* Identity rail */}
            <div
              className="flex shrink-0 flex-col justify-center"
              style={{
                width: "38%",
                maxWidth: 720,
                borderRight: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.2), transparent)",
                padding: "40px 48px",
                gap: 24,
              }}
            >
              <p
                style={{
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  color: theme.accent,
                  textShadow: `0 0 20px ${theme.accent}44`,
                }}
              >
                SYRA
              </p>
              <div className="relative mx-auto flex flex-col items-center">
                <div
                  className="absolute rounded-[40px] blur-3xl"
                  style={{
                    inset: -24,
                    background: theme.avatarGlow,
                    opacity: 0.85,
                  }}
                />
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 32,
                    border: `2px solid ${theme.avatarFrame}`,
                    boxShadow: `0 16px 50px -6px ${theme.accent}55, 0 0 0 4px rgba(255,255,255,0.06)`,
                    background: "#0a0a0a",
                  }}
                >
                  {record.imageUri ? (
                    <img
                      src={record.imageUri}
                      alt=""
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center font-black"
                      style={{ fontSize: 64, color: theme.accent }}
                    >
                      {record.symbol.slice(0, 2)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 900,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                  }}
                >
                  ${record.symbol}
                </span>
                <p
                  style={{
                    maxWidth: 420,
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: 1.3,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {record.name}
                </p>
                <p
                  style={{
                    marginTop: 4,
                    fontFamily: FONT_MONO,
                    fontSize: 16,
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {scannedDate}
                </p>
              </div>
            </div>
            {/* Alpha dashboard */}
            <div
              className="flex min-w-0 flex-1 flex-col justify-between"
              style={{ padding: "36px 48px 40px" }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between" style={{ gap: 24 }}>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    PUMPFUN ALPHA
                  </p>
                  <p style={{ marginTop: 4, fontSize: 16, color: "rgba(255,255,255,0.45)" }}>
                    Syra on-chain call tracker
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    flexShrink: 0,
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    border: `1px solid ${theme.liveBorder}`,
                    background: theme.liveBg,
                    color: theme.liveColor,
                    boxShadow: theme.liveShadow,
                    padding: "8px 18px",
                    fontFamily: FONT_MONO,
                    fontSize: 14,
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: theme.liveDot,
                      boxShadow: `0 0 10px ${theme.liveDot}`,
                    }}
                  />
                  LIVE
                </span>
              </div>
              {/* Peak multiplier panel */}
              <div
                className="relative"
                style={{
                  marginTop: 28,
                  borderRadius: 24,
                  border: `1px solid ${theme.scorePanelBorder}`,
                  background: "linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(255,255,255,0.04), rgba(0,0,0,0.4))",
                  boxShadow: theme.scorePanelShadow,
                  padding: "28px 32px",
                }}
              >
                <div
                  className="absolute rounded-full blur-2xl"
                  style={{
                    right: -4,
                    top: -4,
                    width: 80,
                    height: 80,
                    background: `linear-gradient(to bottom right, ${theme.accent}44, transparent)`,
                  }}
                />
                <div className="relative flex items-end justify-between gap-4">
                  <div>
                    <p
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 14,
                        fontWeight: 900,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      PEAK MULTIPLIER
                    </p>
                    <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>
                      From call mcap to peak
                    </p>
                  </div>
                  <div className="flex items-start" style={{ lineHeight: 1 }}>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 160,
                        fontWeight: 900,
                        letterSpacing: "-0.06em",
                        color: theme.scoreColor,
                        textShadow: theme.scoreGlow,
                      }}
                    >
                      {theme.num}
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 72,
                        fontWeight: 900,
                        marginTop: 28,
                        marginLeft: 4,
                        color: theme.accent,
                        textShadow: theme.scoreGlow,
                      }}
                    >
                      ×
                    </span>
                  </div>
                </div>
                {/* Syra score bar */}
                <div style={{ marginTop: 24 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                    <p
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      SYRA ALPHA SCORE
                    </p>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 22,
                        fontWeight: 800,
                        color: theme.accent,
                      }}
                    >
                      {record.syraAlphaScore}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: "rgba(24,24,27,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${scoreBarWidth}%`,
                        borderRadius: 999,
                        background:
                          scoreTone === "up"
                            ? "linear-gradient(to right, #34D399, #2DD4BF, #67E8F9)"
                            : scoreTone === "neutral"
                              ? "#A1A1AA"
                              : "linear-gradient(to right, #F43F5E, #FB923C)",
                        boxShadow: scoreTone === "up" ? "0 0 12px rgba(52,211,153,0.5)" : undefined,
                      }}
                    />
                  </div>
                </div>
              </div>
              <p
                style={{
                  marginTop: 20,
                  fontSize: 20,
                  fontWeight: 600,
                  fontStyle: "italic",
                  lineHeight: 1.4,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {bragLine(theme.tier, theme.num)}
              </p>
              {/* Stat grid */}
              <div className="flex gap-3" style={{ marginTop: 20 }}>
                <StatTile label="Called at" value={formatCompactUsd(record.scanMarketCapUsd)} />
                <StatTile label="Peak mcap" value={formatCompactUsd(record.peakMarketCapUsd)} accent={theme.accent} />
                <StatTile label="Now" value={formatCompactUsd(record.currentMarketCapUsd)} accent={theme.secondary} />
                <StatTile label="Verdict" value={record.syraAlphaVerdict.slice(0, 12)} accent="#FFFFFF" />
              </div>
              {/* Footer */}
              <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.09)", paddingTop: 20 }}>
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 26,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: theme.ctaFrom,
                    textShadow: `0 0 24px ${theme.accent}44`,
                  }}
                >
                  I called ${record.symbol} on Syra — syra.ai/pumpfun
                </p>
                <div
                  className="flex flex-wrap items-center justify-center"
                  style={{ marginTop: 10, gap: "8px 16px", fontSize: 15, color: "rgba(255,255,255,0.35)" }}
                >
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Caller</span>
                  <span style={{ fontFamily: FONT_MONO, color: "rgba(255,255,255,0.55)" }}>
                    {truncateWallet(record.callerWallet, 6)}
                  </span>
                  <span>·</span>
                  <span style={{ fontFamily: FONT_MONO, letterSpacing: "0.1em" }}>NFA · DYOR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
