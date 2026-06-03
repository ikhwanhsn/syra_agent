import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIVE_POST, POST_SLIDE_COUNT } from "@/content/posts";
import { PostSlideView } from "@/components/post/PostSlideView";
import { PostRecordStage } from "@/components/post/PostRecordStage";
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw } from "lucide-react";

/** Time each slide stays visible (tuned for entrance animations). */
const SLIDE_INTERVAL_MS = 5200;
/** Extra hold on the final slide before stopping. */
const LAST_SLIDE_DWELL_MS = 7000;

export function PostDeck() {
  const { meta, slides } = ACTIVE_POST;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideTick, setSlideTick] = useState(0);
  const [showGuides, setShowGuides] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    setIndex((current) => {
      const next = Math.min(POST_SLIDE_COUNT - 1, current + 1);
      if (next !== current) setDirection("forward");
      return next;
    });
  }, []);

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

  useEffect(() => {
    document.title = `Syra · ${meta.title} · ${index + 1}/${POST_SLIDE_COUNT}`;
    return () => {
      document.title = "Syra | Smart Intelligence Agent for Traders";
    };
  }, [index, meta.title]);

  useEffect(() => {
    if (!isPlaying) return;

    const isLast = index >= POST_SLIDE_COUNT - 1;
    const delay = isLast ? LAST_SLIDE_DWELL_MS : SLIDE_INTERVAL_MS;

    const timer = window.setTimeout(() => {
      if (isLast) {
        setIsPlaying(false);
      } else {
        goNext();
        setSlideTick((t) => t + 1);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isPlaying, index, goNext]);

  const progress = ((index + 1) / POST_SLIDE_COUNT) * 100;
  const finished = !isPlaying && index === POST_SLIDE_COUNT - 1;
  const dwellMs = index >= POST_SLIDE_COUNT - 1 ? LAST_SLIDE_DWELL_MS : SLIDE_INTERVAL_MS;

  return (
    <div
      ref={containerRef}
      className="post-root relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#030303] text-white"
    >
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.jpg"
            alt=""
            className="h-8 w-8 rounded-lg border border-white/10 object-cover"
          />
          <div>
            <span className="font-display text-sm font-medium tracking-tight text-white/90">Syra</span>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">{meta.published}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
              showGuides
                ? "border-[#F3BA2F]/25 bg-[#F3BA2F]/10 text-[#F3BA2F]/80"
                : "border-white/10 bg-white/5 text-white/45 hover:text-white/70",
            )}
            aria-pressed={showGuides}
          >
            Frame
          </button>
          {finished ? (
            <button
              type="button"
              onClick={replay}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3BA2F] transition-colors hover:bg-[#F3BA2F]/20"
            >
              <RotateCcw className="h-4 w-4" />
              Replay
            </button>
          ) : isPlaying ? (
            <button
              type="button"
              onClick={pausePlayback}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/15"
              aria-label="Pause playback"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={startPlayback}
              className="post-play-btn inline-flex h-10 items-center gap-2 rounded-full border border-[#F3BA2F]/30 bg-[#F3BA2F]/15 px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3BA2F] transition-colors hover:bg-[#F3BA2F]/25"
              aria-label="Play slideshow"
            >
              <Play className="h-4 w-4 fill-current" />
              Play
            </button>
          )}
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-3 sm:px-6">
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

      <footer className="relative z-20 shrink-0 px-5 pb-6 pt-2 sm:px-8 sm:pb-8">
        <div className="flex items-center gap-4">
          <div className="post-progress-track relative h-1 flex-1 overflow-hidden rounded-full">
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
          <p className="font-mono text-xs tabular-nums text-white/45">
            {String(index + 1).padStart(2, "0")} / {String(POST_SLIDE_COUNT).padStart(2, "0")}
          </p>
        </div>
        <p className="post-footer-hint mt-3 text-center font-mono text-[10px] text-white/30">
          Hit Play to auto-advance slides for screen recording
        </p>
      </footer>
    </div>
  );
}
