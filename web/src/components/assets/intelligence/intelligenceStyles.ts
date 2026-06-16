import { cn } from "@/lib/utils";
import { overviewAccentBackground, overviewCardGlow, overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export const intelligencePanelShell = cn(overviewCardShell, "flex h-full flex-col");

export function intelligenceAccentGlow(tone: "bullish" | "bearish" | "neutral" | "buy" | "sell" | "hold"): string {
  const map = {
    bullish:
      "radial-gradient(420px 160px at 0% -20%, hsl(152 60% 45% / 0.14), transparent 55%), radial-gradient(320px 120px at 100% 120%, hsl(var(--primary) / 0.06), transparent 50%)",
    bearish:
      "radial-gradient(420px 160px at 0% -20%, hsl(0 72% 55% / 0.14), transparent 55%), radial-gradient(320px 120px at 100% 120%, hsl(var(--muted-foreground) / 0.05), transparent 50%)",
    neutral: overviewAccentBackground("neutral"),
    buy:
      "radial-gradient(420px 160px at 0% -20%, hsl(152 60% 45% / 0.16), transparent 55%), radial-gradient(320px 120px at 100% 120%, hsl(152 45% 35% / 0.08), transparent 50%)",
    sell:
      "radial-gradient(420px 160px at 0% -20%, hsl(0 72% 55% / 0.16), transparent 55%), radial-gradient(320px 120px at 100% 120%, hsl(0 50% 40% / 0.08), transparent 50%)",
    hold:
      "radial-gradient(420px 160px at 0% -20%, hsl(38 92% 50% / 0.14), transparent 55%), radial-gradient(320px 120px at 100% 120%, hsl(var(--primary) / 0.05), transparent 50%)",
  };
  return map[tone];
}

export const intelligenceGlowClass = overviewCardGlow;

export function signalToneKey(signal: string): "buy" | "sell" | "hold" {
  const s = signal.toUpperCase();
  if (s.includes("BUY") || s.includes("LONG")) return "buy";
  if (s.includes("SELL") || s.includes("SHORT")) return "sell";
  return "hold";
}

export function strengthFill(strength: string | null | undefined): number {
  const s = String(strength ?? "").toUpperCase();
  if (s.includes("HIGH") || s.includes("STRONG")) return 100;
  if (s.includes("LOW") || s.includes("WEAK")) return 33;
  if (s.includes("MEDIUM") || s.includes("MODERATE")) return 66;
  return 50;
}
