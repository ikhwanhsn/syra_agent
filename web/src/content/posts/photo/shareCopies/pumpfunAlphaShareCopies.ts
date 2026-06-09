import type { PostPhotoLayoutTemplate } from "../layouts";

/** Per-template X copy for Pump.fun alpha photo picks — tuned to each card's visual story. */
export const PUMPFUN_ALPHA_PHOTO_SHARE_COPIES: Partial<Record<PostPhotoLayoutTemplate, string>> = {
  "photo-cover-brand": `Pump.fun moves faster than manual tabs. Syra just shipped three agents to keep up.

Alpha/Beta Play Radar. Learning Scout. Utility Scout.

Hourly snapshots. Calm frontend reads. No live rescans on every page load.

The alpha desk your agents deserve → syraa.fun/alpha`,

  "photo-hero-checklist": `Three Pump.fun agents. One hourly refresh cadence:

→ Alpha/Beta Play Radar: hot tape + aligned beta plays
→ Alpha Scout: past alpha memory → predicted runners
→ Utility Scout: tech/metadata signals, meme penalties filtered

Compute once per hour. Read many times from DB. Frontend stays fast even when pump.fun doesn't.

Open /alpha → syraa.fun/alpha`,

  "photo-timeline": `How Syra Pump.fun agents work:

1. Scheduler ticks hourly when Mongo snapshot is stale
2. Persist radar + scout results to DB
3. GET /trend and /brief serve database only
4. UI caches 1h — refresh re-reads saved intel

No spam rescans. No mixed meme/utility noise. Three specialized lenses on one cadence.

Try it → syraa.fun/alpha`,

  "photo-cards-duo": `Two agents. Two lenses. Same hourly cadence:

→ Radar: pumpScore + alignmentScore pairing for alpha + beta plays
→ Scout: learned-fit from past alpha history → predicted runners

Pump.fun alpha isn't one signal. Syra splits the tape so you see runners and followers separately.

Alpha desk → syraa.fun/alpha`,

  "photo-metric-strip": `3 agents. 1-hour refresh. Database reads only.

Syra Pump.fun intelligence doesn't hammer live APIs on every visit. Hourly MongoDB snapshots power Radar, Scout, and Utility tabs — with anti-spam gates so compute runs once, not on every refresh.

Fast UI. Fresh intel. No subscription wall.

Explore → syraa.fun/alpha`,

  "photo-terminal": `API-first Pump.fun alpha — for agents, not tourists:

$ curl api.syraa.fun/agent/pumpfun-alpha/trend
$ curl api.syraa.fun/agent/pumpfun-alpha-scout/brief
$ curl api.syraa.fun/agent/pumpfun-utility-scout/brief

Hourly snapshots. Database source. Agent tools wired in.

Build on Syra. Ship faster than the tape moves.`,
};
