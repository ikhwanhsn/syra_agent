import { useReducedMotion, motion } from "framer-motion";
import { computeProgressToHundredM, UPONLY_MILESTONES, TARGET_MARKET_CAP_USD } from "@/data/riseUpOnly";
import { useRiseUpOnlyMarket } from "@/lib/RiseUpOnlyMarketContext";
import { formatUsd } from "@/lib/marketDisplayFormat";
import { SectionEyebrow, itemFade, stagger } from "./primitives";

const STAGE_INFO: Record<string, { unlock: string }> = {
  genesis: {
    unlock: "Narrative + on-chain spec published; RISE market live; learning loops open.",
  },
  "5m": {
    unlock: "Deeper market structure tests; expanded Syra RISE content and analytics.",
  },
  "25m": {
    unlock: "Institutional story compounding: partnerships, data room depth, and borrow usage telemetry.",
  },
  "100m": {
    unlock: "Milestone: first RISE token at $100M+ reference — a shared proof point for the design.",
  },
};

export function MilestoneRoadmap() {
  const reduce = useReducedMotion() ?? false;
  const { data: v } = useRiseUpOnlyMarket();
  const p = computeProgressToHundredM(v);

  return (
    <section className="mb-20 min-w-0" aria-labelledby="milestone-heading" id="milestone-roadmap">
      <div className="mb-8 min-w-0 max-w-3xl">
        <SectionEyebrow>North star</SectionEyebrow>
        <h2
          id="milestone-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] min-[500px]:text-2xl sm:text-3xl md:text-4xl"
        >
          Roadmap to {formatUsd(TARGET_MARKET_CAP_USD, { compact: false })} <span className="text-foreground/75">(public)</span>
        </h2>
        <p className="mt-3 break-words text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          Current market cap: {formatUsd(v.marketCapUsd, { compact: false })} · You are in stage{" "}
          <span className="font-medium text-foreground">{p.currentStageLabel}</span>
          {p.nextMilestoneLabel ? (
            <>
              {" "}
              · next gate: {p.nextMilestoneLabel} (
              {p.nextMilestoneUsd !== null ? formatUsd(p.nextMilestoneUsd, { compact: false }) : "—"}
              )
            </>
          ) : null}
        </p>
        <div className="mt-4 h-2.5 w-full min-w-0 max-w-md overflow-hidden rounded-full bg-muted/30">
          <div
            className="h-full origin-left bg-gradient-to-r from-success/60 to-foreground/40"
            style={{ width: `${Math.min(100, p.pctToward100M)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground/90">Progress to target is a ratio of published market cap, not a prediction.</p>
      </div>
      <motion.div
        {...stagger(reduce)}
        className="grid min-w-0 max-w-full grid-cols-1 gap-3 min-[500px]:grid-cols-2 lg:grid-cols-4"
      >
        {UPONLY_MILESTONES.map((m, i) => {
          const isGen = m.id === "genesis";
          return (
            <motion.div
              key={m.id}
              {...itemFade(reduce)}
              className={isGen
                ? "flex min-w-0 flex-col rounded-2xl border border-success/25 bg-success/[0.06] p-3.5 sm:p-4"
                : "flex min-w-0 flex-col rounded-2xl border border-border/50 bg-card/35 p-3.5 sm:p-4"}
            >
              <span className="font-mono text-xs text-muted-foreground">{i}</span>
              <p className="mt-1 break-words text-balance text-base font-semibold text-foreground sm:text-lg">
                {m.label}
              </p>
              <p className="mt-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-sm">
                {STAGE_INFO[m.id as keyof typeof STAGE_INFO]?.unlock ?? "—"}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
