import { LP_REAL_PROFITABILITY_POST } from "../lpRealProfitabilityUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { LP_REAL_PROFITABILITY_PHOTO_SHARE_COPIES } from "./shareCopies/lpRealProfitabilityShareCopies";

const copies = LP_REAL_PROFITABILITY_PHOTO_SHARE_COPIES;

/** Photo-format content for the LP real profitability ship log: 15 cards, 15 X posts. */
export const LP_REAL_PROFITABILITY_PHOTO = definePhotoUpdate(LP_REAL_PROFITABILITY_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-brand",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Fee-aware · Pool gates · Trailing stop",
      title: "LP Real Profitability",
      subtitle:
        "Live Meteora LP agents now hold fee winners, skip unprofitable pools, and exit on net economics, not price drift alone.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Price stops were ignoring fees already earned.",
      body: "In the sim lab, positions could show Loss while Sim PnL stayed green. The live agent used the same blunt rule, and closed fee-positive trades on raw price drift.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "LP profitability is net economics, not price direction alone.",
      narrative:
        "Fees earned extend the stop. Trailing rules lock winners. On-chain fees ground every exit decision on live Meteora positions.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Exit flow",
      headline: "Track fees → extend stop → trail peak → close on net.",
      steps: [
        { step: "01", title: "Track real fees", description: "Claimed + unclaimed on-chain fees ground PnL." },
        { step: "02", title: "Extend the stop", description: "Fees earned push price stop wider, with hard IL cap." },
        { step: "03", title: "Trail the peak", description: "Close on giveback to bank fees before they fade." },
        { step: "04", title: "Net win or loss", description: "Exit status follows net PnL, not drift alone." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Sim to live",
      headline: "From lab proof to production enforcement.",
      steps: [
        { step: "01", title: "Sim exposed gap", description: "Loss status with green PnL on fee-heavy pools." },
        { step: "02", title: "Fee-aware stop", description: "Fees extend price stop up to half its distance." },
        { step: "03", title: "Cost + pool gates", description: "1.6× tx costs and 0.55 R:R before open." },
        { step: "04", title: "Trailing on live", description: "peakPnlPct tracked, winners locked on giveback." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four gates between your wallet and bad LP trades.",
      cards: [
        { title: "Fee-aware stop", subtitle: "Fees extend stop", detail: "Hard stop at 1.4× caps tail IL.", accent: "gold" },
        { title: "Cost gate", subtitle: "1.6× tx costs", detail: "No open until expected fees justify spend.", accent: "gold" },
        { title: "Pool screen", subtitle: "0.55 R:R", detail: "Extreme-risk pools banned from real capital." },
        { title: "Adaptive exits", subtitle: "Frozen at open", detail: "Pool-aware stop and TP from live fee/TVL." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "LP real profitability. What changed.",
      highlights: [
        "Fee-aware stop loss with hard IL cap",
        "Chain-cost viability gate before every open",
        "Trailing stop on live Meteora positions",
        "On-chain fees ground exit PnL decisions",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Three thresholds that guard real capital.",
      stats: [
        { value: "1.6×", label: "Min fee-to-cost at open" },
        { value: "0.55", label: "Real pool R:R hurdle" },
        { value: "1.4×", label: "Hard stop multiplier" },
      ],
      narrative: "Pools must pay for themselves. Exits follow net economics. Tail risk stays capped.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Fee-positive positions stay open longer.",
      stats: [{ value: "Net", label: "Economics drive every exit" }],
      narrative:
        "When LP fees outweigh price drift, the agent holds. When fees can't cover chain costs, it never opens.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: {
        title: "Before",
        body: "Closed on raw price drift. Fee-positive positions exited as losses. Extreme pools could qualify.",
      },
      compareRight: {
        title: "Now",
        body: "Fee-aware stops. Trailing exits. Stricter pool screen. On-chain fees ground PnL.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      title: "LP Real Profitability",
      subtitle: "Fee-aware exits, pool gates, and trailing stops for live Meteora LP.",
      body: "The sim lab bug is fixed for real SOL. Hold fee winners. Skip pools that can't pay for themselves.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "End-to-end profitability stack.",
      items: [
        "evaluateRealPositionExit: fee-aware stop + trailing",
        "passesRealPoolScreen: 0.55 R:R, extreme tier banned",
        "Chain-cost gate in attemptOpenLpRealPosition",
        "peakPnlPct on LpRealPosition for trailing tracking",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Sim → Live",
      headline: "Sim exposed the gap. Live agent closes it.",
      body: "Sim showed Loss + green PnL. Live agent now extends stops by fees earned and trails peak net PnL.",
      highlights: [
        "On-chain fees ground exit decisions",
        "Hard stop caps catastrophic IL",
        "Cost gate before every open",
        "Trailing stop locks fee winners",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Resolve tick in action.",
      terminalLines: [
        "$ syra lp real --resolve",
        "> Bountywork/SOL · net +7.86% · price -8.2%",
        "> fees earned: 0.0968 SOL · stop extended",
        "> peak PnL 9.1% · trailing not triggered",
        "> holding · fee-positive despite drift",
        "< net economics, not price alone",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Prove the edge in sim. Deploy with fee-aware protection.",
      subtitle: "Watch sim leaders prove out, then enable your LP agent with smarter exits on real SOL.",
      links: [
        { label: "LP experiment", value: "syraa.fun/lp-experiment", href: "https://www.syraa.fun/lp-experiment" },
        { label: "Real agent", value: "Live positions", href: "https://www.syraa.fun/lp-experiment#real-agent" },
        { label: "Settings", value: "Fund LP wallet", href: "https://www.syraa.fun/settings" },
      ],
    }),
  },
]);
