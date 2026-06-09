import { PUMPFUN_ALPHA_POST } from "../pumpfunAlphaUpdate";
import type { PostPhotoUpdate } from "./types";

/** Photo-format content for the Pump.fun alpha agents ship log. */
export const PUMPFUN_ALPHA_PHOTO: PostPhotoUpdate = {
  meta: PUMPFUN_ALPHA_POST.meta,
  picks: [
    "photo-cover-brand",
    "photo-hero-checklist",
    "photo-timeline",
    "photo-cards-duo",
    "photo-metric-strip",
    "photo-terminal",
  ],
  content: {
    eyebrow: "Ship log",
    badge: "Radar · Scout · Utility",
    title: "Pump.fun Alpha Agents",
    subtitle: "Three specialized agents with hourly MongoDB snapshots and calm frontend reads.",
    kicker: "Why this matters",
    headline: "Pump.fun moves faster than manual tabs.",
    body: "Meme runners, beta followers, and utility projects need different lenses. Syra runs three agents on a shared 1-hour cadence and serves /alpha from saved snapshots, not live rescans on every visit.",
    quote: "Compute once per hour. Read many times from DB.",
    highlights: [
      "Alpha / Beta Play Radar: hot tape + aligned beta plays",
      "Alpha Scout: past alpha memory → predicted runners",
      "Utility Scout: tech/metadata signals, meme penalties",
      "Shared PUMPFUN_AGENTS_REFRESH_MS (default 1h)",
    ],
    steps: [
      { step: "01", title: "Scheduler", description: "Hourly tick when Mongo snapshot is stale." },
      { step: "02", title: "Persist", description: "Radar per period/mode. Scouts under pumpfun-*-scout:latest." },
      { step: "03", title: "Serve GET", description: "/trend and /brief return database source only." },
      { step: "04", title: "UI cache", description: "React Query 1h staleTime. Refresh re-reads DB." },
    ],
    cards: [
      { title: "Radar", subtitle: "Alpha + Beta", detail: "pumpScore + alignmentScore pairing.", accent: "gold" },
      { title: "Scout", subtitle: "Learning", detail: "Learned-fit from past alpha history.", accent: "gold" },
      { title: "Utility", subtitle: "Tech", detail: "Product language, links, ecosystem registry." },
      { title: "Gate", subtitle: "Anti-spam", detail: "Skip rerun if fresh. force=true for admin." },
    ],
    stats: [
      { value: "3", label: "Agents" },
      { value: "1h", label: "Refresh" },
      { value: "DB", label: "Reads" },
    ],
    narrative: "Open /alpha for Radar, Scout, and Utility tabs. Experiment paper-trading uses the same hourly experiment snapshot.",
    links: [
      { label: "Alpha", value: "syraa.fun/alpha", href: "https://www.syraa.fun/alpha" },
      { label: "Scout API", value: "/agent/pumpfun-alpha-scout/brief", href: "https://api.syraa.fun/agent/pumpfun-alpha-scout/brief" },
      { label: "Utility API", value: "/agent/pumpfun-utility-scout/brief", href: "https://api.syraa.fun/agent/pumpfun-utility-scout/brief" },
    ],
    items: [
      "GET /agent/pumpfun-alpha/trend · savedAt + nextRefreshAt",
      "GET /agent/pumpfun-alpha-scout/brief · predicted alphas",
      "GET /agent/pumpfun-utility-scout/brief · utility picks",
      "Agent tools: pumpfun-alpha-scout, pumpfun-utility-scout",
    ],
    compareLeft: {
      title: "Before",
      body: "Live pump.fun + LLM on every dashboard load. Mixed meme and utility signals in one feed.",
    },
    compareRight: {
      title: "Now",
      body: "Three agents, hourly DB snapshots, dedicated Alpha tabs, anti-spam refresh gates.",
    },
    terminalLines: [
      "$ curl api.syraa.fun/agent/pumpfun-alpha/trend?period=week",
      "< source: database · savedAt: … · nextRefreshAt: …",
      "$ curl api.syraa.fun/agent/pumpfun-alpha-scout/brief",
      "< predictedAlphas · learnedProfile · pastAlphaHistory",
      "$ curl api.syraa.fun/agent/pumpfun-utility-scout/brief",
      "< pumpfunUtilityPicks · ecosystemUtilityPicks",
      "# optional: PUMPFUN_AGENTS_REFRESH_MS=3600000",
    ],
  },
};
