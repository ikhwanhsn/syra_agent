import { ExternalLink } from "lucide-react";
import {
  useAgentEconomySummary,
  type AgentEconomySummary,
} from "@/lib/agentEconomyApi";
import { AnimatedNumber } from "@/components/motion/animated-number";

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function Stat({
  label,
  numeric,
  format,
  hint,
}: {
  label: string;
  numeric: number;
  format: (n: number) => string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
        <AnimatedNumber value={numeric} format={format} />
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs leading-snug text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}

function PulseBody({ data }: { data: AgentEconomySummary }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 border-b border-white/10 pb-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <Stat
          label="x402 txs · ecosystem"
          numeric={data.x402.totalTxs ?? 0}
          format={formatNum}
          hint={
            data.x402.chainsTracked != null
              ? `${formatNum(data.x402.chainsTracked)} chains tracked`
              : undefined
          }
        />
        <Stat
          label="x402 volume · ecosystem"
          numeric={data.x402.totalVolumeUsd ?? 0}
          format={formatUsd}
          hint={
            data.x402.facilitatorsTracked != null
              ? `${formatNum(data.x402.facilitatorsTracked)} facilitators`
              : undefined
          }
        />
        <Stat
          label="ERC-8004 agents"
          numeric={data.erc8004.totalAgents ?? 0}
          format={formatNum}
          hint="Registry total (external)"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="x402 providers"
          numeric={data.x402Services.uniqueProviders ?? 0}
          format={formatNum}
        />
        <Stat
          label="x402 listings"
          numeric={data.x402Services.totalListings ?? 0}
          format={formatNum}
        />
        <Stat
          label="Official MCP servers"
          numeric={data.agentSupply?.officialMcpServers ?? 0}
          format={formatNum}
        />
      </div>
    </div>
  );
}

/** Live agenteconomy.to headlines for the ship-log studio hub. */
export function PostAgentEconomyPulse() {
  const { data, isLoading, isError } = useAgentEconomySummary();

  return (
    <section
      id="agent-economy"
      className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left sm:mb-8 sm:px-5 sm:py-5"
      aria-labelledby="post-agent-economy-heading"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            Ecosystem context
          </p>
          <h2
            id="post-agent-economy-heading"
            className="mt-1.5 font-display text-base font-medium tracking-tight text-white/90 sm:text-lg"
          >
            Agent economy pulse
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-white/45 sm:text-sm">
            Open feed from agenteconomy.to: x402, ERC-8004, and agent supply.
            External market context for ship-log proof angles, not Syra traction.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <a
            href="https://api.syraa.fun/agent-economy/summary"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            Summary JSON
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
          </a>
          <a
            href="https://agenteconomy.to"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            agenteconomy.to
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
          </a>
        </div>
      </div>

      {isLoading && !data ? (
        <p className="text-xs text-white/40">Loading ecosystem feed...</p>
      ) : null}
      {isError && !data ? (
        <p className="text-xs text-white/40">
          Ecosystem feed unavailable right now. Ship-log studio is unaffected.
        </p>
      ) : null}
      {data ? <PulseBody data={data} /> : null}
    </section>
  );
}
