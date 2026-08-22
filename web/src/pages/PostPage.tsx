import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Lock } from "lucide-react";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostShipLogUpdateList } from "@/components/post/PostShipLogUpdateList";
import { PostStudioContentSkeleton } from "@/components/post/PostStudioSkeleton";
import {
  isLockedShipLogUpdate,
  POST_TEMPLATE_UPDATE_NUMBER,
} from "@/lib/postLocked";
import { getVisiblePostBundles } from "@/lib/postRegistryVisibility";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { usePostStudioQuery } from "@/hooks/usePostStudio";

/** Hub for ship-log social formats: open latest, then archive every update. */
export default function PostPage() {
  const { isLoading } = usePostStudioQuery();
  const statusTick = usePostRegistryRefresh();
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
