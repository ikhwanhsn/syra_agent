import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cn } from "@/lib/utils";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

interface RemotionRevealContextValue {
  enabled: true;
}

const RemotionRevealContext = createContext<RemotionRevealContextValue | null>(null);

export function RemotionRevealProvider({ children }: { children: ReactNode }) {
  return (
    <RemotionRevealContext.Provider value={{ enabled: true }}>
      {children}
    </RemotionRevealContext.Provider>
  );
}

export function useIsRemotionReveal(): boolean {
  return useContext(RemotionRevealContext) !== null;
}

export function useRevealFrameStyle(delayMs = 0): CSSProperties {
  const theme = SYRA_VIDEO_THEME;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayFrames = Math.round((delayMs / 1000) * fps);
  const localFrame = frame - delayFrames;

  if (localFrame <= 0) {
    return {
      opacity: 0,
      transform: `translateY(${theme.revealOffsetY}px) scale(0.985)`,
      transformOrigin: "center",
    };
  }

  const progress = spring({
    frame: localFrame,
    fps,
    config: theme.spring.reveal,
    durationInFrames: 22,
  });

  const y = interpolate(progress, [0, 1], [theme.revealOffsetY, 0]);
  const scale = interpolate(progress, [0, 1], [0.985, 1]);

  return {
    opacity: progress,
    transform: `translateY(${y}px) scale(${scale})`,
    transformOrigin: "center",
  };
}

interface RemotionRevealProps {
  delayMs?: number;
  className?: string;
  children: ReactNode;
}

export function RemotionReveal({ delayMs = 0, className, children }: RemotionRevealProps) {
  const style = useRevealFrameStyle(delayMs);
  return (
    <div className={cn("post-reveal", className)} style={style}>
      {children}
    </div>
  );
}
