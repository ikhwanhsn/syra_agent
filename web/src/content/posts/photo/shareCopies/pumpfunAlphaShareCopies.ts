import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Pump.fun alpha photo deck — 15 distinct topics. */
export const PUMPFUN_ALPHA_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Pump.fun moves faster than manual tabs. Syra just shipped three agents to keep up.

Alpha/Beta Play Radar. Learning Scout. Utility Scout.

Hourly snapshots. Calm frontend reads. No live rescans on every page load.

The alpha desk → syraa.fun/alpha`,

  thesis: `Pump.fun moves faster than manual tabs.

Meme runners, beta followers, and utility projects need different lenses. Syra runs three agents on a shared 1-hour cadence and serves /alpha from saved snapshots — not live rescans on every visit.

Compute once. Read many times.`,

  quote: `"Compute once per hour. Read many times from DB."

Live pump.fun + LLM on every dashboard load doesn't scale. Hourly MongoDB snapshots power calm frontend reads and agent tools.`,

  flow: `How Syra Pump.fun agents work:

1. Scheduler ticks hourly when Mongo snapshot is stale
2. Persist radar + scout results to DB
3. GET /trend and /brief serve database only
4. UI caches 1h — refresh re-reads saved intel

No spam rescans. Three specialized lenses on one cadence.`,

  timeline: `Pump.fun intel pipeline — step by step:

→ Hourly scheduler checks Mongo snapshot freshness
→ Radar runs per period/mode. Scouts persist under pumpfun-*-scout:latest
→ GET endpoints return database source only
→ React Query 1h staleTime — UI refresh re-reads DB

Fast frontend. Fresh hourly intel. No live API hammering.`,

  pillars: `Three Pump.fun agents. One hourly cadence:

→ Radar: pumpScore + alignmentScore for alpha + beta plays
→ Scout: learned-fit from past alpha history → predicted runners
→ Utility: tech/metadata signals with meme penalties
→ Gate: anti-spam — skip rerun if fresh, force=true for admin`,

  checklist: `Pump.fun alpha agent highlights:

→ Alpha / Beta Play Radar: hot tape + aligned beta plays
→ Alpha Scout: past alpha memory → predicted runners
→ Utility Scout: tech/metadata signals, meme penalties
→ Shared PUMPFUN_AGENTS_REFRESH_MS (default 1h)`,

  metrics: `3 agents. 1-hour refresh. Database reads only.

Hourly MongoDB snapshots power Radar, Scout, and Utility tabs — with anti-spam gates so compute runs once, not on every refresh.

Explore → syraa.fun/alpha`,

  featured: `1-hour refresh. Database reads only.

Syra Pump.fun intelligence doesn't hammer live APIs on every visit. Snapshots persist to Mongo. Frontend stays fast even when pump.fun doesn't.

Compute once per hour. Read many times.`,

  comparison: `Before: Live pump.fun + LLM on every dashboard load. Mixed meme and utility signals in one feed.

Now: Three agents, hourly DB snapshots, dedicated Alpha tabs, anti-spam refresh gates.

The alpha desk your agents deserve — without the tab chaos.`,

  launch: `SHIP LOG · Pump.fun Alpha Agents are live.

Three specialized agents: Radar, Scout, Utility.

Hourly MongoDB snapshots. Calm frontend reads. Dedicated /alpha tabs.

Open the desk → syraa.fun/alpha`,

  deepDive: `Pump.fun alpha — API surface:

→ GET /agent/pumpfun-alpha/trend · savedAt + nextRefreshAt
→ GET /agent/pumpfun-alpha-scout/brief · predicted alphas
→ GET /agent/pumpfun-utility-scout/brief · utility picks
→ Agent tools: pumpfun-alpha-scout, pumpfun-utility-scout`,

  split: `Three lenses. One hourly cadence.

RADAR + SCOUT
Meme tape intelligence. Hot runners and predicted alphas from learned history.

UTILITY SCOUT
Tech/metadata signals. Ecosystem registry. Meme penalties filtered out.

Split the tape so you see runners and utility projects separately.`,

  terminal: `Pump.fun alpha from the terminal:

$ curl api.syraa.fun/agent/pumpfun-alpha/trend?period=week
< source: database · savedAt: … · nextRefreshAt: …
$ curl api.syraa.fun/agent/pumpfun-alpha-scout/brief
< predictedAlphas · learnedProfile · pastAlphaHistory
$ curl api.syraa.fun/agent/pumpfun-utility-scout/brief
< pumpfunUtilityPicks · ecosystemUtilityPicks

Build on Syra. Ship faster than the tape moves.`,

  cta: `Your Pump.fun alpha desk is live.

→ Alpha UI: syraa.fun/alpha
→ Scout API: /agent/pumpfun-alpha-scout/brief
→ Utility API: /agent/pumpfun-utility-scout/brief

Hourly snapshots. Database source. Agent tools wired in.`,
};
