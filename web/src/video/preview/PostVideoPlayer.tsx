import {
  Component,
  Suspense,
  useState,
  type CSSProperties,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { lazyWithChunkReload } from "@/lib/lazyWithChunkReload";
import type { PostSlide } from "@/content/posts/types";
import { PostDeckVideo } from "@/video/compositions/PostDeckVideo";
import {
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_LAYOUT_WIDTH,
} from "@/video/constants";
import { getDeckDurationInFrames, POST_VIDEO_FPS } from "@/video/engine/timing";

const RemotionPlayer = lazyWithChunkReload(() =>
  import("@remotion/player").then((m) => ({ default: m.Player })),
);

export interface PostVideoPlayerProps {
  slides: PostSlide[];
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  className?: string;
  style?: CSSProperties;
  initiallyMuted?: boolean;
}

type PlayerShellProps = {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

function PlayerShell({ className, style, children }: PlayerShellProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        aspectRatio: `${POST_VIDEO_LAYOUT_WIDTH} / ${POST_VIDEO_LAYOUT_HEIGHT}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type BoundaryProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onRetry: () => void;
};

type BoundaryState = { error: Error | null };

class PlayerErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PostVideoPlayer]", error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
    this.props.onRetry();
  };

  render() {
    if (this.state.error) {
      return (
        <PlayerShell className={this.props.className} style={this.props.style}>
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black px-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
              Preview failed
            </p>
            <p className="max-w-sm text-sm text-white/70">
              {this.state.error.message || "Remotion player could not start."}
            </p>
            <button
              type="button"
              onClick={this.retry}
              className="inline-flex h-9 items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/20"
            >
              Retry preview
            </button>
          </div>
        </PlayerShell>
      );
    }
    return this.props.children;
  }
}

/**
 * WYSIWYG Remotion Player, same composition as export.
 * Player is loaded on demand so Remotion stays out of the app entry chunk.
 * Errors are isolated so a player failure cannot blank the whole post page.
 */
export function PostVideoPlayer({
  slides,
  autoPlay = false,
  controls = true,
  loop = true,
  className,
  style,
  initiallyMuted = true,
}: PostVideoPlayerProps) {
  const durationInFrames = getDeckDurationInFrames(slides);
  // Remount lazy Player after a caught failure so import/retry can run again.
  const [loadKey, setLoadKey] = useState(0);

  return (
    <PlayerErrorBoundary
      key={loadKey}
      className={className}
      style={style}
      onRetry={() => setLoadKey((n) => n + 1)}
    >
      <Suspense fallback={<PlayerShell className={className} style={style} />}>
        <RemotionPlayer
          component={PostDeckVideo}
          inputProps={{ slides }}
          durationInFrames={durationInFrames}
          compositionWidth={POST_VIDEO_LAYOUT_WIDTH}
          compositionHeight={POST_VIDEO_LAYOUT_HEIGHT}
          fps={POST_VIDEO_FPS}
          autoPlay={autoPlay}
          controls={controls}
          initiallyMuted={initiallyMuted}
          loop={loop}
          acknowledgeRemotionLicense
          errorFallback={({ error }) => (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black px-4 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                Composition error
              </p>
              <p className="text-xs text-white/70">{error.message}</p>
            </div>
          )}
          className={className}
          style={{
            width: "100%",
            aspectRatio: `${POST_VIDEO_LAYOUT_WIDTH} / ${POST_VIDEO_LAYOUT_HEIGHT}`,
            ...style,
          }}
        />
      </Suspense>
    </PlayerErrorBoundary>
  );
}
