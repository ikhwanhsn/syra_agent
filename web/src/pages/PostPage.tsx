import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ImageIcon, Lock, Video } from "lucide-react";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostShipLogUpdateList } from "@/components/post/PostShipLogUpdateList";
import {
  POST_VIDEO_SLIDE_COUNT,
  POST_VIDEO_SLIDE_SLOTS,
} from "@/content/posts";
import { POST_PHOTO_CARD_COUNT } from "@/content/posts/photo/photoCardSlots";
import { isLockedShipLogUpdate, POST_TEMPLATE_UPDATE_NUMBER } from "@/lib/postLocked";
import {
  getVisiblePostBundles,
  getLatestVisiblePostUpdateNumber,
} from "@/lib/postRegistryVisibility";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { usePostStudioQuery } from "@/hooks/usePostStudio";

/** Hub for ship-log social formats — video deck or photo templates. */
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
        isLockedShipLogUpdate(bundle.video.meta.updateNumber) || bundle.video.meta.locked,
    );
    const rest = all
      .filter(
        (bundle) =>
          !isLockedShipLogUpdate(bundle.video.meta.updateNumber) && !bundle.video.meta.locked,
      )
      .reverse();
    return [...locked, ...rest];
  }, [statusTick]);

  if (isLoading) {
    return (
      <div className="post-root flex min-h-[100dvh] items-center justify-center bg-[#030303] text-white/40">
        <p className="font-mono text-xs uppercase tracking-[0.16em]">
          Loading ship log…
        </p>
      </div>
    );
  }

  return (
    <div className="post-root relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-x-hidden bg-[#030303] px-4 py-8 text-white">
      <div
        className="post-ambient pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="post-orb post-orb-a pointer-events-none absolute rounded-full"
        aria-hidden
      />
      <div
        className="post-orb post-orb-b pointer-events-none absolute rounded-full"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="mb-4 flex justify-start">
          <PostBackLink />
        </div>

        <div className="mb-6 flex items-center justify-center gap-3">
          <img
            src="/images/logo.jpg"
            alt=""
            className="h-10 w-10 rounded-xl border border-white/10 object-cover"
          />
          <div className="text-left">
            <h1 className="font-display text-lg font-medium tracking-tight">
              Syra Ship Log
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              Social post studio
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-white/55">
          Turn each ship log into a growth-ready X post. Record the video deck
          or export branded photos with one-click share copy.
        </p>

        <div className="mb-8 rounded-xl border border-[#F3BA2F]/20 bg-[#F3BA2F]/[0.04] px-4 py-3 text-left">
          <div className="mb-2 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[#F3BA2F]/80" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F3BA2F]/80">
              Locked format · #{POST_TEMPLATE_UPDATE_NUMBER}
            </p>
          </div>
          <p className="text-xs text-white/55">
            Every future ship log follows this structure:{" "}
            <span className="text-white/75">
              {POST_VIDEO_SLIDE_COUNT} video slides
            </span>{" "}
            ({POST_VIDEO_SLIDE_SLOTS.map((s) => s.kind).join(" → ")}) and{" "}
            <span className="text-white/75">
              {POST_PHOTO_CARD_COUNT} photo cards
            </span>{" "}
            in fixed role order. The Format Template cannot be removed from the
            studio.
          </p>
          <div className="mt-3 flex gap-3">
            <Link
              to={`/post/video/${POST_TEMPLATE_UPDATE_NUMBER}`}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]/80 transition-colors hover:text-[#F3BA2F]"
            >
              Open video template
            </Link>
            <Link
              to={`/post/photo/${POST_TEMPLATE_UPDATE_NUMBER}`}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]/80 transition-colors hover:text-[#F3BA2F]"
            >
              Open photo template
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to={`/post/video/${latestVisible}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[#F3BA2F]/30 hover:bg-[#F3BA2F]/[0.06]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 text-[#F3BA2F]">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-medium text-white/90">
                Video
              </p>
              <p className="mt-1 text-xs text-white/45">
                16:9 slide deck · {POST_VIDEO_SLIDE_COUNT} fixed kinds · proof-first
              </p>
            </div>
          </Link>

          <Link
            to={`/post/photo/${latestVisible}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[#F3BA2F]/30 hover:bg-[#F3BA2F]/[0.06]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 text-[#F3BA2F]">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-medium text-white/90">
                Photo
              </p>
              <p className="mt-1 text-xs text-white/45">
                {POST_PHOTO_CARD_COUNT} cards per update · matched X copy
              </p>
            </div>
          </Link>
        </div>

        <PostShipLogUpdateList updates={updates} />
      </div>
    </div>
  );
}
