import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const bone = "bg-white/10";

function PostAmbientShell({ children }: { children: ReactNode }) {
  return (
    <div className="post-root relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#030303] text-white">
      <div className="post-ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="post-orb post-orb-a pointer-events-none absolute rounded-full" aria-hidden />
      <div className="post-orb post-orb-b pointer-events-none absolute rounded-full" aria-hidden />
      {children}
    </div>
  );
}

/** Body skeleton for /post hub, matches locked banner + format cards + update list. */
export function PostStudioContentSkeleton() {
  return (
    <div
      className="animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading ship log"
      role="status"
    >
      <div className="mb-6 rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 text-left sm:mb-8 sm:px-5 sm:py-4">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className={cn("h-3.5 w-3.5 shrink-0 rounded-sm", bone)} />
          <Skeleton className={cn("h-2.5 w-40 max-w-[70%]", bone)} />
        </div>
        <div className="space-y-1.5">
          <Skeleton className={cn("h-3 w-full", bone)} />
          <Skeleton className={cn("h-3 w-[92%] max-w-xl", bone)} />
          <Skeleton className={cn("h-3 w-[75%] max-w-lg", bone)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <Skeleton className={cn("h-2.5 w-28", bone)} />
          <Skeleton className={cn("h-2.5 w-28", bone)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <Skeleton className={cn("h-12 w-12 rounded-full", bone)} />
            <div className="w-full space-y-2 text-left">
              <Skeleton className={cn("h-4 w-16", bone)} />
              <Skeleton className={cn("h-3 w-44 max-w-full", bone)} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 w-full min-w-0 text-left sm:mt-10">
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Skeleton className={cn("h-2.5 w-36", bone)} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Skeleton className={cn("h-2.5 w-40", bone)} />
            <Skeleton className={cn("h-2.5 w-16", bone)} />
          </div>
        </div>

        <ul className="space-y-2 sm:space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="flex flex-col gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
                <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
                  <Skeleton
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0 rounded-sm sm:mt-0 sm:h-4 sm:w-4",
                      bone,
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className={cn("h-4 w-56 max-w-full", bone)} />
                    <Skeleton className={cn("h-2.5 w-24", bone)} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-7 sm:shrink-0 sm:pl-0">
                  <Skeleton className={cn("h-3 w-14", bone)} />
                  <Skeleton className={cn("h-3 w-12", bone)} />
                  <Skeleton className={cn("h-3 w-12", bone)} />
                  <Skeleton className={cn("h-9 w-9 rounded-md sm:h-7 sm:w-7", bone)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Full /post hub fallback for route Suspense (includes chrome + ambient shell). */
export function PostStudioSkeleton() {
  return (
    <PostAmbientShell>
      <div className="relative z-10 mx-auto w-full max-w-6xl animate-in fade-in px-4 py-6 duration-300 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mb-4 flex justify-start sm:mb-5">
          <Skeleton className={cn("h-9 w-9 rounded-full sm:h-10 sm:w-10", bone)} />
        </div>

        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className={cn("h-10 w-10 shrink-0 rounded-xl sm:h-11 sm:w-11", bone)} />
            <div className="min-w-0 space-y-1.5 text-left">
              <Skeleton className={cn("h-5 w-32 sm:h-6", bone)} />
              <Skeleton className={cn("h-2.5 w-28", bone)} />
            </div>
          </div>
          <div className="max-w-xl space-y-1.5 sm:text-right">
            <Skeleton className={cn("ml-auto h-3.5 w-full max-w-md", bone)} />
            <Skeleton className={cn("ml-auto h-3.5 w-4/5 max-w-sm", bone)} />
          </div>
        </header>

        {/* Content skeleton owns the status role for a11y. */}
        <PostStudioContentSkeleton />
      </div>
    </PostAmbientShell>
  );
}

function PostChromeHeaderSkeleton({ mode }: { mode: "video" | "photo" }) {
  return (
    <header className="post-chrome-header relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3 sm:px-6 sm:py-4 md:px-8">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <Skeleton className={cn("h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10", bone)} />
        <Skeleton className={cn("h-7 w-7 shrink-0 rounded-lg sm:h-8 sm:w-8", bone)} />
        <div className="min-w-0 space-y-1.5">
          <Skeleton className={cn("h-3.5 w-12", bone)} />
          <Skeleton className={cn("h-2.5 w-28", bone)} />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {mode === "photo" ? (
          <Skeleton className={cn("h-9 w-20 rounded-full lg:hidden sm:h-10", bone)} />
        ) : null}
        <Skeleton className={cn("h-8 w-24 rounded-full", bone)} />
        <Skeleton className={cn("h-8 w-20 rounded-full", bone)} />
        <Skeleton className={cn("h-9 w-[5.5rem] rounded-full sm:h-10", bone)} />
        <Skeleton className={cn("h-9 w-24 rounded-full sm:h-10 sm:w-28", bone)} />
        {mode === "photo" ? (
          <Skeleton className={cn("h-9 w-24 rounded-full sm:h-10 sm:w-28", bone)} />
        ) : null}
        <Skeleton className={cn("h-9 w-20 rounded-full sm:h-10 sm:w-28", bone)} />
      </div>
    </header>
  );
}

/** Full /post/video fallback matching PostDeck chrome + 16:9 stage. */
export function PostDeckPageSkeleton() {
  return (
    <div
      className="post-root relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden bg-[#030303] text-white animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading ship log video"
      role="status"
    >
      <PostChromeHeaderSkeleton mode="video" />
      <div className="post-chrome-stage relative z-10 flex min-h-0 w-full min-w-0 flex-1 items-center justify-center px-2 py-2 sm:px-4 sm:py-3 md:px-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl">
          <Skeleton className={cn("aspect-video w-full rounded-none", bone)} />
        </div>
      </div>
      <footer className="post-chrome-footer relative z-20 shrink-0 px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
        <Skeleton className={cn("mx-auto h-2.5 w-64 max-w-full", bone)} />
      </footer>
    </div>
  );
}

/** Full /post/photo fallback matching PostPhotoDeck chrome + sidebar + preview. */
export function PostPhotoPageSkeleton() {
  return (
    <div
      className="post-root post-photo-root relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden bg-[#030303] text-white animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading ship log photo"
      role="status"
    >
      <PostChromeHeaderSkeleton mode="photo" />
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col lg:flex-row">
        <aside className="post-photo-sidebar hidden shrink-0 border-white/[0.06] lg:flex lg:w-72 lg:flex-col lg:border-r">
          <div className="space-y-2 px-3 py-3 sm:px-4">
            <Skeleton className={cn("h-2.5 w-36", bone)} />
            <Skeleton className={cn("h-3 w-48 max-w-full", bone)} />
          </div>
          <div className="flex-1 space-y-1.5 overflow-hidden px-2 pb-2">
            <Skeleton className={cn("mx-2.5 mb-1.5 h-2 w-24", bone)} />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2"
              >
                <Skeleton className={cn("h-3 w-full max-w-[9rem]", bone)} />
                <Skeleton className={cn("h-2 w-10 shrink-0", bone)} />
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-white/[0.06] px-3 py-3 sm:px-4">
            <Skeleton className={cn("h-2 w-28", bone)} />
            <Skeleton className={cn("h-3 w-full", bone)} />
            <Skeleton className={cn("h-3 w-4/5", bone)} />
            <Skeleton className={cn("h-3 w-2/3", bone)} />
          </div>
        </aside>

        <div className="post-chrome-stage relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-2 py-3 sm:px-6 sm:py-4">
          <div className="post-ambient pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 mb-2 flex w-full max-w-[1200px] flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <Skeleton className={cn("h-2.5 w-56 max-w-full", bone)} />
            <Skeleton className={cn("h-10 w-36 rounded-full", bone)} />
          </div>
          <div className="relative z-10 w-full max-w-[1200px] overflow-hidden rounded-lg border border-white/10 bg-white shadow-2xl">
            <Skeleton className="aspect-video w-full rounded-none bg-neutral-200" />
          </div>
          <Skeleton className={cn("relative z-10 mt-3 hidden h-2.5 w-72 max-w-full sm:block", bone)} />
        </div>
      </div>
    </div>
  );
}
