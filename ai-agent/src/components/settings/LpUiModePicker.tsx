import { LayoutGrid, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { writeLpExperimentUiMode, type LpExperimentUiMode } from "@/lib/lpExperimentUiMode";

const OPTIONS: { value: LpExperimentUiMode; label: string; description: string; icon: typeof LayoutGrid }[] = [
  {
    value: "simple",
    label: "Simple",
    description: "Plain language, fewer numbers, best for beginners.",
    icon: LayoutGrid,
  },
  {
    value: "pro",
    label: "Pro",
    description: "Full tables, filters, and LP metrics.",
    icon: SlidersHorizontal,
  },
];

export function LpUiModePicker({
  value,
  onChange,
}: {
  value: LpExperimentUiMode;
  onChange: (mode: LpExperimentUiMode) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium text-foreground">LP experiment page</Label>
        <p className="text-xs text-muted-foreground">
          Controls layout on the liquidity pool agent experiment dashboard.
        </p>
      </div>
      <div
        className="grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="LP experiment display mode"
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                writeLpExperimentUiMode(opt.value);
                onChange(opt.value);
              }}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border px-4 py-3.5 text-left transition-[border-color,box-shadow,background] duration-200",
                selected
                  ? "border-violet-500/40 bg-violet-500/[0.08] shadow-[inset_0_1px_0_0_hsl(var(--background)/0.6)]"
                  : "border-border/55 bg-muted/15 hover:border-violet-500/20 hover:bg-muted/25",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl border",
                    selected
                      ? "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300"
                      : "border-border/50 bg-background/50 text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{opt.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
