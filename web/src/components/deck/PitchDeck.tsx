import { useCallback, useEffect, useRef, useState } from "react";
import { DECK_SLIDE_COUNT, SYRA_PITCH_DECK } from "@/content/syraPitchDeck";
import { DeckSlideView } from "@/components/deck/DeckSlideView";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PitchDeck() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((next: number) => {
    setIndex((current) => {
      const clamped = Math.max(0, Math.min(DECK_SLIDE_COUNT - 1, next));
      if (clamped === current) return current;
      setDirection(clamped > current ? "forward" : "back");
      return clamped;
    });
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => {
      const next = Math.min(DECK_SLIDE_COUNT - 1, current + 1);
      if (next !== current) setDirection("forward");
      return next;
    });
  }, []);

  const goPrev = useCallback(() => {
    setIndex((current) => {
      const next = Math.max(0, current - 1);
      if (next !== current) setDirection("back");
      return next;
    });
  }, []);

  useEffect(() => {
    document.title = `Syra Pitch Deck · ${index + 1}/${DECK_SLIDE_COUNT}`;
    return () => {
      document.title = "Syra | Smart Intelligence Agent for Traders";
    };
  }, [index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(DECK_SLIDE_COUNT - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, goTo]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    if (start == null) return;
    const end = event.changedTouches[0]?.clientX;
    if (end == null) return;
    const delta = end - start;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) goNext();
    else goPrev();
    touchStartX.current = null;
  };

  const progress = ((index + 1) / DECK_SLIDE_COUNT) * 100;
  const currentSlide = SYRA_PITCH_DECK[index];

  return (
    <div
      ref={containerRef}
      className="deck-root relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050505] text-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="deck-ambient pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="deck-grid pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      />

      <header className="relative z-20 flex shrink-0 items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/images/logo.jpg" alt="" className="h-8 w-8 rounded-lg border border-white/10 object-cover" />
          <span className="font-display text-sm font-medium tracking-tight text-white/90">Syra</span>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 sm:block">
          Confidential · Not for distribution
        </p>
        <p className="font-mono text-xs tabular-nums text-white/45 sm:hidden">
          {index + 1}/{DECK_SLIDE_COUNT}
        </p>
      </header>

      <div className="relative z-10 min-h-0 flex-1">
        {SYRA_PITCH_DECK.map((slide, slideIndex) => (
          <DeckSlideView key={slide.id} slide={slide} isActive={slideIndex === index} />
        ))}
      </div>

      <footer className="relative z-20 shrink-0 space-y-4 px-5 pb-6 pt-2 sm:px-8 sm:pb-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full bg-white/70 transition-[width] duration-500 ease-out",
                direction === "back" && "origin-right",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="hidden font-mono text-xs tabular-nums text-white/45 sm:block">
            {String(index + 1).padStart(2, "0")} / {String(DECK_SLIDE_COUNT).padStart(2, "0")}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <nav
            className="hidden items-center gap-1 overflow-x-auto md:flex"
            aria-label="Slide navigation"
          >
            {SYRA_PITCH_DECK.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(slideIndex)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                  slideIndex === index
                    ? "bg-white text-black"
                    : "text-white/40 hover:bg-white/10 hover:text-white/70",
                )}
                aria-current={slideIndex === index ? "true" : undefined}
              >
                {slide.label}
              </button>
            ))}
          </nav>

          <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/35 md:hidden">
            {currentSlide?.label}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={index === 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={index === DECK_SLIDE_COUNT - 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="hidden text-center font-mono text-[10px] text-white/25 sm:block">
          Arrow keys · Space · Swipe on mobile
        </p>
      </footer>

      <button
        type="button"
        className="absolute inset-y-0 left-0 z-30 w-[12%] max-w-[80px] cursor-w-resize opacity-0"
        aria-label="Previous slide"
        onClick={goPrev}
        tabIndex={-1}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 z-30 w-[12%] max-w-[80px] cursor-e-resize opacity-0"
        aria-label="Next slide"
        onClick={goNext}
        tabIndex={-1}
      />
    </div>
  );
}
