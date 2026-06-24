import { forwardRef, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { formatCompactUsd, type PumpfunScanRecord } from "@/lib/pumpfunScanHistoryApi";
import {
  PUMPFUN_CALL_SHARE_BG,
  PUMPFUN_CALL_SHARE_HEIGHT,
  PUMPFUN_CALL_SHARE_WIDTH,
} from "@/components/pumpfun/pumpfunCallShareDimensions";

export const FONT_DISPLAY = '"Space Grotesk", system-ui, sans-serif';
export const FONT_MONO = '"JetBrains Mono", "Fira Code", monospace';

export const EMERALD = "#34D399";
export const EMERALD_BRIGHT = "#6EE7B7";
export const EMERALD_DIM = "#10B981";
export const EMERALD_MUTED = "rgba(52, 211, 153, 0.1)";
export const EMERALD_BORDER = "rgba(52, 211, 153, 0.22)";
export const GLASS_BG = "rgba(255, 255, 255, 0.03)";
export const GLASS_BORDER = "rgba(255, 255, 255, 0.08)";

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
        className={cn("relative overflow-hidden", className)}
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
            boxShadow: `0 0 0 1px rgba(52,211,153,0.06) inset, 0 32px 80px -20px rgba(0,0,0,0.8)`,
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
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
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
        border: `1px solid ${GLASS_BORDER}`,
        background: GLASS_BG,
        padding: "5px 10px",
        fontFamily: FONT_MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.55)",
      }}
    >
      {children}
    </span>
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
            "radial-gradient(ellipse 55% 45% at 72% 38%, rgba(52,211,153,0.14), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 40% 35% at 15% 80%, rgba(16,185,129,0.06), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          opacity: 0.35,
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
  const glowId = `mcap-glow-${uid}`;

  return (
    <svg width={width} height={height} aria-hidden style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={EMERALD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={EMERALD} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={areaPath} fill={`url(#${areaId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={EMERALD}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
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

export function ShareStatsRow({ record }: { record: PumpfunScanRecord }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${GLASS_BORDER}`,
        background: GLASS_BG,
        padding: "24px 20px",
      }}
    >
      <div className="flex items-center">
        <ShareStat label="Entry" value={formatCompactUsd(record.scanMarketCapUsd)} />
        <div style={{ width: 1, height: 52, background: "rgba(255,255,255,0.07)" }} />
        <ShareStat
          label="Peak"
          value={formatCompactUsd(record.peakMarketCapUsd)}
          accent={EMERALD_BRIGHT}
        />
        <div style={{ width: 1, height: 52, background: "rgba(255,255,255,0.07)" }} />
        <ShareStat
          label="Current"
          value={formatCompactUsd(record.currentMarketCapUsd)}
          accent="rgba(255,255,255,0.9)"
        />
        <div style={{ width: 1, height: 52, background: "rgba(255,255,255,0.07)" }} />
        <ShareStat
          label="Confidence"
          value={`${record.syraAlphaScore}/100`}
          accent={EMERALD}
        />
      </div>
    </div>
  );
}
