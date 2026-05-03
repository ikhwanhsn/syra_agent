import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export const BREAKDOWN_ORDER = [
  ["identity", "Identity"],
  ["reach", "Reach"],
  ["engagement", "Engagement"],
  ["cadence", "Cadence"],
  ["contentDiversity", "Content"],
] as const;

export function gradeBadgeClass(grade: string): string {
  switch (grade) {
    case "A":
      return "border-emerald-500/35 bg-emerald-500/[0.09] text-emerald-100";
    case "B":
      return "border-teal-500/30 bg-teal-500/[0.08] text-teal-100";
    case "C":
      return "border-amber-500/25 bg-amber-500/[0.07] text-amber-100";
    case "D":
      return "border-orange-500/25 bg-orange-500/[0.07] text-orange-100";
    default:
      return "border-border/70 bg-muted/40 text-muted-foreground";
  }
}

export function formatFollowers(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString();
}

export function formatSignalLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, "");
  }
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function scoreRingStyle(score: number): CSSProperties {
  const pct = Math.min(100, Math.max(0, score));
  return {
    background: `conic-gradient(hsl(var(--primary)) ${pct * 3.6}deg, hsl(var(--muted) / 0.55) 0deg)`,
  };
}

export function gradeBadgeClassName(grade: string): string {
  return cn(
    "inline-flex h-7 min-w-[2rem] items-center justify-center rounded-lg border px-2 font-mono text-xs font-bold tracking-tight",
    gradeBadgeClass(grade),
  );
}
