import { PUMPFUN_ALPHA_POST } from "../pumpfunAlphaUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { PUMPFUN_ALPHA_PHOTO_SHARE_COPIES } from "./shareCopies/pumpfunAlphaShareCopies";

const copies = PUMPFUN_ALPHA_PHOTO_SHARE_COPIES;

/** Photo-format content for the Pump.fun alpha agents ship log — 15 cards, 15 X posts. */
export const PUMPFUN_ALPHA_PHOTO = definePhotoUpdate(PUMPFUN_ALPHA_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-brand",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Radar · Scout · Utility",
      title: "Pump.fun Alpha Agents",
      subtitle: "Three specialized agents with hourly MongoDB snapshots and calm frontend reads.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "Pump.fun moves faster than manual tabs.",
      body: "Meme runners, beta followers, and utility projects need different lenses. Syra runs three agents on a shared 1-hour cadence and serves /alpha from saved snapshots, not live rescans on every visit.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Compute once per hour. Read many times from DB.",
      narrative: "Live pump.fun + LLM on every dashboard load doesn't scale. Hourly snapshots power calm frontend reads and agent tools.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Intel pipeline",
      headline: "Schedule → persist → serve → cache.",
      steps: [
        { step: "01", title: "Scheduler", description: "Hourly tick when Mongo snapshot is stale." },
        { step: "02", title: "Persist", description: "Radar per period/mode. Scouts under pumpfun-*-scout:latest." },
        { step: "03", title: "Serve GET", description: "/trend and /brief return database source only." },
        { step: "04", title: "UI cache", description: "React Query 1h staleTime. Refresh re-reads DB." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Hourly cadence",
      headline: "No live rescans on every visit.",
      steps: [
        { step: "01", title: "Stale check", description: "Scheduler compares now vs PUMPFUN_AGENTS_REFRESH_MS." },
        { step: "02", title: "Agent run", description: "Radar + Scout + Utility compute and persist to Mongo." },
        { step: "03", title: "API serve", description: "GET endpoints return savedAt + nextRefreshAt metadata." },
        { step: "04", title: "Frontend read", description: "React Query serves cached intel. Refresh hits DB only." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Three agents. One cadence.",
      cards: [
        { title: "Radar", subtitle: "Alpha + Beta", detail: "pumpScore + alignmentScore pairing.", accent: "gold" },
        { title: "Scout", subtitle: "Learning", detail: "Learned-fit from past alpha history.", accent: "gold" },
        { title: "Utility", subtitle: "Tech", detail: "Product language, links, ecosystem registry." },
        { title: "Gate", subtitle: "Anti-spam", detail: "Skip rerun if fresh. force=true for admin." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Pump.fun alpha agent highlights.",
      highlights: [
        "Alpha / Beta Play Radar: hot tape + aligned beta plays",
        "Alpha Scout: past alpha memory → predicted runners",
        "Utility Scout: tech/metadata signals, meme penalties",
        "Shared PUMPFUN_AGENTS_REFRESH_MS (default 1h)",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Fast UI. Fresh intel.",
      stats: [
        { value: "3", label: "Agents" },
        { value: "1h", label: "Refresh" },
        { value: "DB", label: "Reads" },
      ],
      narrative: "Hourly MongoDB snapshots with anti-spam gates — compute runs once, not on every page load.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Database reads only.",
      stats: [{ value: "1h", label: "Refresh · anti-spam gated" }],
      narrative: "Frontend stays fast even when pump.fun doesn't. Snapshots persist. Agents and UI read from Mongo.",
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
        body: "Live pump.fun + LLM on every dashboard load. Mixed meme and utility signals in one feed.",
      },
      compareRight: {
        title: "Now",
        body: "Three agents, hourly DB snapshots, dedicated Alpha tabs, anti-spam refresh gates.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      title: "Pump.fun Alpha Agents",
      subtitle: "Radar · Scout · Utility — hourly snapshots.",
      body: "Dedicated /alpha tabs. Calm frontend reads. Agent tools wired in.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "API surface",
      headline: "Built for agents and dashboards.",
      items: [
        "GET /agent/pumpfun-alpha/trend · savedAt + nextRefreshAt",
        "GET /agent/pumpfun-alpha-scout/brief · predicted alphas",
        "GET /agent/pumpfun-utility-scout/brief · utility picks",
        "Agent tools: pumpfun-alpha-scout, pumpfun-utility-scout",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Three lenses",
      headline: "Split the tape. See runners and utility separately.",
      body: "Radar and Scout track meme alpha. Utility Scout filters tech/metadata signals with meme penalties.",
      highlights: [
        "Radar: hot tape + aligned beta plays",
        "Scout: predicted runners from history",
        "Utility: product language + ecosystem",
        "One hourly cadence across all three",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Pump.fun alpha from CLI.",
      terminalLines: [
        "$ curl api.syraa.fun/agent/pumpfun-alpha/trend?period=week",
        "< source: database · savedAt: … · nextRefreshAt: …",
        "$ curl api.syraa.fun/agent/pumpfun-alpha-scout/brief",
        "< predictedAlphas · learnedProfile · pastAlphaHistory",
        "$ curl api.syraa.fun/agent/pumpfun-utility-scout/brief",
        "< pumpfunUtilityPicks · ecosystemUtilityPicks",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Your Pump.fun alpha desk is live.",
      subtitle: "Hourly snapshots. Database source. Agent tools wired in.",
      links: [
        { label: "Alpha", value: "syraa.fun/alpha", href: "https://www.syraa.fun/alpha" },
        { label: "Scout API", value: "/agent/pumpfun-alpha-scout/brief", href: "https://api.syraa.fun/agent/pumpfun-alpha-scout/brief" },
        { label: "Utility API", value: "/agent/pumpfun-utility-scout/brief", href: "https://api.syraa.fun/agent/pumpfun-utility-scout/brief" },
      ],
    }),
  },
]);
