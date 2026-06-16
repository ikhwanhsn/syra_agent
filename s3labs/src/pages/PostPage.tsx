import { Link } from "react-router-dom";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Film, Layers, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostFundUpdateList } from "@/components/post/PostFundUpdateList";
import { getVisiblePostBundles, getLatestVisiblePostUpdateNumber } from "@/lib/postRegistryVisibility";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { usePostStudioQuery } from "@/hooks/usePostStudio";

const fade = (delay = 0, reduceMotion: boolean) =>
  reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
      };

/** S3 Labs signal studio — ribbon-flow layout for growth-partner X exports. */
export default function PostPage() {
  const reduceMotion = useReducedMotion() ?? false;
  const { isLoading } = usePostStudioQuery();
  const statusTick = usePostRegistryRefresh();
  const latestVisible = useMemo(() => getLatestVisiblePostUpdateNumber(), [statusTick]);
  const updates = useMemo(() => [...getVisiblePostBundles()].reverse(), [statusTick]);

  if (isLoading) {
    return (
      <div className="post-hub-s3 flex min-h-[100dvh] items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          Loading signal studio…
        </p>
      </div>
    );
  }

  return (
    <div className="post-hub-s3 relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden">
      <div className="post-hub-s3-ribbons" aria-hidden>
        <div className="post-hub-s3-ribbon post-hub-s3-ribbon--a" />
        <div className="post-hub-s3-ribbon post-hub-s3-ribbon--b" />
        <div className="post-hub-s3-ribbon post-hub-s3-ribbon--c" />
      </div>
      <div className="post-hub-s3-grid pointer-events-none absolute inset-0 z-[1] opacity-70" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <PostBackLink className="rounded-full border-primary/25 bg-primary/[0.06] hover:border-primary/40 hover:bg-primary/10" />
          <span className="post-hub-s3-stamp hidden sm:inline-flex">
            <span className="post-hub-s3-pulse inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Signal studio
          </span>
        </div>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <motion.div className="text-left" {...fade(0.05, reduceMotion)}>
            <div className="mb-6 flex items-center gap-3">
              <BrandMark showWordmark={false} className="h-12 w-12 rounded-xl ring-1 ring-primary/30" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
                  S3 Labs
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                  Growth partner · X export
                </p>
              </div>
            </div>

            <h1 className="post-hub-s3-tagline">
              <span className="post-hub-s3-tagline-gradient">Signal</span>
              <span>Studio</span>
              <span className="post-hub-s3-tagline-muted">Results over hype</span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
              Ship growth-partner updates for Solana builders. Record a partner deck or export
              branded photo cards — each with unique X copy tuned for founders.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
                <Sparkles className="h-3 w-3 text-primary/90" />
                Builder format
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
                Update #{latestVisible}
              </span>
            </div>

            <Link
              to="/"
              className="mt-8 inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-primary/90"
            >
              ← Back to s3labs.io
            </Link>
          </motion.div>

          <motion.div {...fade(0.15, reduceMotion)}>
            <div className="post-hub-s3-panel rounded-2xl p-5 sm:p-6 lg:p-7">
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/75">
                  Export channels
                </p>
                <p className="mt-1 text-sm text-white/45">Pick format, ship conviction to founders.</p>
              </div>

              <div className="space-y-3">
                <Link to={`/post/video/${latestVisible}`} className="post-hub-s3-format group">
                  <div className="post-hub-s3-format-icon">
                    <Film className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-sora text-base font-semibold tracking-tight text-white/95">
                      Video deck
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      16:9 slides · programs & traction
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary/90" />
                </Link>

                <Link to={`/post/photo/${latestVisible}`} className="post-hub-s3-format group">
                  <div className="post-hub-s3-format-icon">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-sora text-base font-semibold tracking-tight text-white/95">
                      Photo cards
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      15 cards · unique backgrounds each
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary/90" />
                </Link>
              </div>

              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <PostFundUpdateList updates={updates} variant="hub" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
