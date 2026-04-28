import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Mandate",
    value: "Public",
    hint: "Rules before size",
  },
  {
    label: "Scope",
    value: "RISE",
    hint: "Ecosystem-native",
  },
  {
    label: "Disclosure",
    value: "On the record",
    hint: "Treasury as published",
  },
] as const;

type HomeStatsStripProps = {
  className?: string;
};

export function HomeStatsStrip({ className }: HomeStatsStripProps) {
  return (
    <div
      className={cn(
        "mb-16 grid grid-cols-1 gap-4 rounded-2xl border border-border/50 bg-gradient-to-b from-card/40 to-card/[0.12] p-1 sm:mb-20 sm:grid-cols-3",
        className,
      )}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col justify-center rounded-xl px-5 py-5 sm:px-6 sm:py-6"
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {s.label}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {s.value}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground/90">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}
