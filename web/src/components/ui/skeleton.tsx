import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/50",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-skeleton-shimmer after:bg-gradient-to-r after:from-transparent after:via-foreground/[0.07] after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
