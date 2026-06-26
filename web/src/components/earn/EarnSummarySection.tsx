import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

type EarnEarning = {
  id: string;
  paidPath: string;
  creatorShareUsd: number;
  status: string;
  sourceType?: string;
};

type EarnSummarySectionProps = {
  pendingUsd: number;
  paidUsd: number;
  earnings: EarnEarning[];
};

const SOURCE_LABELS: Record<string, string> = {
  prompt: "Playbook",
  skill: "API skill",
  agent8004: "8004",
};

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function EarnSummarySection({ pendingUsd, paidUsd, earnings }: EarnSummarySectionProps) {
  const recent = earnings.slice(0, 5);

  return (
    <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
      <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
        <div>
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-semibold tabular-nums">{formatUsd(pendingUsd)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Paid out</p>
          <p className="text-2xl font-semibold tabular-nums">{formatUsd(paidUsd)}</p>
        </div>
      </div>

      {recent.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-border/50 pt-4">
          {recent.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="truncate text-muted-foreground">
                {e.sourceType ? `${SOURCE_LABELS[e.sourceType] ?? e.sourceType} · ` : ""}
                {e.paidPath}
              </span>
              <span className="shrink-0 font-medium tabular-nums">{formatUsd(e.creatorShareUsd)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
