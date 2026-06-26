import { cn } from "@/lib/utils";

export function Btc2Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(38_92%_50%/0.12),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)/0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute h-1 w-1 rounded-full bg-amber-500/30",
            "animate-pulse",
          )}
          style={{
            left: `${8 + (i * 7.5) % 85}%`,
            top: `${12 + (i * 11) % 75}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${3 + (i % 4)}s`,
          }}
        />
      ))}
    </div>
  );
}
