import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardDictionary } from "@/lib/dashboardI18n";

type Backing = "sol" | "usdc";

type Props = {
  copy: DashboardDictionary["createTokenPage"];
  value: Backing;
  onChange: (value: Backing) => void;
  disabled?: boolean;
};

const OPTIONS: { id: Backing; accent: string }[] = [
  { id: "sol", accent: "from-violet-500/20 via-violet-500/5 to-transparent" },
  { id: "usdc", accent: "from-sky-500/20 via-sky-500/5 to-transparent" },
];

export function CreateTokenBackingPicker({ copy, value, onChange, disabled }: Props) {
  return (
    <motion.div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={copy.backingLabel}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.id;
        const title = opt.id === "sol" ? copy.backingSol : copy.backingUsdc;
        const desc = opt.id === "sol" ? copy.backingSolDesc : copy.backingUsdcDesc;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-4 text-left transition-[border-color,box-shadow,transform] duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "border-primary/45 bg-gradient-to-br shadow-[0_0_0_1px_hsl(var(--primary)/0.15)_inset,0_16px_40px_-24px_hsl(var(--uof)/0.45)]"
                : "border-border/55 bg-card/30 hover:border-border hover:bg-card/45",
              disabled && "pointer-events-none opacity-55",
            )}
          >
            <motion.div
              className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80", opt.accent)}
              aria-hidden
              animate={{ opacity: selected ? 1 : 0.35 }}
            />
            <div className="relative flex items-start justify-between gap-3">
              <motion.div>
                <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </motion.div>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected
                    ? "border-primary/50 bg-primary text-primary-foreground"
                    : "border-border/60 bg-background/50 text-transparent",
                )}
                aria-hidden
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </div>
          </button>
        );
      })}
    </motion.div>
  );
}
