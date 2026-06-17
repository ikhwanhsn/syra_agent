import { Moon, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { btcPillButtonClass, btcPillTrackClass } from "@/components/btc/btcStyles";
import {
  type BtcChartShareCustomColors,
  type BtcChartShareTheme,
  type BtcChartShareThemeMode,
  persistCustomColors,
} from "@/components/btc/share/btcChartShareTheme";

const MODES: { id: BtcChartShareThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "custom", label: "Custom", icon: Palette },
];

const CUSTOM_FIELDS: { key: keyof BtcChartShareCustomColors; label: string; hint: string }[] = [
  { key: "background", label: "Background", hint: "Card & export backdrop" },
  { key: "accent", label: "Accent", hint: "Brand & BTC highlights" },
  { key: "chartLine", label: "Chart line", hint: "Price line & area fill" },
];

interface BtcChartShareThemePickerProps {
  theme: BtcChartShareTheme;
  onChange: (theme: BtcChartShareTheme) => void;
  className?: string;
}

export function BtcChartShareThemePicker({ theme, onChange, className }: BtcChartShareThemePickerProps) {
  const setMode = (mode: BtcChartShareThemeMode) => {
    onChange({ ...theme, mode });
  };

  const setCustomColor = (key: keyof BtcChartShareCustomColors, value: string) => {
    const custom = { ...theme.custom, [key]: value };
    persistCustomColors(custom);
    onChange({ mode: "custom", custom });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Share theme
        </p>
        <div className={cn(btcPillTrackClass, "mt-2")} role="tablist" aria-label="Share image theme">
          {MODES.map((opt) => {
            const Icon = opt.icon;
            const active = theme.mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(opt.id)}
                className={cn(btcPillButtonClass(active), "inline-flex items-center gap-1.5 px-3")}
              >
                <Icon className="h-3 w-3" aria-hidden />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {theme.mode === "custom" ? (
        <div className="grid gap-3 rounded-xl border border-border/50 bg-muted/15 p-3 sm:grid-cols-3">
          {CUSTOM_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`share-color-${field.key}`} className="text-xs font-medium text-foreground">
                {field.label}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id={`share-color-${field.key}`}
                  type="color"
                  value={theme.custom[field.key]}
                  onChange={(e) => setCustomColor(field.key, e.target.value)}
                  className="h-9 w-11 cursor-pointer rounded-lg border border-border/60 bg-background p-0.5"
                  aria-label={`${field.label} color`}
                />
                <input
                  type="text"
                  value={theme.custom[field.key]}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) setCustomColor(field.key, v);
                  }}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-2 font-mono text-xs text-foreground"
                  spellCheck={false}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{field.hint}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {theme.mode === "light"
            ? "Clean light card — great for LinkedIn and light-mode feeds."
            : "Syra dark card — optimized for X and crypto Twitter."}
        </p>
      )}
    </div>
  );
}
