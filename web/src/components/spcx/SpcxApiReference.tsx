import { useState } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getApiBaseUrl } from "@/lib/env";

const ENDPOINTS = [
  { method: "GET", path: "/experiment/spcx/config", desc: "IPO reference, catalog meta" },
  { method: "GET", path: "/experiment/spcx/latest", desc: "Latest intelligence report" },
  { method: "GET", path: "/experiment/spcx/feed?limit=50", desc: "Historical ticks" },
  { method: "POST", path: "/experiment/spcx/tick", desc: "Force intelligence refresh" },
  { method: "GET", path: "/experiment/spcx/telegram-preview", desc: "Formatted share message" },
] as const;

const EXAMPLE = `{
  "success": true,
  "data": {
    "nasdaqTicker": "SPCX",
    "nasdaqPriceUsd": 135.00,
    "venues": [{ "symbol": "SPCXx", "venue": "xstocks", "spreadPct": 2.1 }],
    "agentBias": "observe",
    "agentTake": "..."
  }
}`;

export function SpcxApiReference() {
  const [copied, setCopied] = useState(false);
  const base = getApiBaseUrl().replace(/\/$/, "");

  const copyExample = async () => {
    await navigator.clipboard.writeText(EXAMPLE);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="relative isolate rounded-2xl border-border/55 bg-card shadow-sm">
      <CardHeader className="border-b border-border/40 bg-muted/[0.04]">
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          API reference
        </CardTitle>
        <CardDescription>
          Experiment endpoints at <span className="font-mono text-xs">{base}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {ENDPOINTS.map((ep) => (
          <Collapsible key={ep.path}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-muted/[0.04] px-3 py-2 text-left text-sm hover:bg-muted/10">
              <span>
                <span className="mr-2 font-mono text-[11px] font-semibold text-primary">{ep.method}</span>
                <span className="font-mono text-xs">{ep.path}</span>
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 py-2 text-xs text-muted-foreground">
              {ep.desc}
            </CollapsibleContent>
          </Collapsible>
        ))}
        <div className="relative mt-3 rounded-xl border border-border/40 bg-muted/20 p-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={copyExample}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <pre className="overflow-x-auto pr-8 font-mono text-[10px] leading-relaxed text-muted-foreground">
            {EXAMPLE}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
