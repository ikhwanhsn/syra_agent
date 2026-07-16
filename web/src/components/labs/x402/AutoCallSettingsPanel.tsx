import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AutoCallSettingsSkeleton } from "@/components/labs/LabsSkeleton";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import type { LabX402Settings } from "@/lib/labsX402Api";

interface AutoCallSettingsPanelProps {
  settings: LabX402Settings | undefined;
  isLoading: boolean;
  onSave: (patch: Partial<LabX402Settings>) => void;
  isSaving: boolean;
  onDraftChange?: (draft: {
    intervalMin: number;
    jitterPct: number;
    refundEnabled: boolean;
    autoCallEnabled: boolean;
    maxDailyCallsMin: number;
    maxDailyCallsMax: number;
    targetVolumeUsd: number;
  }) => void;
}

function msToMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

function minutesToMs(min: number): number {
  return Math.max(1, min) * 60_000;
}

function normalizeRange(min: number, max: number): { min: number; max: number } {
  const lo = Math.min(10_000, Math.max(100, Math.round(min)));
  const hi = Math.min(10_000, Math.max(100, Math.round(max)));
  return lo <= hi ? { min: lo, max: hi } : { min: hi, max: lo };
}

export function AutoCallSettingsPanel({
  settings,
  isLoading,
  onSave,
  isSaving,
  onDraftChange,
}: AutoCallSettingsPanelProps) {
  const [autoCallEnabled, setAutoCallEnabled] = useState(false);
  const [intervalMin, setIntervalMin] = useState(5);
  const [refundEnabled, setRefundEnabled] = useState(true);
  const [jitterPct, setJitterPct] = useState(20);
  const [maxDailyCallsMin, setMaxDailyCallsMin] = useState(2000);
  const [maxDailyCallsMax, setMaxDailyCallsMax] = useState(2000);
  const [targetVolumeUsd, setTargetVolumeUsd] = useState(50);
  const showSkeleton = useMinimumSkeleton(isLoading);

  useEffect(() => {
    if (!settings) return;
    setAutoCallEnabled(settings.autoCallEnabled);
    setIntervalMin(msToMinutes(settings.intervalMs));
    setRefundEnabled(settings.refundEnabled);
    setJitterPct(settings.jitterPct);
    const legacy = settings.maxDailyCalls ?? 2000;
    const range = normalizeRange(
      settings.maxDailyCallsMin ?? legacy,
      settings.maxDailyCallsMax ?? legacy,
    );
    setMaxDailyCallsMin(range.min);
    setMaxDailyCallsMax(range.max);
    setTargetVolumeUsd(
      typeof settings.targetVolumeUsd === "number" && Number.isFinite(settings.targetVolumeUsd)
        ? Math.min(100_000, Math.max(1, settings.targetVolumeUsd))
        : 50,
    );
  }, [settings]);

  useEffect(() => {
    onDraftChange?.({
      intervalMin,
      jitterPct,
      refundEnabled,
      autoCallEnabled,
      maxDailyCallsMin,
      maxDailyCallsMax,
      targetVolumeUsd,
    });
  }, [
    intervalMin,
    jitterPct,
    refundEnabled,
    autoCallEnabled,
    maxDailyCallsMin,
    maxDailyCallsMax,
    targetVolumeUsd,
    onDraftChange,
  ]);

  if (showSkeleton) {
    return <AutoCallSettingsSkeleton />;
  }

  const todayCap =
    settings?.activeDailyCallCap != null && settings.activeDailyCallCapDay
      ? settings.activeDailyCallCap
      : null;

  return (
    <div className={cn(overviewCardShell, "space-y-5 p-5")}>
      <div>
        <h3 className="text-sm font-semibold">Auto-call scheduler</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Each payer wallet calls a random /insights/* endpoint on the configured interval.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="auto-call">Enable auto-calls</Label>
          <p className="text-xs text-muted-foreground">Runs in background on the API server</p>
        </div>
        <Switch
          id="auto-call"
          checked={autoCallEnabled}
          onCheckedChange={setAutoCallEnabled}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interval">Interval (minutes)</Label>
          <Input
            id="interval"
            type="number"
            min={1}
            max={60}
            value={intervalMin}
            onChange={(e) => setIntervalMin(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jitter">Jitter (%)</Label>
          <Input
            id="jitter"
            type="number"
            min={0}
            max={50}
            value={jitterPct}
            onChange={(e) => setJitterPct(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-daily-calls-min">Daily calls min (MongoDB cap)</Label>
          <Input
            id="max-daily-calls-min"
            type="number"
            min={100}
            max={10000}
            value={maxDailyCallsMin}
            onChange={(e) => setMaxDailyCallsMin(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-daily-calls-max">Daily calls max (MongoDB cap)</Label>
          <Input
            id="max-daily-calls-max"
            type="number"
            min={100}
            max={10000}
            value={maxDailyCallsMax}
            onChange={(e) => setMaxDailyCallsMax(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="target-volume-usd">Target volume USD (24h)</Label>
          <Input
            id="target-volume-usd"
            type="number"
            min={1}
            max={100000}
            step={0.01}
            value={targetVolumeUsd}
            onChange={(e) =>
              setTargetVolumeUsd(Math.min(100_000, Math.max(1, Number(e.target.value) || 1)))
            }
          />
          <p className="text-xs text-muted-foreground">
            Ops goal for gross paid volume today (UTC). Progress is tracked on this tab; simulation
            uses this to recommend interval and funding. Does not stop the scheduler by itself —
            use daily call caps for hard limits.
          </p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <p className="text-xs text-muted-foreground">
            Each UTC day the system picks a random cap in this range so volume is not identical every
            day. Scheduler stops logging and running when that day&apos;s cap is reached.
            {todayCap != null ? (
              <>
                {" "}
                Today&apos;s rolled cap:{" "}
                <span className="font-mono tabular-nums text-foreground">{todayCap.toLocaleString()}</span>
                {settings?.activeDailyCallCapDay ? ` (${settings.activeDailyCallCapDay} UTC)` : null}.
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="refund">Auto-refund USDC</Label>
          <p className="text-xs text-muted-foreground">
            PayTo tops up payer only when USDC is too low for the next call — fewer refund txs and less SOL gas
          </p>
        </div>
        <Switch
          id="refund"
          checked={refundEnabled}
          onCheckedChange={setRefundEnabled}
        />
      </div>

      <Button
        onClick={() => {
          const range = normalizeRange(maxDailyCallsMin, maxDailyCallsMax);
          onSave({
            autoCallEnabled,
            intervalMs: minutesToMs(intervalMin),
            refundEnabled,
            jitterPct,
            maxDailyCallsMin: range.min,
            maxDailyCallsMax: range.max,
            targetVolumeUsd: Math.min(100_000, Math.max(1, Math.round(targetVolumeUsd * 100) / 100)),
          });
        }}
        disabled={isSaving}
        className="gap-2"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Save className="h-4 w-4" aria-hidden />
        )}
        Save settings
      </Button>
    </div>
  );
}
