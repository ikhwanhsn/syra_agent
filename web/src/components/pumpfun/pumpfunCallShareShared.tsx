import { forwardRef, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { formatCompactUsd, type PumpfunScanRecord } from "@/lib/pumpfunScanHistoryApi";
import {
  PUMPFUN_CALL_SHARE_BG,
  PUMPFUN_CALL_SHARE_HEIGHT,
  PUMPFUN_CALL_SHARE_SITE_PATH,
  PUMPFUN_CALL_SHARE_WIDTH,
} from "@/components/pumpfun/pumpfunCallShareDimensions";

export const FONT_DISPLAY = '"Space Grotesk", system-ui, sans-serif';
export const FONT_MONO = '"JetBrains Mono", "Fira Code", monospace';

export const EMERALD = "#34D399";
export const EMERALD_BRIGHT = "#6EE7B7";
export const EMERALD_NEON = "#39FF14";
export const EMERALD_DIM = "#10B981";
export const EMERALD_MUTED = "rgba(57, 255, 20, 0.12)";
export const EMERALD_BORDER = "rgba(57, 255, 20, 0.28)";
export const GLASS_BG = "rgba(255, 255, 255, 0.05)";
export const GLASS_BORDER = "rgba(255, 255, 255, 0.1)";

export type McapStep = { label: string; value: number };

export interface ShareCardDerived {
  peakGain: number | null;
  multiplierDisplay: string;
  percentGain: string;
  scannedDate: string;
  statusBadge: string;
  mcapSteps: McapStep[];
}

export function formatScanDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function formatMultiplierDisplay(multiplier: number | null | undefined): string {
  if (multiplier == null || !Number.isFinite(multiplier) || multiplier < 1) return "—";
  if (multiplier >= 100) return `${Math.round(multiplier)}.0`;
  return multiplier.toFixed(1);
}

export function formatPercentGain(multiplier: number | null | undefined): string {
  if (multiplier == null || !Number.isFinite(multiplier) || multiplier < 1) return "—";
  const pct = (multiplier - 1) * 100;
  if (pct >= 10_000) return `+${Math.round(pct).toLocaleString()}%`;
  if (pct >= 1000) return `+${Math.round(pct)}%`;
  if (pct >= 100) return `+${Math.round(pct)}%`;
  return `+${pct.toFixed(1)}%`;
}

export function resolveStatusBadge(
  peakGain: number | null | undefined,
  score: number,
): string {
  const m = peakGain ?? 1;
  if (m >= 10 && score >= 70) return "ALPHA VERIFIED";
  if (m >= 2) return "SUCCESSFUL CALL";
  if (score >= 75) return "HIGH CONVICTION";
  return "AGENT SIGNAL CONFIRMED";
}

export function buildMcapSteps(record: PumpfunScanRecord): McapStep[] {
  const steps: McapStep[] = [];
  const entry = record.scanMarketCapUsd;
  const current = record.currentMarketCapUsd;
  const peak = record.peakMarketCapUsd;

  if (entry != null && Number.isFinite(entry)) {
    steps.push({ label: "Entry", value: entry });
  }
  if (
    current != null &&
    Number.isFinite(current) &&
    entry != null &&
    current > entry * 1.05 &&
    (peak == null || current < peak * 0.95)
  ) {
    steps.push({ label: "Current", value: current });
  }
  if (peak != null && Number.isFinite(peak)) {
    steps.push({ label: "Peak", value: peak });
  }
  return steps;
}

export function deriveShareCardData(record: PumpfunScanRecord): ShareCardDerived {
  const peakGain = record.peakGainMultiplier ?? record.gainMultiplier;
  return {
    peakGain,
    multiplierDisplay: formatMultiplierDisplay(peakGain),
    percentGain: formatPercentGain(peakGain),
    scannedDate: formatScanDate(record.scannedAt),
    statusBadge: resolveStatusBadge(peakGain, record.syraAlphaScore),
    mcapSteps: buildMcapSteps(record),
  };
}

export interface ShareCardFrameProps {
  className?: string;
  innerRadius?: number;
  borderColor?: string;
  children: ReactNode;
}

export const ShareCardFrame = forwardRef<HTMLDivElement, ShareCardFrameProps>(
  function ShareCardFrame(
    { className, innerRadius = 36, borderColor = EMERALD_BORDER, children },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn("pumpfun-call-share-canvas relative overflow-hidden", className)}
        style={{
          width: PUMPFUN_CALL_SHARE_WIDTH,
          height: PUMPFUN_CALL_SHARE_HEIGHT,
          background: PUMPFUN_CALL_SHARE_BG,
          color: "#FFFFFF",
          fontFamily: FONT_DISPLAY,
          padding: 44,
          boxSizing: "border-box",
        }}
        data-export-bg={PUMPFUN_CALL_SHARE_BG}
      >
        <div
          className="relative flex h-full w-full flex-col overflow-hidden"
          style={{
            borderRadius: innerRadius,
            border: `1px solid ${borderColor}`,
            background: "#030303",
            boxShadow: `0 0 0 1px rgba(57,255,20,0.08) inset, 0 0 48px rgba(57,255,20,0.06), 0 32px 80px -20px rgba(0,0,0,0.8)`,
          }}
        >
          {children}
        </div>
      </div>
    );
  },
);

export function TokenAvatar({
  record,
  size,
  radius,
}: {
  record: PumpfunScanRecord;
  size: number;
  radius: number;
}) {
  return (
    <div
      className="overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        border: `1px solid ${EMERALD_BORDER}`,
        background: "#0a0a0a",
        boxShadow: `0 0 48px ${EMERALD_MUTED}`,
        flexShrink: 0,
      }}
    >
      {record.imageUri ? (
        <img
          src={record.imageUri}
          alt=""
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-bold"
          style={{ fontSize: size * 0.32, color: EMERALD }}
        >
          {record.symbol.slice(0, 2)}
        </div>
      )}
    </div>
  );
}

export function GlassBadge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 6,
        border: `1px solid ${EMERALD_BORDER}`,
        background: "rgba(57, 255, 20, 0.06)",
        padding: "5px 10px",
        fontFamily: FONT_MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.72)",
      }}
    >
      {children}
    </span>
  );
}

export function AgentTerminalBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        border: `1px solid ${GLASS_BORDER}`,
        background: GLASS_BG,
        padding: "8px 16px",
        fontFamily: FONT_MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.55)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: EMERALD_NEON,
          boxShadow: `0 0 12px ${EMERALD_NEON}`,
          flexShrink: 0,
        }}
      />
      Agent Terminal
    </span>
  );
}

export function ShareCardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center" style={{ gap: 16 }}>
        <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.22em", color: EMERALD_NEON }}>SYRA</p>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)" }} />
        <p
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Pay-per-call crypto APIs for agents
        </p>
      </div>
      <AgentTerminalBadge />
    </div>
  );
}

function ShareStatIconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={EMERALD} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke={EMERALD} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill={EMERALD} />
    </svg>
  );
}

function ShareStatIconTrend() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 16l6-6 4 4 6-8" stroke={EMERALD_BRIGHT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6h5v5" stroke={EMERALD_BRIGHT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareStatIconPulse() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12h3l2-5 4 10 2-5h5"
        stroke={EMERALD_BRIGHT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareStatIconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"
        stroke={EMERALD}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke={EMERALD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShareStatWithIcon({
  label,
  value,
  accent,
  icon,
  valueSize = 30,
}: {
  label: string;
  value: string;
  accent?: string;
  icon: ReactNode;
  valueSize?: number;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, padding: "0 12px" }}>
      <div style={{ flexShrink: 0, opacity: 0.95 }}>{icon}</div>
      <div style={{ minWidth: 0, textAlign: "left" }}>
        <p
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.38)",
          }}
        >
          {label}
        </p>
        <p
          style={{
            marginTop: 8,
            fontFamily: FONT_MONO,
            fontSize: valueSize,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: accent ?? "#FFFFFF",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function ShareWaveform({ bars = 28, height = 44 }: { bars?: number; height?: number }) {
  const heights = Array.from({ length: bars }, (_, i) => {
    const wave = Math.sin(i * 0.55) * 0.32 + Math.cos(i * 0.31) * 0.18;
    return Math.max(0.12, 0.38 + wave + ((i * 5) % 11) / 36);
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height, flex: 1, minWidth: 0 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            maxWidth: 5,
            height: Math.max(6, h * height),
            borderRadius: 999,
            background: `linear-gradient(to top, ${EMERALD_DIM}, ${EMERALD_NEON})`,
            opacity: 0.35 + (i % 3) * 0.12,
            boxShadow: i % 4 === 0 ? `0 0 10px ${EMERALD_MUTED}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function ShareCardFooter({ symbol, verdict }: { symbol: string; verdict?: string }) {
  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 16,
        border: `1px solid ${GLASS_BORDER}`,
        background: GLASS_BG,
        padding: "16px 20px 14px",
        flexShrink: 0,
      }}
    >
      <div className="flex items-center" style={{ gap: 14 }}>
        <ShareWaveform bars={18} height={32} />
        <div style={{ flexShrink: 0, textAlign: "center", maxWidth: 720 }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.3 }}>
            Agent discovered {symbol} before the market.
          </p>
          <p style={{ marginTop: 6, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            Machine-generated alpha. Human-verified conviction.
          </p>
          {verdict ? (
            <p
              style={{
                marginTop: 8,
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              Agent conviction · {verdict}
            </p>
          ) : null}
          <p style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 12, color: EMERALD_DIM }}>
            {PUMPFUN_CALL_SHARE_SITE_PATH}
          </p>
        </div>
        <ShareWaveform bars={18} height={32} />
      </div>
    </div>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        border: `1px solid ${EMERALD_BORDER}`,
        background: "rgba(57, 255, 20, 0.08)",
        boxShadow: `0 0 24px rgba(57,255,20,0.15)`,
        padding: "10px 22px",
        fontFamily: FONT_MONO,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: EMERALD_BRIGHT,
      }}
    >
      <span style={{ color: EMERALD_NEON }}>✓</span>
      {children}
    </div>
  );
}

export function ShareProfilePanel({
  record,
  scannedDate,
  statusBadge,
}: {
  record: PumpfunScanRecord;
  scannedDate: string;
  statusBadge: string;
}) {
  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderRadius: 20,
        border: `1px solid ${GLASS_BORDER}`,
        background: GLASS_BG,
        padding: "24px 22px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        boxShadow: `0 0 40px rgba(0,0,0,0.35) inset`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <TokenAvatar record={record} size={160} radius={28} />
        <div style={{ textAlign: "center", width: "100%", marginTop: 16 }}>
          <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            {record.symbol}
          </p>
          <p
            style={{
              marginTop: 6,
              fontSize: 16,
              fontWeight: 600,
              color: EMERALD_BRIGHT,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {record.name}
          </p>
          <div className="flex flex-wrap items-center justify-center" style={{ marginTop: 16, gap: 8 }}>
            <GlassBadge>Solana</GlassBadge>
            <GlassBadge>Pump.fun</GlassBadge>
          </div>
          <p
            style={{
              marginTop: 16,
              fontFamily: FONT_MONO,
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Agent discovery · {scannedDate}
          </p>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          borderRadius: 12,
          border: `1px solid ${EMERALD_BORDER}`,
          background: "rgba(57, 255, 20, 0.06)",
          padding: "12px 14px",
          textAlign: "center",
          fontFamily: FONT_MONO,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: EMERALD_BRIGHT,
        }}
      >
        ✓ {statusBadge}
      </div>
    </div>
  );
}

export function ShareMcapInset({ steps }: { steps: McapStep[] }) {
  if (steps.length < 2) return null;

  return (
    <div
      className="flex items-center"
      style={{
        marginTop: 16,
        gap: 20,
        borderRadius: 14,
        border: `1px solid ${GLASS_BORDER}`,
        background: "rgba(0,0,0,0.45)",
        padding: "14px 22px",
      }}
    >
      <div className="flex flex-col" style={{ gap: 10 }}>
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center" style={{ gap: 12 }}>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                width: 52,
              }}
            >
              {step.label}
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: i === steps.length - 1 ? 22 : 17,
                fontWeight: i === steps.length - 1 ? 800 : 600,
                color: i === steps.length - 1 ? EMERALD_BRIGHT : "rgba(255,255,255,0.65)",
              }}
            >
              {formatCompactUsd(step.value)}
            </span>
            {i < steps.length - 1 ? (
              <span style={{ color: EMERALD_DIM, opacity: 0.6 }}>↓</span>
            ) : null}
          </div>
        ))}
      </div>
      <McapSparkline steps={steps} width={140} height={80} />
    </div>
  );
}

export function ShareHeroGain({
  multiplierDisplay,
  percentGain,
  statusBadge,
}: {
  multiplierDisplay: string;
  percentGain: string;
  statusBadge: string;
}) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center">
      <div
        className="pointer-events-none absolute"
        aria-hidden
        style={{
          left: "50%",
          top: "46%",
          transform: "translate(-50%, -50%)",
          width: 560,
          height: 360,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${EMERALD_MUTED}, transparent 70%)`,
        }}
      />
      <div className="relative flex flex-col items-center">
        <StatusBadge>{statusBadge}</StatusBadge>
        <p
          style={{
            marginTop: 20,
            fontFamily: FONT_MONO,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Alpha Captured
        </p>
        <div className="flex items-end" style={{ marginTop: 2, lineHeight: 1 }}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 220,
              fontWeight: 800,
              letterSpacing: "-0.06em",
              color: "#FFFFFF",
              textShadow: `0 0 80px rgba(57,255,20,0.35)`,
            }}
          >
            {multiplierDisplay}
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 88,
              fontWeight: 800,
              marginBottom: 32,
              color: EMERALD_NEON,
            }}
          >
            ×
          </span>
        </div>
        <p
          style={{
            fontFamily: FONT_MONO,
            fontSize: 34,
            fontWeight: 800,
            color: EMERALD_BRIGHT,
          }}
        >
          {percentGain}
        </p>
      </div>
    </div>
  );
}

export function SyraAgentMascot() {
  return (
    <div
      className="pointer-events-none"
      aria-hidden
      style={{
        position: "absolute",
        right: 8,
        top: "50%",
        transform: "translateY(-52%)",
        width: 260,
        height: 260,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "10%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${EMERALD_MUTED}, transparent 70%)`,
        }}
      />
      <svg
        viewBox="0 0 320 320"
        width="100%"
        height="100%"
        style={{ position: "relative", filter: "drop-shadow(0 0 20px rgba(57,255,20,0.28))" }}
      >
        <ellipse cx="160" cy="210" rx="92" ry="28" fill="rgba(0,0,0,0.45)" />
        <path
          d="M88 118c8-36 36-58 72-58s64 22 72 58l-12 88c-6 28-30 48-60 48s-54-20-60-48L88 118z"
          fill="#141414"
          stroke={EMERALD_BORDER}
          strokeWidth="2"
        />
        <path d="M98 92l18-34 24 18 22-28 20 36" fill="none" stroke={EMERALD} strokeWidth="3" strokeLinejoin="round" />
        <rect x="108" y="132" width="44" height="28" rx="8" fill="#0a0a0a" stroke={EMERALD_NEON} strokeWidth="2.5" />
        <rect x="168" y="132" width="44" height="28" rx="8" fill="#0a0a0a" stroke={EMERALD_NEON} strokeWidth="2.5" />
        <rect x="114" y="138" width="32" height="16" rx="4" fill={EMERALD_NEON} opacity="0.85" />
        <rect x="174" y="138" width="32" height="16" rx="4" fill={EMERALD_NEON} opacity="0.85" />
        <path d="M132 188c12 10 44 10 56 0" fill="none" stroke={EMERALD} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="128" cy="168" r="4" fill={EMERALD_BRIGHT} />
        <circle cx="192" cy="168" r="4" fill={EMERALD_BRIGHT} />
        <path d="M160 206v18" stroke={EMERALD_DIM} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function ShareStat({
  label,
  value,
  accent,
  valueSize = 34,
}: {
  label: string;
  value: string;
  accent?: string;
  valueSize?: number;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "0 8px" }}>
      <p
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.38)",
        }}
      >
        {label}
      </p>
      <p
        style={{
          marginTop: 12,
          fontFamily: FONT_MONO,
          fontSize: valueSize,
          fontWeight: 800,
          letterSpacing: "-0.02em",
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

export function IntelCardBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 72% 38%, rgba(57,255,20,0.16), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 40% 35% at 15% 80%, rgba(16,185,129,0.08), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          opacity: 0.55,
          backgroundImage:
            "repeating-conic-gradient(from 0deg at 58% 42%, transparent 0deg 8deg, rgba(57,255,20,0.04) 8deg 9deg)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          opacity: 0.28,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
      />
    </>
  );
}

export function McapSparkline({
  steps,
  width,
  height,
}: {
  steps: McapStep[];
  width: number;
  height: number;
}) {
  const uid = useId().replace(/:/g, "");
  if (steps.length < 2) return null;

  const values = steps.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = steps.map((_, i) => {
    const x = padX + (i / (steps.length - 1)) * innerW;
    const y = padY + innerH - ((values[i] - min) / range) * innerH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;
  const areaId = `mcap-area-${uid}`;

  return (
    <svg width={width} height={height} aria-hidden style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={EMERALD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={EMERALD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${areaId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={EMERALD}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 5 : 3.5}
          fill={i === points.length - 1 ? EMERALD_BRIGHT : EMERALD}
          stroke="#030303"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

export function ShareStatsRow({ record, valueSize = 26 }: { record: PumpfunScanRecord; valueSize?: number }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${GLASS_BORDER}`,
        background: GLASS_BG,
        padding: "16px 12px",
        flexShrink: 0,
      }}
    >
      <div className="flex items-center">
        <ShareStatWithIcon
          label="Entry"
          value={formatCompactUsd(record.scanMarketCapUsd)}
          icon={<ShareStatIconTarget />}
          valueSize={valueSize}
        />
        <div style={{ width: 1, height: 56, background: "rgba(255,255,255,0.07)" }} />
        <ShareStatWithIcon
          label="Peak"
          value={formatCompactUsd(record.peakMarketCapUsd)}
          accent={EMERALD_BRIGHT}
          icon={<ShareStatIconTrend />}
          valueSize={valueSize}
        />
        <div style={{ width: 1, height: 56, background: "rgba(255,255,255,0.07)" }} />
        <ShareStatWithIcon
          label="Current"
          value={formatCompactUsd(record.currentMarketCapUsd)}
          accent="rgba(255,255,255,0.9)"
          icon={<ShareStatIconPulse />}
          valueSize={valueSize}
        />
        <div style={{ width: 1, height: 56, background: "rgba(255,255,255,0.07)" }} />
        <ShareStatWithIcon
          label="Confidence"
          value={`${record.syraAlphaScore}/100`}
          accent={EMERALD_NEON}
          icon={<ShareStatIconShield />}
          valueSize={valueSize}
        />
      </div>
    </div>
  );
}
