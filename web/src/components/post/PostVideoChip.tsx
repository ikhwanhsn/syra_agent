import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { useIsRemotionReveal } from "@/video/engine/revealContext";
import { cn } from "@/lib/utils";

/** Solid hex chip look — CSS path for non-SVG fallbacks. */
export const REMOTION_CHIP_STYLE: CSSProperties = {
  display: "inline-flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 14,
  paddingRight: 14,
  borderRadius: 8,
  borderStyle: "solid",
  borderWidth: 2,
  borderColor: "#F3BA2F",
  backgroundColor: "#2A2208",
  color: "#F3BA2F",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
  boxShadow: "none",
  whiteSpace: "nowrap",
  textDecoration: "none",
};

export function useRemotionChipStyle(): CSSProperties | undefined {
  return useIsRemotionReveal() ? REMOTION_CHIP_STYLE : undefined;
}

/**
 * Draw chip as SVG so @remotion/web-renderer captures native pixels
 * (DOM composer mangles rounded-full / thin capsule borders).
 */
function RemotionSvgChip({
  text,
  showDot,
}: {
  text: string;
  showDot: boolean;
}) {
  const label = text.toUpperCase();
  const fontSize = 12;
  const letterSpacing = 1.5;
  const padX = 16;
  const height = 34;
  const stroke = 2.5;
  const dotSize = 6;
  const gap = 8;
  // Mono width estimate — keeps the capsule tight without measuring DOM.
  const textWidth = label.length * (fontSize * 0.64) + Math.max(0, label.length - 1) * letterSpacing;
  const contentWidth = (showDot ? dotSize + gap : 0) + textWidth;
  // Extra slack so glyphs / interpuncts never clip the stroke.
  const width = Math.ceil(padX * 2 + contentWidth + stroke + 10);
  const midY = height / 2;
  const textX = padX + (showDot ? dotSize + gap : 0);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="post-video-chip"
      role="img"
    >
      <title>{label}</title>
      <rect
        x={stroke / 2}
        y={stroke / 2}
        width={width - stroke}
        height={height - stroke}
        rx={8}
        ry={8}
        fill="#2A2208"
        stroke="#F3BA2F"
        strokeWidth={stroke}
      />
      {showDot ? (
        <rect
          x={padX}
          y={midY - dotSize / 2}
          width={dotSize}
          height={dotSize}
          rx={1.5}
          fill="#F3BA2F"
        />
      ) : null}
      <text
        x={textX}
        y={midY}
        fill="#F3BA2F"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        fontSize={fontSize}
        fontWeight={600}
        letterSpacing={letterSpacing}
        dominantBaseline="central"
        textAnchor="start"
      >
        {label}
      </text>
    </svg>
  );
}

/**
 * Chip / badge that stays crisp in @remotion/web-renderer export.
 * Preview (Player) and download both use the SVG path inside Remotion.
 */
export function PostVideoChip({
  children,
  className,
  showDot = false,
}: {
  children: ReactNode;
  className?: string;
  showDot?: boolean;
}) {
  const remotion = useIsRemotionReveal();

  if (!remotion) {
    return (
      <span
        className={cn(
          "post-badge-bnb inline-flex items-center gap-2 rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F3BA2F]/90",
          className,
        )}
      >
        {showDot ? (
          <span className="post-pulse-dot h-1.5 w-1.5 rounded-full bg-[#F3BA2F]" aria-hidden />
        ) : null}
        {children}
      </span>
    );
  }

  if (typeof children === "string") {
    return <RemotionSvgChip text={children} showDot={showDot} />;
  }

  return (
    <span className={cn("post-video-chip", className)} style={REMOTION_CHIP_STYLE}>
      {showDot ? (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 2,
            backgroundColor: "#F3BA2F",
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}

/** External-link affordance — unicode arrow (Lucide SVG strokes break in web-renderer). */
export function PostVideoLinkArrow({ className }: { className?: string }) {
  const remotion = useIsRemotionReveal();
  if (!remotion) {
    return null;
  }
  return (
    <span
      className={className}
      aria-hidden
      style={{
        color: "#F3BA2F",
        fontSize: 14,
        lineHeight: 1,
        fontWeight: 600,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      ↗
    </span>
  );
}

/** Primary CTA — SVG capsule so download matches Player. */
export function PostVideoCtaLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const remotion = useIsRemotionReveal();

  if (!remotion) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("post-slide-cta-primary", className)}
      >
        {label}
        <ArrowUpRight className="h-4 w-4" />
      </a>
    );
  }

  const fontSize = 11;
  const letterSpacing = 1.4;
  const padX = 16;
  const height = 36;
  const stroke = 2;
  const arrowGap = 10;
  const arrowW = 12;
  const upper = label.toUpperCase();
  const textWidth =
    upper.length * (fontSize * 0.62) + Math.max(0, upper.length - 1) * letterSpacing;
  const width = Math.ceil(padX * 2 + textWidth + arrowGap + arrowW + stroke);
  const midY = height / 2;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("post-video-cta", className)}
      style={{ display: "inline-block", lineHeight: 0, textDecoration: "none" }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
        <title>{upper}</title>
        <rect
          x={stroke / 2}
          y={stroke / 2}
          width={width - stroke}
          height={height - stroke}
          rx={8}
          ry={8}
          fill="#2A2208"
          stroke="#F3BA2F"
          strokeWidth={stroke}
        />
        <text
          x={padX}
          y={midY}
          fill="#F3BA2F"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          fontSize={fontSize}
          fontWeight={600}
          letterSpacing={letterSpacing}
          dominantBaseline="central"
        >
          {upper}
        </text>
        <text
          x={width - padX}
          y={midY}
          fill="#F3BA2F"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize={14}
          fontWeight={600}
          dominantBaseline="central"
          textAnchor="end"
        >
          ↗
        </text>
      </svg>
    </a>
  );
}
