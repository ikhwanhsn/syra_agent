import { cn } from "@/lib/utils";

/** Playground page root — content scrolls via AppShell main. */
export function PlaygroundPageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "playground-ambient relative min-h-full w-full bg-background",
        className,
      )}
    >
      <div className="playground-ambient-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/** @deprecated Legacy pages — use natural flow inside scrollable main. */
export function PlaygroundScrollBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
