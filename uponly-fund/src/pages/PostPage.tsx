import { Link } from "react-router-dom";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Film, Layers, TrendingUp } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostFundUpdateList } from "@/components/post/PostFundUpdateList";
import { getVisiblePostBundles, getLatestVisiblePostUpdateNumber } from "@/lib/postRegistryVisibility";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { usePostStudioQuery } from "@/hooks/usePostStudio";

const MARQUEE_ITEMS = [
  "MANDATE BRIEF",
  "ALLOCATOR UPDATE",
  "CONVICTION DECK",
  "RISE ECOSYSTEM",
  "80/20 THESIS",
  "ON-CHAIN TRANSPARENCY",
  "VC FORMAT",
] as const;

const fade = (delay = 0, reduceMotion: boolean) =>
  reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
      };

/** Hub for fund brief social formats — asymmetric VC-terminal layout. */
export default function PostPage() {
  const reduceMotion = useReducedMotion() ?? false;
  const { isLoading } = usePostStudioQuery();
  const statusTick = usePostRegistryRefresh();
  const latestVisible = useMemo(() => getLatestVisiblePostUpdateNumber(), [statusTick]);
  const updates = useMemo(
    () => [...getVisiblePostBundles()].reverse(),
    [statusTick],
  );

  if (isLoading) {
    return (
      <div className="post-hub flex min-h-[100dvh] items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          Initializing brief studio…
        </p>
      </div>
    );
  }

  return (
    <div className="post-hub relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden">
      <div className="post-hub-scanlines pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      <div className="post-hub-grid pointer-events-none absolute inset-0 z-[1] opacity-60" aria-hidden />

      {/* Ticker strip */}
      <div className="relative z-10 shrink-0 overflow-hidden border-b border-emerald-500/20 bg-black/40 py-2">
        <div className="post-hub-marquee-track gap-10 px-4 font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400/70">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-10">
              {item}
              <span className="text-white/20" aria-hidden>
                ◆
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <PostBackLink className="rounded-md border-emerald-500/25 bg-emerald-500/[0.06] hover:border-emerald-400/40 hover:bg-emerald-500/10" />
          <span className="post-hub-stamp hidden sm:inline-flex">
            <span className="post-hub-pulse inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live studio
          </span>
        </div>

        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-14">
          {/* Editorial left rail — not centered like Syra ship log */}
          <motion.div className="flex flex-col justify-center text-left" {...fade(0.05, reduceMotion)}>
            <div className="mb-5 flex items-center gap-3">
              <BrandMark showWordmark={false} className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-emerald-500/30" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-400/80">
                  Up Only Fund
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Investor relations · X export
                </p>
              </div>
            </div>

            <div className="select-none">
              <p className="post-hub-display post-hub-display-outline">Brief</p>
              <p className="post-hub-display post-hub-display-fill -mt-2 sm:-mt-4">Studio</p>
            </div>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
              VC-grade fund updates for allocators. Record a mandate deck or ship branded photo cards —
              each with unique X copy.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
                <TrendingUp className="h-3 w-3 text-emerald-400/80" />
                Fundraiser format
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
                Update #{latestVisible}
              </span>
            </div>

            <Link
              to="/"
              className="mt-8 inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-emerald-400/90"
            >
              ← Return to fund
            </Link>
          </motion.div>

          {/* Action panel — skewed cards, not symmetric grid */}
          <motion.div className="flex flex-col justify-center" {...fade(0.15, reduceMotion)}>
            <div className="post-hub-panel rounded-2xl p-5 sm:p-6 lg:p-7">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/75">
                    Export formats
                  </p>
                  <p className="mt-1 text-sm text-white/45">Pick your channel, ship conviction.</p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/25">
                  v1
                </span>
              </div>

              <div className="space-y-3">
                <Link
                  to={`/post/video/${latestVisible}`}
                  className="post-hub-format-card group rounded-xl"
                >
                  <div className="post-hub-format-icon">
                    <Film className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-display text-base font-semibold tracking-tight text-white/95">
                      Video brief
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      16:9 slide deck · mandate & thesis
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-400/90" />
                </Link>

                <Link
                  to={`/post/photo/${latestVisible}`}
                  className="post-hub-format-card group rounded-xl"
                >
                  <div className="post-hub-format-icon">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-display text-base font-semibold tracking-tight text-white/95">
                      Photo cards
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      15 cards · unique X copy each
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-400/90" />
                </Link>
              </div>

              <div className="post-hub-updates mt-6 border-t border-white/[0.06] pt-5">
                <PostFundUpdateList updates={updates} variant="hub" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="post-hub-diagonal pointer-events-none absolute inset-0 z-[2] hidden lg:block" aria-hidden />
    </div>
  );
}
