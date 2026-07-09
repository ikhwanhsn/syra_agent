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
  }) => void;
}

function msToMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

function minutesToMs(min: number): number {
  return Math.max(1, min) * 60_000;
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
  const [maxDailyCalls, setMaxDailyCalls] = useState(2000);
  const showSkeleton = useMinimumSkeleton(isLoading);

  useEffect(() => {
    if (!settings) return;
    setAutoCallEnabled(settings.autoCallEnabled);
    setIntervalMin(msToMinutes(settings.intervalMs));
    setRefundEnabled(settings.refundEnabled);
    setJitterPct(settings.jitterPct);
    setMaxDailyCalls(settings.maxDailyCalls ?? 2000);
  }, [settings]);

  useEffect(() => {
    onDraftChange?.({
      intervalMin,
      jitterPct,
      refundEnabled,
      autoCallEnabled,
      maxDailyCalls,
    });
  }, [intervalMin, jitterPct, refundEnabled, autoCallEnabled, maxDailyCalls, onDraftChange]);

  if (showSkeleton) {
    return <AutoCallSettingsSkeleton />;
  }

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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="max-daily-calls">Max calls per day (MongoDB cap)</Label>
          <Input
            id="max-daily-calls"
            type="number"
            min={100}
            max={10000}
            value={maxDailyCalls}
            onChange={(e) => setMaxDailyCalls(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Scheduler stops logging and running when this daily limit is reached.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="refund">Auto-refund USDC</Label>
          <p className="text-xs text-muted-foreground">
            PayTo wallet sends USDC back to payer after each successful payment
          </p>
        </div>
        <Switch
          id="refund"
          checked={refundEnabled}
          onCheckedChange={setRefundEnabled}
        />
      </div>

      <Button
        onClick={() =>
          onSave({
            autoCallEnabled,
            intervalMs: minutesToMs(intervalMin),
            refundEnabled,
            jitterPct,
            maxDailyCalls,
          })
        }
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
