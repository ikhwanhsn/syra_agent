import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { SectionHeader } from "./shared/SectionHeader";

const NODES = [
  { id: "oracle", label: "Binance + Jupiter", sub: "Free spot & OHLCV feeds" },
  { id: "feature", label: "Feature Engine", sub: "Technical signals" },
  { id: "signal", label: "Signal Engine", sub: "cbBTC/USDC gates" },
  { id: "risk", label: "Risk Engine", sub: "Spot position sizing" },
  { id: "jupiter", label: "Jupiter", sub: "cbBTC spot swaps" },
  { id: "treasury", label: "Treasury", sub: "USDC · cbBTC balances" },
  { id: "storage", label: "Onchain Storage", sub: "Swap proofs" },
] as const;

export function Architecture() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 09"
        title="Solana Spot Infrastructure"
        description="Spot-only pipeline — onchain cbBTC/USDC data, signal gating, and Jupiter swap execution. No perps or leverage."
      />

      <div className={cn(overviewCardShell, "rounded-2xl p-6 sm:p-8")}>
        <div className="mx-auto flex max-w-md flex-col items-center gap-2">
          {NODES.map((node, i) => (
            <div key={node.id} className="flex w-full flex-col items-center">
              <motion.div
                whileHover={{ scale: 1.02, boxShadow: "0 0 24px -4px hsl(38 92% 50% / 0.35)" }}
                className="w-full rounded-xl border border-amber-500/25 bg-gradient-to-br from-background/60 to-amber-500/5 px-4 py-3 text-center backdrop-blur-sm transition-colors hover:border-amber-500/40"
              >
                <p className="text-sm font-semibold text-foreground">{node.label}</p>
                <p className="text-[10px] text-muted-foreground">{node.sub}</p>
              </motion.div>
              {i < NODES.length - 1 ? (
                <ArrowDown className="my-1 h-4 w-4 text-amber-500/50" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
