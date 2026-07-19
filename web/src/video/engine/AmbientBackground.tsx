import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

/**
 * Full-bleed stage wash as SVG.
 * Preview paints SVG in the DOM; @remotion/web-renderer captures SVG as native
 * pixels — so download matches Player. CSS `background-image` gradients are
 * re-drawn by the DOM composer and look too bold on export.
 */
export function AmbientBackground() {
  const theme = SYRA_VIDEO_THEME;
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / fps;
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.45);
  const topGold = 0.045 + pulse * 0.015;
  const gradId = "syra-video-ambient-wash";

  return (
    <AbsoluteFill
      style={{
        width,
        height,
        backgroundColor: theme.bg,
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "block",
        }}
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F3BA2F" stopOpacity={topGold} />
            <stop offset="38%" stopColor={theme.bg} stopOpacity={1} />
            <stop offset="62%" stopColor={theme.bg} stopOpacity={1} />
            <stop offset="100%" stopColor="#000000" stopOpacity={1} />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill={theme.bg} />
        <rect width={width} height={height} fill={`url(#${gradId})`} />
        <rect width={width} height={2} fill={theme.accent} opacity={0.2} />
      </svg>
    </AbsoluteFill>
  );
}
