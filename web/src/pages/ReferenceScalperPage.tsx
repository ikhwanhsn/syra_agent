import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Wallet, Zap } from "lucide-react";
import ScalperExperiment from "@/pages/ScalperExperiment";
import { getApiBaseUrl } from "@/lib/chatApi";
import { formatScalperUsd, formatScalperPct } from "@/lib/scalperApi";

interface ScalperReference {
  agent: string;
  tagline: string;
  mode: string;
  wallet: string | null;
  x402SpendLast30d: { totalUsd: number; calls: number };
  equityUsd: number | null;
  returnPct: number | null;
  openPositions: number;
  demoUrl: string;
  metricsUrl: string;
}

async function fetchScalperReference(): Promise<ScalperReference> {
  const res = await fetch(`${getApiBaseUrl().replace(/\/$/, "")}/experiment/scalper/reference`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Reference API failed");
  return json.data as ScalperReference;
}

/** Public Franklin-style reference agent — pays for intelligence via x402. */
export default function ReferenceScalperPage() {
  const refQ = useQuery({
    queryKey: ["scalper-reference"],
    queryFn: () => fetchScalperReference(),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    document.title = "Syra Scalper · Reference agent";
    return () => {
      document.title = "Syra | Machine money for agents";
    };
  }, []);

  const ref = refQ.data;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border/60 bg-card/30 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" aria-hidden />
              <h1 className="text-lg font-semibold">Syra Reference Agent</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {ref?.tagline ?? "An agent that pays for its own intelligence via x402"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link to="/metrics" className="rounded-lg border border-border/70 px-3 py-1.5 hover:bg-card">
              Metrics
            </Link>
            <a
              href="https://docs.syraa.fun"
              className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 hover:bg-card"
              target="_blank"
              rel="noreferrer"
            >
              Docs
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {ref ? (
          <div className="mx-auto mt-4 grid max-w-6xl gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Equity (paper)</p>
              <p className="font-semibold tabular-nums">{formatScalperUsd(ref.equityUsd)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Return</p>
              <p className="font-semibold tabular-nums">{formatScalperPct(ref.returnPct)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">x402 spend (30d)</p>
              <p className="font-semibold tabular-nums">${ref.x402SpendLast30d.totalUsd.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Treasury wallet
              </p>
              <p className="truncate font-mono text-xs">{ref.wallet ?? "—"}</p>
            </div>
          </div>
        ) : null}
      </div>

      <ScalperExperiment embedded />
    </div>
  );
}
