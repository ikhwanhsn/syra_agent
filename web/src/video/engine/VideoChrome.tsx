import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

/**
 * Quiet brand mark. Uses Remotion <Img> so export waits for the asset.
 * All styles are web-renderer–safe (no radial-gradient / mix-blend / z-index).
 */
export function VideoChrome() {
  const theme = SYRA_VIDEO_THEME;
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const chromeIn = spring({
    frame,
    fps,
    config: theme.spring.chrome,
    durationInFrames: 18,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none", width, height }}>
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 24,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          opacity: chromeIn * 0.9,
          transform: `translateY(${interpolate(chromeIn, [0, 1], [-6, 0])}px)`,
        }}
      >
        <Img
          src="/images/logo.jpg"
          alt=""
          width={18}
          height={18}
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            border: "1px solid #333333",
            objectFit: "cover",
            display: "block",
          }}
        />
        <span
          style={{
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "#F2F2F2",
          }}
        >
          Syra
        </span>
      </div>
    </AbsoluteFill>
  );
}
