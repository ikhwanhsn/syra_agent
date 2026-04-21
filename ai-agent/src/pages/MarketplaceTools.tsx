import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Play } from "lucide-react";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { agentToolsApi, type AgentTool } from "@/lib/chatApi";
import { useToast } from "@/hooks/use-toast";

const BIRDEYE_DOCS = "https://docs.birdeye.so/reference/x402";

/** Coerce tool-call params to string record (server normalizes mint → address for Birdeye). */
function stringifyToolParams(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null || v === "") continue;
    if (typeof v === "string") {
      out[k] = v;
    } else if (typeof v === "number" || typeof v === "boolean") {
      out[k] = String(v);
    } else {
      out[k] = JSON.stringify(v);
    }
  }
  return out;
}

export default function MarketplaceTools() {
  const { toast } = useToast();
  const { ready, anonymousId, agentUsdcBalance } = useAgentWallet();
  const [allTools, setAllTools] = useState<AgentTool[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [paramsJson, setParamsJson] = useState<string>('{\n  "address": ""\n}');
  const [calling, setCalling] = useState(false);
  const [lastResult, setLastResult] = useState<string>("");

  const birdeyeTools = useMemo(
    () => allTools.filter((t) => t.id.startsWith("birdeye-")).sort((a, b) => a.name.localeCompare(b.name)),
    [allTools]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      try {
        const { tools } = await agentToolsApi.list();
        if (!cancelled) setAllTools(tools);
      } catch {
        if (!cancelled) {
          setAllTools([]);
          toast({
            title: "Could not load tools",
            description: "Check API connectivity and try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const selectedTool = useMemo(
    () => birdeyeTools.find((t) => t.id === selectedId) ?? null,
    [birdeyeTools, selectedId]
  );

  const runTool = useCallback(async () => {
    if (!anonymousId || !selectedId) {
      toast({
        title: "Select a tool",
        description: "Choose a Birdeye endpoint and ensure your agent wallet is ready.",
        variant: "destructive",
      });
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(paramsJson) as Record<string, unknown>;
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Params must be a JSON object");
      }
    } catch (e) {
      toast({
        title: "Invalid JSON",
        description: e instanceof Error ? e.message : "Fix the parameters JSON.",
        variant: "destructive",
      });
      return;
    }
    setCalling(true);
    setLastResult("");
    try {
      const res = await agentToolsApi.call({
        anonymousId,
        toolId: selectedId,
        params: stringifyToolParams(parsed),
      });
      if (!res.success) {
        const msg =
          res.message ||
          res.error ||
          (res.insufficientBalance
            ? `Need $${(res.requiredUsdc ?? 0).toFixed(4)} USDC (balance $${(res.usdcBalance ?? 0).toFixed(4)}).`
            : "Request failed");
        toast({ title: "Tool call failed", description: msg, variant: "destructive" });
        setLastResult(JSON.stringify(res, null, 2));
        return;
      }
      setLastResult(JSON.stringify(res.data, null, 2));
      toast({ title: "Birdeye data loaded", description: "Result is shown below." });
    } catch (e) {
      toast({
        title: "Network error",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setCalling(false);
    }
  }, [anonymousId, paramsJson, selectedId, toast]);

  return (
    <div className={cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM)}>
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">Birdeye (x402)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Call Birdeye Data on-chain pay-per-request endpoints with your agent wallet. Each run spends USDC per the
            tool price. See{" "}
            <a
              href={BIRDEYE_DOCS}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-0.5"
            >
              Birdeye x402 docs
              <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
            </a>
            .
          </p>
        </div>

        {!ready || loadingList ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading tools…
          </div>
        ) : !anonymousId ? (
          <p className="text-sm text-muted-foreground">Connect a wallet and open the agent to use paid tools.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Agent USDC (UI):{" "}
              <span className="font-mono tabular-nums">
                {typeof agentUsdcBalance === "number" ? `$${agentUsdcBalance.toFixed(4)}` : "—"}
              </span>
            </p>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Run a Birdeye tool</CardTitle>
                <CardDescription className="text-xs">
                  Pick an endpoint, set JSON params (<code className="text-[11px]">address</code> or{" "}
                  <code className="text-[11px]">mint</code> for tokens; POST tools need{" "}
                  <code className="text-[11px]">body</code> as a JSON string).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Tool</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="w-full font-normal">
                      <SelectValue placeholder={birdeyeTools.length ? "Select Birdeye tool…" : "No Birdeye tools"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(70vh,420px)]">
                      {birdeyeTools.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-muted-foreground ml-2">${t.priceUsd.toFixed(4)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTool && (
                    <p className="text-[11px] text-muted-foreground leading-snug">{selectedTool.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Params (JSON object)</Label>
                  <Textarea
                    value={paramsJson}
                    onChange={(e) => setParamsJson(e.target.value)}
                    className="font-mono text-xs min-h-[140px]"
                    spellCheck={false}
                  />
                </div>

                <Button type="button" size="sm" onClick={() => void runTool()} disabled={calling || !selectedId}>
                  {calling ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" aria-hidden />
                      Calling…
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5 mr-1.5" aria-hidden />
                      Pay &amp; fetch
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {lastResult ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Last response</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[min(50vh,360px)] w-full rounded-md border bg-muted/30 p-3">
                    <pre className="text-[11px] font-mono whitespace-pre-wrap break-all">{lastResult}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
