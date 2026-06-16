import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { overviewMetricValueClass } from "@/components/dashboard/overview/overviewStyles";
import type { AssetIntelligencePayload } from "@/lib/tokensDossierApi";
import { IntelligenceEmptyMessage } from "@/components/assets/intelligence/IntelligenceEmptyMessage";
import {
  intelligenceAccentGlow,
  intelligenceGlowClass,
  intelligencePanelShell,
  signalToneKey,
  strengthFill,
} from "@/components/assets/intelligence/intelligenceStyles";

function signalMeta(signal: string): {
  tone: "buy" | "sell" | "hold";
  badgeClass: string;
  icon: typeof ArrowUpRight;
  iconShell: string;
} {
  const tone = signalToneKey(signal);
  if (tone === "buy") {
    return {
      tone,
      badgeClass: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      icon: ArrowUpRight,
      iconShell: "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    };
  }
  if (tone === "sell") {
    return {
      tone,
      badgeClass: "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300",
      icon: ArrowDownRight,
      iconShell: "border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-300",
    };
  }
  return {
    tone,
    badgeClass: "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    icon: Minus,
    iconShell: "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
}

function ConfidenceMeter({ strength }: { strength: string | null | undefined }) {
  const fill = strengthFill(strength);
  const label = strength?.trim() || "Unknown";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/50 ring-1 ring-border/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}

export function AssetSignalCard({
  signal,
  className,
}: {
  signal: AssetIntelligencePayload["signal"];
  className?: string;
}) {
  const hasData = signal.ok && Boolean(signal.tradingSignal);

  if (!hasData) {
    return (
      <Card className={cn(intelligencePanelShell, className)}>
        <div
          className={intelligenceGlowClass}
          style={{ background: intelligenceAccentGlow("neutral") }}
          aria-hidden
        />
        <CardHeader className="relative pb-2">
          <CardTitle className="text-base font-semibold tracking-tight">Trading signal</CardTitle>
          <CardDescription className="text-xs">Technical signal from Syra engine</CardDescription>
        </CardHeader>
        <CardContent className="relative flex flex-1 pt-0">
          <IntelligenceEmptyMessage className="w-full">
            {signal.error ?? "No trading signal available for this asset yet."}
          </IntelligenceEmptyMessage>
        </CardContent>
      </Card>
    );
  }

  const meta = signalMeta(signal.tradingSignal!);
  const Icon = meta.icon;

  return (
    <Card className={cn(intelligencePanelShell, className)}>
      <div
        className={intelligenceGlowClass}
        style={{ background: intelligenceAccentGlow(meta.tone) }}
        aria-hidden
      />
      <CardHeader className="relative space-y-0 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">Trading signal</CardTitle>
            <CardDescription className="text-xs">Technical signal from Syra engine</CardDescription>
          </div>
          <Badge variant="outline" className={cn("shrink-0 gap-1 text-[11px] font-medium", meta.badgeClass)}>
            <Activity className="h-3 w-3" aria-hidden />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col gap-5 pt-0">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
              meta.iconShell,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className={cn(overviewMetricValueClass, "text-[1.75rem] leading-none sm:text-[1.85rem]")}>
              {signal.tradingSignal}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Current engine recommendation</p>
          </div>
        </div>
        <ConfidenceMeter strength={signal.strength} />
        {signal.source ? (
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
            <span>Data source</span>
            <Badge variant="secondary" className="h-6 px-2 text-[10px] font-normal capitalize">
              {signal.source}
            </Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
