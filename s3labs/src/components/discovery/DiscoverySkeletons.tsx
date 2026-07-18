import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("skeleton-bone", className)} aria-hidden />;
}

function SkeletonCardShell({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  return (
    <div
      className={cn(
        "animate-fade-in opacity-0 overflow-hidden rounded-2xl border border-border/55 bg-card/50 shadow-card",
        className,
      )}
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: "forwards" }}
    >
      {children}
    </div>
  );
}

/** Job ticket-style grid skeleton. */
export function DiscoveryJobSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Updating jobs…</span>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCardShell key={i} delayMs={i * 45} className="flex h-full flex-col">
          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <Bone className="h-12 w-12 rounded-xl" />
              <Bone className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <Bone className="h-5 w-[88%] rounded-md" />
              <Bone className="h-5 w-[62%] rounded-md" />
            </div>
            <Bone className="h-3.5 w-28 rounded-md" />
            <Bone className="h-3.5 w-24 rounded-md" />
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <Bone className="h-6 w-20 rounded-full" />
              <Bone className="h-3 w-14 rounded-md" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 bg-muted/15 px-4 py-3">
            <Bone className="h-8 w-16 rounded-lg" />
            <Bone className="h-8 w-16 rounded-full" />
          </div>
        </SkeletonCardShell>
      ))}
    </div>
  );
}

/** Event bento-style grid skeleton (image + body). */
export function DiscoveryEventSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Updating events…</span>
      <SkeletonCardShell delayMs={0} className="hidden sm:block">
        <div className="grid lg:grid-cols-2">
          <Bone className="aspect-[16/10] w-full rounded-none lg:min-h-[240px] lg:aspect-auto" />
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <Bone className="h-3 w-28 rounded-full" />
            <Bone className="h-8 w-[85%] rounded-md" />
            <Bone className="h-8 w-[55%] rounded-md" />
            <div className="space-y-2 pt-1">
              <Bone className="h-3.5 w-full rounded-md" />
              <Bone className="h-3.5 w-[80%] rounded-md" />
            </div>
            <div className="mt-auto flex gap-2 pt-4">
              <Bone className="h-6 w-16 rounded-full" />
              <Bone className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </SkeletonCardShell>

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCardShell key={i} delayMs={60 + i * 45} className="flex h-full flex-col">
            <Bone className="h-44 w-full rounded-none" />
            <div className="flex flex-1 flex-col gap-3 p-5">
              <Bone className="h-3 w-24 rounded-full" />
              <Bone className="h-5 w-[90%] rounded-md" />
              <Bone className="h-5 w-[65%] rounded-md" />
              <div className="space-y-2 pt-1">
                <Bone className="h-3.5 w-full rounded-md" />
                <Bone className="h-3.5 w-[75%] rounded-md" />
              </div>
              <div className="mt-auto flex gap-3 pt-2">
                <Bone className="h-3 w-20 rounded-md" />
                <Bone className="h-3 w-16 rounded-md" />
              </div>
            </div>
          </SkeletonCardShell>
        ))}
      </div>
    </div>
  );
}

/** Hackathon arena-style grid skeleton. */
export function DiscoveryHackathonSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Updating hackathons…</span>
      <SkeletonCardShell delayMs={0} className="p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-4">
            <Bone className="h-3 w-32 rounded-full" />
            <div className="flex items-start gap-4">
              <Bone className="h-14 w-14 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <Bone className="h-3 w-24 rounded-md" />
                <Bone className="h-7 w-[80%] rounded-md" />
              </div>
            </div>
            <Bone className="h-3.5 w-full max-w-xl rounded-md" />
            <div className="flex gap-2">
              <Bone className="h-6 w-16 rounded-full" />
              <Bone className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="space-y-3 lg:min-w-[14rem]">
            <Bone className="h-24 w-full rounded-2xl" />
            <Bone className="h-4 w-32 rounded-md lg:ml-auto" />
            <Bone className="h-10 w-full rounded-full lg:w-40 lg:ml-auto" />
          </div>
        </div>
      </SkeletonCardShell>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCardShell key={i} delayMs={70 + i * 50} className="p-5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Bone className="h-11 w-11 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <Bone className="h-3 w-24 rounded-md" />
                  <Bone className="h-5 w-[85%] rounded-md" />
                </div>
              </div>
              <Bone className="h-20 w-full rounded-xl" />
              <div className="flex gap-2">
                <Bone className="h-6 w-14 rounded-full" />
                <Bone className="h-6 w-16 rounded-full" />
              </div>
              <Bone className="h-3.5 w-full rounded-md" />
              <div className="flex justify-between gap-3 pt-1">
                <Bone className="h-3.5 w-28 rounded-md" />
                <Bone className="h-3.5 w-20 rounded-md" />
              </div>
            </div>
          </SkeletonCardShell>
        ))}
      </div>
    </div>
  );
}

/** Compact row skeleton used under load-more. */
export function DiscoveryListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/55 bg-card/50 shadow-card"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading more…</span>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-border/40 px-5 py-4 last:border-b-0"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <Bone className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-4 w-[55%] max-w-xs rounded-md" />
            <Bone className="h-3 w-[35%] max-w-[10rem] rounded-md" />
          </div>
          <Bone className="hidden h-8 w-16 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}
