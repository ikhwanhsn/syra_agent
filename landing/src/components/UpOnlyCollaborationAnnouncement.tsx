import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RISE_UP_ONLY, getRiseRichTradeUrl } from "@/data/riseUpOnly";

/** Session-only: survives client navigation; cleared on full reload (incl. hard refresh). */
const SESSION_STORAGE_KEY = "syra_landing_uponly_syra_rise_dismissed_v1";
/** Legacy key — no longer read; remove if present so old clients are not stuck hidden forever. */
const LEGACY_LOCAL_STORAGE_KEY = "syra_landing_uponly_syra_rise_v1";

const SYRA_LOGO = "/images/logo.jpg" as const;
const RISE_LOGO = "/images/partners/rise.jpg" as const;
const UPONLY_ART = "/images/experiment/rise_uponly.png" as const;

function clearDismissedOnReload(): void {
  try {
    const entry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (entry?.type === "reload") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

function clearLegacyLocalDismissed(): void {
  try {
    localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Home page modal: Syra × RISE $UPONLY collaboration.
 * Dismissal is stored in sessionStorage for the tab; any full reload (including hard refresh)
 * clears it so the announcement can show again.
 */
export function UpOnlyCollaborationAnnouncement() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    clearLegacyLocalDismissed();
    clearDismissedOnReload();
    if (!readDismissed()) {
      const t = window.requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(t);
    }
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) persistDismissed();
    setOpen(next);
  }, []);

  const riseTradeUrl = getRiseRichTradeUrl(RISE_UP_ONLY);
  const showTradeCta = Boolean(riseTradeUrl && RISE_UP_ONLY.buyOnRiseEnabled);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          /* Override shadcn defaults: flex column, viewport-safe box, internal scroll */
          "fixed left-1/2 top-1/2 z-[10001] flex -translate-x-1/2 -translate-y-1/2 flex-col",
          /* Width scales by breakpoint; slightly under the previous 40/44rem cap */
          "w-[min(100%,calc(100vw-1rem))] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl",
          /* Height: a bit more air on large screens, tighter on phones */
          "max-h-[min(92dvh,calc(100dvh-1.25rem))] sm:max-h-[min(90dvh,calc(100dvh-1.5rem))] lg:max-h-[min(88dvh,calc(100dvh-2rem))]",
          "gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none",
          "rounded-2xl outline-none md:rounded-3xl",
          "duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        )}
      >
        <div
          className={cn(
            "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 md:rounded-3xl",
            "bg-card/95 shadow-[0_0_0_1px_hsl(var(--foreground)/0.04),0_32px_96px_-32px_rgba(0,0,0,0.65)]",
            "backdrop-blur-2xl",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,hsl(var(--primary)/0.08)_0%,transparent_42%,hsl(var(--accent)/0.06)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] max-w-[100vw] -translate-x-1/2 rounded-full bg-primary/[0.12] blur-3xl"
            aria-hidden
          />

          {/* Hero: top rounded; extra right/bottom inset so badges clear the dialog close control */}
          <div className="relative isolate h-[min(9rem,28dvh)] w-full min-h-[7rem] shrink-0 overflow-hidden rounded-t-2xl sm:h-40 sm:min-h-[7.5rem] md:h-44 md:rounded-t-3xl lg:h-48">
            <img
              src={UPONLY_ART}
              alt=""
              className="h-full w-full object-cover object-center opacity-[0.92]"
              decoding="async"
            />
            <div
              className="pointer-events-none absolute right-0 top-0 h-32 w-44 bg-gradient-to-bl from-black/55 to-transparent sm:w-48"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent"
              aria-hidden
            />
            <div className="absolute bottom-3 left-4 right-[4.5rem] flex flex-col gap-2 sm:bottom-4 sm:left-5 sm:right-[4.75rem] sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <Badge
                variant="outline"
                className="max-w-full border-primary/25 bg-background/80 text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-foreground/90 backdrop-blur-md sm:text-[11px] sm:tracking-[0.14em]"
              >
                <Sparkles className="mr-1.5 size-3 shrink-0 opacity-80" aria-hidden />
                <span className="break-words">Live collaboration</span>
              </Badge>
              <Badge className="shrink-0 bg-primary text-primary-foreground shadow-sm">$UPONLY</Badge>
            </div>
          </div>

          {/* Soft seam between hero and body (avoids a harsh horizontal cut) */}
          <div
            className="pointer-events-none h-px w-full shrink-0 bg-gradient-to-r from-transparent via-border/70 to-transparent"
            aria-hidden
          />

          {/* Scrollable body */}
          <div
            className={cn(
              "relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain",
              "px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-5 sm:px-6 sm:pb-7 sm:pt-6 md:px-8 md:pb-8 md:pt-7 lg:px-9 lg:pb-9 lg:pt-8",
            )}
          >
            <div className="mx-auto w-full min-w-0 max-w-full space-y-5 sm:space-y-6 md:space-y-7">
              <DialogHeader className="space-y-5 text-left sm:space-y-6 md:space-y-7">
                {/* Stack logos above title so nothing competes for horizontal space */}
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-4 sm:gap-5"
                >
                  <div
                    className="flex w-fit max-w-full items-center gap-2.5 sm:gap-3 md:gap-4"
                    role="group"
                    aria-label="Syra and RISE"
                  >
                    <span className="relative inline-flex size-10 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-background shadow-sm ring-2 ring-card sm:size-12 md:rounded-xl md:size-14">
                      <img src={SYRA_LOGO} alt="Syra" className="size-full object-cover" />
                    </span>
                    <span
                      className="shrink-0 select-none text-center text-base font-medium leading-none text-muted-foreground sm:text-lg md:text-xl"
                      aria-hidden
                    >
                      ×
                    </span>
                    <span className="relative inline-flex size-10 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-background shadow-sm ring-2 ring-card sm:size-12 md:rounded-xl md:size-14">
                      <img src={RISE_LOGO} alt="RISE" className="size-full object-cover" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-xs md:text-[13px]">
                      Syra × RISE
                    </p>
                    <DialogTitle className="mt-1.5 text-pretty text-xl font-semibold leading-snug tracking-tight sm:mt-2 sm:text-2xl md:text-3xl md:leading-tight">
                      <span className="text-foreground">The </span>
                      <span className="neon-text">$UPONLY</span>
                      <span className="text-foreground"> experiment</span>
                    </DialogTitle>
                  </div>
                </motion.div>

                <DialogDescription className="space-y-3 text-left text-sm leading-relaxed text-muted-foreground sm:space-y-4 sm:text-[15px] sm:leading-relaxed md:text-base md:leading-relaxed lg:text-[1.0625rem] lg:leading-relaxed">
                  <span className="block text-pretty">
                    We&apos;re collaborating with{" "}
                    <span className="font-medium text-foreground/90">RISE</span> on an official on-chain
                    experiment: <span className="font-medium text-foreground/90">Up Only</span> (
                    <span className="font-mono text-xs text-foreground/80 sm:text-sm">$UPONLY</span>) — Syra
                    infrastructure meets RISE&apos;s launch surface for smart-money audiences.
                  </span>
                  <span className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3.5 py-3 text-[13px] leading-snug sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3.5 sm:text-sm sm:leading-relaxed md:px-5 md:py-4 md:text-[15px]">
                    <TrendingUp className="mt-0.5 size-4 shrink-0 text-foreground/70 sm:mt-1 sm:size-[1.125rem] md:size-5" aria-hidden />
                    <span className="min-w-0 flex-1 text-pretty">
                      Read the full story, mint details, and safety notes on our dedicated page — then trade
                      on RISE when you&apos;re ready.
                    </span>
                  </span>
                </DialogDescription>
              </DialogHeader>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="grid w-full min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 md:gap-4"
              >
                <Button
                  size="lg"
                  className="h-12 w-full min-w-0 rounded-lg px-4 text-sm font-medium sm:h-12 sm:rounded-xl sm:px-5 sm:text-base md:h-14 md:text-base"
                  asChild
                >
                  <Link
                    to="/uponly/overview"
                    onClick={() => handleOpenChange(false)}
                    className="inline-flex w-full items-center justify-center gap-2 text-center"
                  >
                    <span className="min-w-0 whitespace-normal text-balance">View collaboration</span>
                    <ArrowUpRight className="size-4 shrink-0 opacity-90 sm:size-5" aria-hidden />
                  </Link>
                </Button>
                {showTradeCta && riseTradeUrl ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full min-w-0 rounded-lg border-border/70 bg-background/50 px-4 text-sm font-medium backdrop-blur-sm sm:h-12 sm:rounded-xl sm:px-5 sm:text-base md:h-14 md:text-base"
                    asChild
                  >
                    <a
                      href={riseTradeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 text-center"
                    >
                      <span className="min-w-0 whitespace-normal text-balance">Trade on RISE</span>
                      <ArrowUpRight className="size-4 shrink-0 opacity-80 sm:size-5" aria-hidden />
                    </a>
                  </Button>
                ) : null}
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full min-w-0 rounded-lg border-border/70 bg-background/50 px-4 text-sm font-medium backdrop-blur-sm sm:col-span-2 sm:h-12 sm:rounded-xl sm:px-5 sm:text-base md:h-14 md:text-base"
                  asChild
                >
                  <Link
                    to="/uponly/rise"
                    onClick={() => handleOpenChange(false)}
                    className="inline-flex w-full items-center justify-center gap-2 text-center"
                  >
                    <span className="min-w-0 whitespace-normal text-balance">Open RISE dashboard</span>
                    <ArrowUpRight className="size-4 shrink-0 opacity-80 sm:size-5" aria-hidden />
                  </Link>
                </Button>
              </motion.div>

              <p className="mt-2 border-t border-border/40 pt-4 text-pretty text-center text-[10px] leading-relaxed text-muted-foreground/85 sm:mt-3 sm:pt-5 sm:text-xs md:text-[13px]">
                Not financial advice. Tokens involve risk; only participate with what you can afford to
                lose.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
