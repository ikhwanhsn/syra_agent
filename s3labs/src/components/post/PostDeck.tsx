import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { PostUpdate } from "@/content/posts";
import { PostSlideView } from "@/components/post/PostSlideView";
import { PostRecordStage } from "@/components/post/PostRecordStage";
import { PostShareCopyPanel } from "@/components/post/PostShareCopyPanel";
import { PostStudioHeader } from "@/components/post/PostStudioHeader";
import { PostStudioShell } from "@/components/post/PostStudioShell";
import { exportPostVideoWebm } from "@/components/post/postVideoExport";
import { getSlideDwellMs } from "@/components/post/postSlideTiming";
import { cn } from "@/lib/utils";
import { Download, Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface PostDeckProps {
  post: PostUpdate;
}

export function PostDeck({ post }: PostDeckProps) {
  const { meta, slides } = post;
  const slideCount = slides.length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideTick, setSlideTick] = useState(0);
  const [showGuides, setShowGuides] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    setIndex((current) => {
      const next = Math.min(slideCount - 1, current + 1);
      if (next !== current) setDirection("forward");
      return next;
    });
  }, [slideCount]);

  const startPlayback = useCallback(() => {
    setSlideTick((t) => t + 1);
    setIsPlaying(true);
  }, []);

  const pausePlayback = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const replay = useCallback(() => {
    setIndex(0);
    setDirection("forward");
    setSlideTick((t) => t + 1);
    setIsPlaying(true);
  }, []);

  const handleDownloadVideo = useCallback(async () => {
    if (exporting) return;

    setExporting(true);
    setExportProgress(0);
    pausePlayback();

    try {
      await exportPostVideoWebm(slides, meta.id, {
        onSlideChange: (nextIndex) => {
          flushSync(() => setIndex(nextIndex));
        },
        onProgress: (progress) => setExportProgress(progress),
      });
      toast.success("Video downloaded");
    } catch {
      toast.error("Video download failed");
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [exporting, meta.id, pausePlayback, slides]);

  useEffect(() => {
    document.title = `S3 Labs · ${meta.title} · ${index + 1}/${slideCount}`;
    return () => {
      document.title = "S3 Labs | Growth Partner for Solana Developers";
    };
  }, [index, meta.title, slideCount]);

  useEffect(() => {
    if (!isPlaying) return;

    const isLast = index >= slideCount - 1;
    const delay = getSlideDwellMs(index, slides);

    const timer = window.setTimeout(() => {
      if (isLast) {
        setIsPlaying(false);
      } else {
        goNext();
        setSlideTick((t) => t + 1);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isPlaying, index, goNext, slides]);

  const progress = ((index + 1) / slideCount) * 100;
  const finished = !isPlaying && index === slideCount - 1;
  const dwellMs = getSlideDwellMs(index, slides);

  return (
    <PostStudioShell innerRef={containerRef}>
      <PostStudioHeader
        meta={meta}
        format="video"
        toolbar={
          <>
            <PostShareCopyPanel meta={meta} format="video" />

            <button
              type="button"
              onClick={handleDownloadVideo}
              disabled={exporting || isPlaying}
              className="post-studio-btn"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">
                {exporting ? `${Math.round(exportProgress * 100)}%` : "Download"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowGuides((v) => !v)}
              disabled={exporting}
              className={cn("post-studio-btn", showGuides && "post-studio-btn--active")}
              aria-pressed={showGuides}
              aria-label={showGuides ? "Hide 16:9 frame guides" : "Show 16:9 frame guides"}
            >
              <span className="hidden sm:inline">Frame</span>
              <span className="sm:hidden">16:9</span>
            </button>

            {finished ? (
              <button
                type="button"
                onClick={replay}
                disabled={exporting}
                className="post-studio-btn post-studio-btn--primary"
                aria-label="Replay slideshow"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Replay</span>
              </button>
            ) : isPlaying ? (
              <button
                type="button"
                onClick={pausePlayback}
                disabled={exporting}
                className="post-studio-btn"
                aria-label="Pause playback"
              >
                <Pause className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Pause</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startPlayback}
                disabled={exporting}
                className="post-studio-btn post-studio-btn--primary"
                aria-label="Play slideshow"
              >
                <Play className="h-4 w-4 shrink-0 fill-current" />
                <span className="hidden sm:inline">Play</span>
              </button>
            )}
          </>
        }
      />

      <div className="post-studio-stage post-chrome-stage">
        <div className="post-studio-stage-frame post-record-wrap">
          <PostRecordStage showGuides={showGuides}>
            {slides.map((slide, slideIndex) => (
              <PostSlideView
                key={slide.id}
                slide={slide}
                isActive={slideIndex === index}
                direction={direction}
              />
            ))}
          </PostRecordStage>
        </div>
      </div>

      <footer className="post-studio-footer post-chrome-footer">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="post-studio-progress">
            <div
              className="post-studio-progress-fill"
              style={{ width: `${progress}%` }}
            />
            {isPlaying ? (
              <div
                key={`${index}-${slideTick}`}
                className="post-slide-timer absolute inset-y-0 left-0 rounded-full bg-cyan-400/40"
                style={{ animationDuration: `${dwellMs}ms` }}
                aria-hidden
              />
            ) : null}
          </div>
          <p className="shrink-0 font-mono text-[11px] tabular-nums text-cyan-400/55 sm:text-xs">
            {String(index + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}
          </p>
        </div>
        <p className="post-footer-hint mt-2 hidden text-center font-mono text-[10px] text-white/30 sm:mt-3 sm:block">
          Download renders Full HD 30fps WebM with entrance animations, or hit Play to screen record
        </p>
      </footer>

      {exporting ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="post-studio-export-modal w-full max-w-sm rounded-xl p-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400/80">
              Exporting video
            </p>
            <p className="mt-2 font-display text-lg text-white/90">Full HD · 30fps · WebM</p>
            <div className="post-studio-progress mx-auto mt-5 h-1.5 w-full">
              <div
                className="post-studio-progress-fill transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round(exportProgress * 100)}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-xs tabular-nums text-white/45">
              {Math.round(exportProgress * 100)}% · slide{" "}
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(slideCount).padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-white/35">Keep this tab open until the download starts</p>
          </div>
        </div>
      ) : null}
    </PostStudioShell>
  );
}
