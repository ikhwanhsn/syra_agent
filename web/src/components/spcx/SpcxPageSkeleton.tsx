import { Skeleton } from "@/components/ui/skeleton";

export function SpcxPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <Skeleton className="h-64 rounded-2xl xl:col-span-7" />
        <Skeleton className="h-64 rounded-2xl xl:col-span-5" />
      </div>
    </div>
  );
}
