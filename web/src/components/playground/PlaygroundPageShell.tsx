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
        "playground-ambient relative w-full bg-background",
        className,
      )}
    >
      {children}
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
