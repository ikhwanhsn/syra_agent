import { cn } from "@/lib/utils";
import {
  PUMPFUN_CALL_SHARE_DESIGNS,
  type PumpfunCallShareDesignId,
} from "@/components/pumpfun/pumpfunCallShareDesigns";

export interface PumpfunCallShareDesignPickerProps {
  value: PumpfunCallShareDesignId;
  onChange: (id: PumpfunCallShareDesignId) => void;
  className?: string;
  compact?: boolean;
}

export function PumpfunCallShareDesignPicker({
  value,
  onChange,
  className,
  compact = false,
}: PumpfunCallShareDesignPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Card design
      </p>
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-5",
        )}
        role="radiogroup"
        aria-label="Flex card design"
      >
        {PUMPFUN_CALL_SHARE_DESIGNS.map((design) => {
          const selected = value === design.id;
          return (
            <button
              key={design.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(design.id)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                selected
                  ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/25"
                  : "border-border/60 bg-card/40 hover:border-border hover:bg-card/70",
              )}
            >
              <span
                className={cn(
                  "block text-sm font-semibold",
                  selected ? "text-emerald-400" : "text-foreground",
                )}
              >
                {design.label}
              </span>
              {!compact ? (
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {design.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
