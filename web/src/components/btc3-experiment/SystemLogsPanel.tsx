import { Badge } from "@/components/ui/badge";
import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { Btc3SystemLog } from "@/lib/btc3/types";
import { formatRelativeTime } from "@/lib/btc3/format";

export function SystemLogsPanel({ logs }: { logs: Btc3SystemLog[] }) {
  return (
    <PanelShell kicker="System Logs" title="Pipeline Audit Log" description="Per-step pipeline execution logs.">
      {logs.length === 0 ? (
        <EmptyState message="No pipeline logs yet." />
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto font-mono text-xs">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/30 px-3 py-2"
            >
              <Badge
                variant={log.level === "error" ? "destructive" : "outline"}
                className="text-[10px]"
              >
                {log.level}
              </Badge>
              <span className="text-muted-foreground">{log.step}</span>
              <span className="flex-1">{log.message}</span>
              {log.durationMs != null ? (
                <span className="text-muted-foreground">{log.durationMs}ms</span>
              ) : null}
              <span className="text-muted-foreground">{formatRelativeTime(log.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
