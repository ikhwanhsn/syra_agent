import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Pump.fun alpha photo deck — 15 distinct topics. */
export const PUMPFUN_ALPHA_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Pump.fun outruns manual tabs. Syra shipped three agents to keep pace.

Alpha/Beta Radar. Learning Scout. Utility Scout.

Hourly MongoDB snapshots. Calm frontend reads. No live rescans on every load.

Open the desk → syraa.fun/alpha`,

  thesis: `Manual tabs lose the tape. Pump.fun doesn't wait.

Meme runners, beta followers, and utility builds need different lenses — not one mixed feed.

Syra runs Radar, Scout, and Utility on a shared 1-hour cadence. /alpha serves saved snapshots, not live rescans on every visit.

Compute once. Read many times.`,

  quote: `"Compute once per hour. Read many times from DB."

The old pattern: live pump.fun + LLM on every dashboard load. It doesn't scale.

Hourly MongoDB snapshots power fast UI reads and agent tools — without hammering APIs.`,

  flow: `How Syra Pump.fun intel stays fast:

1. Scheduler ticks hourly when Mongo snapshot is stale
2. Radar + Scouts persist results to DB
3. GET /trend and /brief serve database source only
4. UI caches 1h — refresh re-reads saved intel

Three lenses. One cadence. Zero spam rescans.`,

  timeline: `Pump.fun intel — hourly, not on every click:

→ Scheduler checks snapshot freshness vs PUMPFUN_AGENTS_REFRESH_MS
→ Radar + Scout + Utility compute and persist to Mongo
→ GET endpoints return savedAt + nextRefreshAt metadata
→ React Query 1h staleTime — UI refresh hits DB, not live APIs

Fresh intel. Fast frontend. Predictable load.`,

  pillars: `Three agents. One hourly cadence. No mixed signals:

→ Radar: pumpScore + alignmentScore for alpha + beta plays
→ Scout: learned-fit from past alpha history → predicted runners
→ Utility: tech/metadata signals with meme penalties
→ Gate: anti-spam — skip rerun if fresh, force=true for admin`,

  checklist: `What shipped on the Pump.fun alpha desk:

→ Alpha / Beta Play Radar: hot tape + aligned beta plays
→ Alpha Scout: past alpha memory → predicted runners
→ Utility Scout: tech/metadata signals, meme penalties filtered
→ Shared PUMPFUN_AGENTS_REFRESH_MS (default 1h)`,

  metrics: `3 agents. 1-hour refresh. Database reads only.

Hourly MongoDB snapshots power Radar, Scout, and Utility tabs — with anti-spam gates so compute runs once, not on every page load.

Stop refreshing into live APIs → syraa.fun/alpha`,

  featured: `1-hour refresh. Database reads only.

Syra doesn't hammer pump.fun on every visit. Snapshots persist to Mongo. Frontend stays fast even when the tape doesn't.

Compute once per hour. Read many times from DB.`,

  comparison: `Before: Live pump.fun + LLM on every dashboard load. Meme and utility signals mixed in one feed.

Now: Three specialized agents. Hourly DB snapshots. Dedicated Alpha tabs. Anti-spam refresh gates.

Split the tape. Stop chasing tabs.`,

  launch: `SHIP LOG · Pump.fun Alpha Agents are live.

Radar, Scout, Utility — three lenses on one hourly cadence.

MongoDB snapshots. Calm frontend reads. Dedicated /alpha tabs. Agent tools wired in.

Open the desk → syraa.fun/alpha`,

  deepDive: `Build on Pump.fun alpha — API surface:

→ GET /agent/pumpfun-alpha/trend · savedAt + nextRefreshAt
→ GET /agent/pumpfun-alpha-scout/brief · predicted alphas
→ GET /agent/pumpfun-utility-scout/brief · utility picks
→ Agent tools: pumpfun-alpha-scout, pumpfun-utility-scout

Database source. Hourly cadence. Ready for your stack.`,

  split: `One feed can't track meme runners and utility builds.

RADAR + SCOUT
Hot tape intelligence. Predicted alphas from learned history.

UTILITY SCOUT
Tech/metadata signals. Ecosystem registry. Meme penalties filtered out.

Three lenses. One hourly cadence. See each market on its own terms.`,

  terminal: `Pump.fun alpha from the terminal:

$ curl api.syraa.fun/agent/pumpfun-alpha/trend?period=week
< source: database · savedAt: … · nextRefreshAt: …
$ curl api.syraa.fun/agent/pumpfun-alpha-scout/brief
< predictedAlphas · learnedProfile · pastAlphaHistory
$ curl api.syraa.fun/agent/pumpfun-utility-scout/brief
< pumpfunUtilityPicks · ecosystemUtilityPicks

Wire it into your workflow. Ship faster than the tape moves.`,

  cta: `Your Pump.fun alpha desk is live.

→ Alpha UI: syraa.fun/alpha
→ Scout API: /agent/pumpfun-alpha-scout/brief
→ Utility API: /agent/pumpfun-utility-scout/brief

Hourly snapshots. Database source. Agent tools wired in. Stop chasing tabs.`,
};
