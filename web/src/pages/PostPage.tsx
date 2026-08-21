import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ImageIcon, LayoutTemplate, Lock, Video } from "lucide-react";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostShipLogUpdateList } from "@/components/post/PostShipLogUpdateList";
import { PostStudioContentSkeleton } from "@/components/post/PostStudioSkeleton";
import {
  POST_VIDEO_SLIDE_COUNT,
  POST_VIDEO_SLIDE_SLOTS,
} from "@/content/posts";
import { POST_PHOTO_CARD_COUNT } from "@/content/posts/photo/photoCardSlots";
import {
  isLockedShipLogUpdate,
  POST_TEMPLATE_UPDATE_NUMBER,
} from "@/lib/postLocked";
import {
  getVisiblePostBundles,
  getLatestVisiblePostUpdateNumber,
} from "@/lib/postRegistryVisibility";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { usePostStudioQuery } from "@/hooks/usePostStudio";
import { cn } from "@/lib/utils";

const formatActionClass = cn(
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3BA2F]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030303] sm:min-h-10 sm:flex-none",
);

/** Hub for ship-log social formats: open latest, then archive every update. */
export default function PostPage() {
  const { isLoading } = usePostStudioQuery();
  const statusTick = usePostRegistryRefresh();
  const latestVisible = useMemo(
    () => getLatestVisiblePostUpdateNumber(),
    [statusTick],
  );
  const updates = useMemo(() => {
    const all = getVisiblePostBundles();
    const locked = all.filter(
      (bundle) =>
        isLockedShipLogUpdate(bundle.video.meta.updateNumber) ||
        bundle.video.meta.locked,
    );
    const rest = all
      .filter(
        (bundle) =>
          !isLockedShipLogUpdate(bundle.video.meta.updateNumber) &&
          !bundle.video.meta.locked,
      )
      .reverse();
    return [...locked, ...rest];
  }, [statusTick]);

  const latestBundle = useMemo(
    () =>
      updates.find((bundle) => bundle.video.meta.updateNumber === latestVisible) ??
      null,
    [updates, latestVisible],
  );

  return (
    <div className="post-root relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#030303] text-white">
      <div
        className="post-ambient pointer-events-none absolute inset-0"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mb-5 flex justify-start sm:mb-6">
          <PostBackLink />
        </div>

        <header className="mb-8 text-left sm:mb-10">
          <div className="flex items-start gap-3 sm:items-center">
            <img
              src="/images/logo.jpg"
              alt=""
              className="mt-0.5 h-11 w-11 shrink-0 rounded-xl border border-white/10 object-cover sm:mt-0 sm:h-12 sm:w-12"
            />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
                Ship Log
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-[15px]">
                Turn each update into an X-ready video deck or photo set. Open
                the latest ship, or pick any update below.
              </p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <PostStudioContentSkeleton />
        ) : (
          <>
            <section
              aria-labelledby="post-latest-heading"
              className="mb-8 rounded-2xl border border-white/12 bg-white/[0.035] p-4 sm:mb-10 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0 text-left">
                  <h2
                    id="post-latest-heading"
                    className="text-base font-medium text-white sm:text-lg"
                  >
                    {latestBundle
                      ? `#${latestBundle.video.meta.updateNumber} · ${latestBundle.video.meta.title}`
                      : "Latest update"}
                  </h2>
                  <p className="mt-1 font-mono text-[11px] text-white/40">
                    {latestBundle?.video.meta.published
                      ? `Published ${latestBundle.video.meta.published}`
                      : "Open video or photo for the newest ship log"}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                  <Link
                    to={`/post/video/${latestVisible}`}
                    className={cn(
                      formatActionClass,
                      "border-[#F3BA2F]/45 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:border-[#F3BA2F]/70 hover:bg-[#F3BA2F]/25 hover:text-[#F8D56A]",
                    )}
                  >
                    <Video className="h-4 w-4 shrink-0" aria-hidden />
                    Open video
                  </Link>
                  <Link
                    to={`/post/photo/${latestVisible}`}
                    className={cn(
                      formatActionClass,
                      "border-white/20 bg-white/[0.06] text-white/90 hover:border-white/35 hover:bg-white/[0.1] hover:text-white",
                    )}
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" aria-hidden />
                    Open photo
                  </Link>
                  <Link
                    to="/post/announce"
                    className={cn(
                      formatActionClass,
                      "border-white/12 bg-transparent text-white/70 hover:border-white/25 hover:bg-white/[0.05] hover:text-white/90",
                    )}
                  >
                    <LayoutTemplate className="h-4 w-4 shrink-0" aria-hidden />
                    Announce cards
                  </Link>
                </div>
              </div>
              <p className="mt-4 border-t border-white/8 pt-3 text-left text-xs leading-relaxed text-white/40">
                Video: {POST_VIDEO_SLIDE_COUNT} slides (
                {POST_VIDEO_SLIDE_SLOTS.map((s) => s.kind).join(" → ")}). Photo:{" "}
                {POST_PHOTO_CARD_COUNT} cards with matched share copy.
              </p>
            </section>

            <aside className="mb-8 flex flex-col gap-3 rounded-xl border border-white/10 bg-transparent px-4 py-3 text-left sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
              <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
                <Lock
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/50 sm:mt-0"
                  aria-hidden
                />
                <p className="text-xs leading-relaxed text-white/50 sm:text-sm">
                  Format template #{POST_TEMPLATE_UPDATE_NUMBER} is locked. Every
                  new ship log follows the same video and photo roles.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-2 pl-6 sm:pl-0">
                <Link
                  to={`/post/video/${POST_TEMPLATE_UPDATE_NUMBER}`}
                  className="min-h-9 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55 transition-colors hover:text-white sm:min-h-0"
                >
                  Video template
                </Link>
                <Link
                  to={`/post/photo/${POST_TEMPLATE_UPDATE_NUMBER}`}
                  className="min-h-9 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55 transition-colors hover:text-white sm:min-h-0"
                >
                  Photo template
                </Link>
              </div>
            </aside>

            <PostShipLogUpdateList updates={updates} />
          </>
        )}
      </div>
    </div>
  );
}
