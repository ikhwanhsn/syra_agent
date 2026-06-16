import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ImageIcon, Video } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostFundUpdateList } from "@/components/post/PostFundUpdateList";
import { getVisiblePostBundles, getLatestVisiblePostUpdateNumber } from "@/lib/postRegistryVisibility";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { usePostStudioQuery } from "@/hooks/usePostStudio";

/** Hub for fund brief social formats — video deck or photo templates. */
export default function PostPage() {
  const { isLoading } = usePostStudioQuery();
  const statusTick = usePostRegistryRefresh();
  const latestVisible = useMemo(() => getLatestVisiblePostUpdateNumber(), [statusTick]);
  const updates = useMemo(
    () => [...getVisiblePostBundles()].reverse(),
    [statusTick],
  );

  if (isLoading) {
    return (
      <div className="post-root flex min-h-[100dvh] items-center justify-center bg-[#050807] text-white/40">
        <p className="font-mono text-xs uppercase tracking-[0.16em]">Loading investor brief studio…</p>
      </div>
    );
  }

  return (
    <div className="post-root relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-x-hidden bg-[#050807] px-4 py-8 text-white">
      <div className="post-ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="post-orb post-orb-a pointer-events-none absolute rounded-full" aria-hidden />
      <div className="post-orb post-orb-b pointer-events-none absolute rounded-full" aria-hidden />

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="mb-4 flex justify-start">
          <PostBackLink />
        </div>

        <div className="mb-6 flex items-center justify-center gap-3">
          <BrandMark showWordmark={false} className="shrink-0" />
          <div className="text-left">
            <h1 className="font-display text-lg font-medium tracking-tight">Up Only Fund</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              Investor brief studio
            </p>
          </div>
        </div>

        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-uof/70">
          VC · Fundraiser format
        </p>
        <p className="mb-8 text-sm text-white/55">
          Choose a format for your fund update. Record the video brief or export branded photo cards for X.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to={`/post/video/${latestVisible}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-uof/30 hover:bg-uof/[0.06]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-uof/25 bg-uof/10 text-uof">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-medium text-white/90">Video brief</p>
              <p className="mt-1 text-xs text-white/45">16:9 slide deck · mandate & thesis</p>
            </div>
          </Link>

          <Link
            to={`/post/photo/${latestVisible}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-uof/30 hover:bg-uof/[0.06]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-uof/25 bg-uof/10 text-uof">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-medium text-white/90">Photo cards</p>
              <p className="mt-1 text-xs text-white/45">15 cards · unique X copy each</p>
            </div>
          </Link>
        </div>

        <PostFundUpdateList updates={updates} />

        <Link
          to="/"
          className="mt-8 inline-flex font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-uof/80"
        >
          ← Back to fund page
        </Link>
      </div>
    </div>
  );
}
