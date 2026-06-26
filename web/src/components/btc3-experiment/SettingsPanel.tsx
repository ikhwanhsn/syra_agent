import { Badge } from "@/components/ui/badge";
import { PanelShell } from "./shared/PanelShell";
import type { Btc3Settings } from "@/lib/btc3/types";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "default" : "outline"} className="text-[10px]">
      {label}: {ok ? "configured" : "not configured"}
    </Badge>
  );
}

export function SettingsPanel({ settings }: { settings: Btc3Settings }) {
  return (
    <PanelShell
      kicker="Settings"
      title="Runtime Configuration"
      description="Provider and infrastructure status (read-only)."
    >
      <div className="flex flex-wrap gap-2">
        <StatusBadge ok={settings.llmConfigured} label="LLM" />
        <StatusBadge ok={settings.embedding.configured} label="Embeddings" />
        <StatusBadge ok={settings.qdrant.configured} label="Qdrant" />
        <StatusBadge ok={settings.redisConfigured} label="Redis" />
        <StatusBadge ok={settings.mongoConfigured} label="MongoDB" />
        <Badge variant="outline" className="text-[10px]">
          Cron: {settings.cronEnabled ? "enabled" : "disabled"} ·{" "}
          {Math.round(settings.cronIntervalMs / 60_000)}m
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          Model: {settings.llmModel}
        </Badge>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          News Providers
        </p>
        <ul className="space-y-2">
          {settings.providers.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm"
            >
              <span>{p.name}</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {p.status}
                </Badge>
                <Badge variant={p.enabled ? "default" : "secondary"} className="text-[10px]">
                  {p.enabled ? "enabled" : "disabled"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PanelShell>
  );
}
