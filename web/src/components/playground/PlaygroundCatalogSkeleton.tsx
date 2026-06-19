import { playgroundSkeletonCardClass } from "@/components/playground/playgroundStyles";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";

interface PlaygroundCatalogSkeletonProps {
  count?: number;
}

export function PlaygroundCatalogSkeleton({ count = 10 }: PlaygroundCatalogSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading API catalog"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`${playgroundSkeletonCardClass} flex h-[15.5rem] flex-col p-4 sm:p-5`}
          style={playgroundStaggerStyle(index, 24, 8)}
        >
          <div className="mb-3 flex justify-between gap-2">
            <div className="flex gap-1.5">
              <div className="h-5 w-16 rounded-md bg-muted/45" />
              <div className="h-5 w-14 rounded-md bg-muted/35" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 w-12 rounded-md bg-muted/40" />
              <div className="h-5 w-10 rounded-md bg-muted/45" />
            </div>
          </div>
          <div className="mb-2 h-4 w-4/5 rounded-md bg-muted/50" />
          <div className="mb-1 h-3 w-full rounded-md bg-muted/35" />
          <div className="mb-3 h-3 w-11/12 rounded-md bg-muted/30" />
          <div className="h-8 w-full rounded-lg bg-muted/40" />
          <div className="mt-3 flex gap-1.5">
            <div className="h-6 w-20 rounded-md bg-muted/35" />
            <div className="h-6 w-16 rounded-md bg-muted/30" />
          </div>
          <div className="mt-auto h-10 w-full rounded-xl bg-muted/45" />
        </div>
      ))}
    </div>
  );
}
