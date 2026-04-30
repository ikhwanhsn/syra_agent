import { useMemo } from "react";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { computeNarrativeTags } from "./IntelligenceEngine";
import type { NarrativeTag } from "./types";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

const NARRATIVE_OPTIONS: NarrativeTag[] = [
  "Verified",
  "FloorBacked",
  "Momentum",
  "Cooldown",
  "BlueChip",
  "Microcap",
  "Fresh",
];

export function NarrativeBuckets({
  selected,
  onSelect,
}: {
  selected: NarrativeTag | null;
  onSelect: (tag: NarrativeTag | null) => void;
}) {
  const allMarkets = useRiseMarketsAll(150);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const counts = useMemo(() => {
    const next = new Map<NarrativeTag, number>(NARRATIVE_OPTIONS.map((tag) => [tag, 0]));
    for (const row of allMarkets.data ?? []) {
      for (const tag of computeNarrativeTags(row)) {
        next.set(tag, (next.get(tag) ?? 0) + 1);
      }
    }
    return next;
  }, [allMarkets.data]);

  return (
    <section className="w-full min-w-0 rounded-2xl border border-border/55 bg-card/35 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{copy.terminal.narrativeBuckets}</h2>
        {selected ? (
          <button
            type="button"
            className="text-[0.65rem] text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => onSelect(null)}
          >
            {copy.terminal.clearFilter}
          </button>
        ) : null}
      </div>
      <div
        className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7"
        role="group"
        aria-label={copy.terminal.narrativeBuckets}
      >
        {NARRATIVE_OPTIONS.map((tag) => {
          const active = selected === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onSelect(active ? null : tag)}
              className={`flex min-h-[2.75rem] w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors ${
                active
                  ? "border-foreground/45 bg-foreground/10 text-foreground"
                  : "border-border/55 bg-background/35 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="line-clamp-2 leading-tight">{copy.terminal.narrativeLabel[tag]}</span>
              <span className="font-mono text-[0.65rem] tabular-nums text-muted-foreground">({counts.get(tag) ?? 0})</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
