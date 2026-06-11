import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import type { PostUpdate } from "@/content/posts";
import { PostSlideView } from "@/components/post/PostSlideView";
import { PostRecordStage } from "@/components/post/PostRecordStage";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostShareCopyPanel } from "@/components/post/PostShareCopyPanel";
import { PostUpdateNav } from "@/components/post/PostUpdateNav";
import { PostXStatusControl } from "@/components/post/PostXStatusControl";
import { PostVideoExportStage } from "@/components/post/PostVideoExportStage";
import {
  exportPostVideoWebm,
  getSlideDwellMs,
} from "@/components/post/postVideoExport";
import { cn } from "@/lib/utils";
import { Download, ImageIcon, Pause, Play, RotateCcw, Video } from "lucide-react";
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
  const [exportSlideIndex, setExportSlideIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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
    const node = exportRef.current;
    if (!node || exporting) return;

    setExporting(true);
    setExportProgress(0);
    setExportSlideIndex(0);
    pausePlayback();

    try {
      await exportPostVideoWebm(node, slideCount, meta.id, {
        onSlideChange: (nextIndex) => {
          flushSync(() => setExportSlideIndex(nextIndex));
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
  }, [exporting, meta.id, pausePlayback, slideCount]);

  useEffect(() => {
    document.title = `Syra · ${meta.title} · ${index + 1}/${slideCount}`;
    return () => {
      document.title = "Syra | Smart Intelligence Agent for Traders";
    };
  }, [index, meta.title, slideCount]);

  useEffect(() => {
    if (!isPlaying) return;

    const isLast = index >= slideCount - 1;
    const delay = getSlideDwellMs(index, slideCount);

    const timer = window.setTimeout(() => {
      if (isLast) {
        setIsPlaying(false);
      } else {
        goNext();
        setSlideTick((t) => t + 1);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isPlaying, index, goNext, slideCount]);

  const progress = ((index + 1) / slideCount) * 100;
  const finished = !isPlaying && index === slideCount - 1;
  const dwellMs = getSlideDwellMs(index, slideCount);

  return (
    <div
      ref={containerRef}
      className="post-root relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden bg-[#030303] text-white"
    >
      <header className="post-chrome-header relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3 sm:px-6 sm:py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <PostBackLink />
          <img
            src="/images/logo.jpg"
            alt=""
            className="h-7 w-7 shrink-0 rounded-lg border border-white/10 object-cover sm:h-8 sm:w-8"
          />
          <div className="min-w-0">
            <span className="font-display text-sm font-medium tracking-tight text-white/90">Syra</span>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              {meta.published} · Video
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <PostUpdateNav updateNumber={meta.updateNumber} format="video" />
          <PostXStatusControl updateNumber={meta.updateNumber} defaultPosted={meta.postedOnX} />

          <nav className="post-photo-mode-nav flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F3BA2F]/15 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F] sm:px-3">
              <Video className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Video</span>
            </span>
            <Link
              to={`/post/photo/${meta.updateNumber}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-white/70 sm:px-3"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Photo</span>
            </Link>
          </nav>

          <PostShareCopyPanel meta={meta} format="video" />

          <button
            type="button"
            onClick={handleDownloadVideo}
            disabled={exporting || isPlaying}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/15 disabled:opacity-50 sm:h-10 sm:gap-2 sm:px-4"
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
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors sm:px-3",
              showGuides
                ? "border-[#F3BA2F]/25 bg-[#F3BA2F]/10 text-[#F3BA2F]/80"
                : "border-white/10 bg-white/5 text-white/45 hover:text-white/70",
            )}
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
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3BA2F] transition-colors hover:bg-[#F3BA2F]/20 sm:h-10 sm:gap-2 sm:px-4"
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
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/15 sm:h-10 sm:gap-2 sm:px-4"
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
              className="post-play-btn inline-flex h-9 items-center gap-1.5 rounded-full border border-[#F3BA2F]/30 bg-[#F3BA2F]/15 px-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3BA2F] transition-colors hover:bg-[#F3BA2F]/25 sm:h-10 sm:gap-2 sm:px-5"
              aria-label="Play slideshow"
            >
              <Play className="h-4 w-4 shrink-0 fill-current" />
              <span className="hidden sm:inline">Play</span>
            </button>
          )}
        </div>
      </header>

      <div className="post-chrome-stage relative z-10 flex min-h-0 w-full min-w-0 flex-1 items-center justify-center px-2 py-2 sm:px-4 sm:py-3 md:px-6">
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

      <footer className="post-chrome-footer relative z-20 shrink-0 px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="post-progress-track relative h-1 min-w-0 flex-1 overflow-hidden rounded-full">
            <div
              className="post-progress-fill h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
            {isPlaying ? (
              <div
                key={`${index}-${slideTick}`}
                className="post-slide-timer absolute inset-y-0 left-0 rounded-full bg-[#F3BA2F]/50"
                style={{ animationDuration: `${dwellMs}ms` }}
                aria-hidden
              />
            ) : null}
          </div>
          <p className="shrink-0 font-mono text-[11px] tabular-nums text-white/45 sm:text-xs">
            {String(index + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}
          </p>
        </div>
        <p className="post-footer-hint mt-2 hidden text-center font-mono text-[10px] text-white/30 sm:mt-3 sm:block">
          Download renders Full HD 30fps WebM with entrance animations, or hit Play to screen record
        </p>
      </footer>

      <PostVideoExportStage slides={slides} slideIndex={exportSlideIndex} exportRef={exportRef} />

      {exporting ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#030303]/80 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 text-center shadow-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F3BA2F]/80">
              Exporting video
            </p>
            <p className="mt-2 font-display text-lg text-white/90">Full HD · 30fps · WebM</p>
            <div className="post-progress-track mx-auto mt-5 h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="post-progress-fill h-full rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round(exportProgress * 100)}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-xs tabular-nums text-white/45">
              {Math.round(exportProgress * 100)}% · slide{" "}
              {String(exportSlideIndex + 1).padStart(2, "0")} /{" "}
              {String(slideCount).padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-white/35">Keep this tab open until the download starts</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
