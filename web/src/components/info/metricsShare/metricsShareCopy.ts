import type {
  MetricShareItem,
  MetricShareSectionBundle,
  MetricShareSectionPayload,
} from "@/components/info/metricsShare/types";

const SYRA_HOME = "https://www.syraa.fun";
const SYRA_PLAYGROUND = "https://www.syraa.fun/playground";

export type MetricShareCopyContext = {
  bundle: MetricShareSectionBundle;
  section: MetricShareSectionPayload;
  item: MetricShareItem;
  cardLabel: string;
};

function topItems(section: MetricShareSectionPayload, count = 3): MetricShareItem[] {
  const highlighted = section.items.filter((i) => i.highlight);
  const rest = section.items.filter((i) => !i.highlight);
  return [...highlighted, ...rest].slice(0, count);
}

function bulletStats(items: MetricShareItem[]): string {
  return items.map((i) => `→ ${i.label}: ${i.value}`).join("\n");
}

const HEADLINE_ITEM_COPY: Record<string, (ctx: MetricShareCopyContext) => string> = {
  "Total paid calls": ({ item }) =>
    `Syra just crossed ${item.value} paid x402 calls.

Real agents. Real USDC. Real HTTP-native micropayments — not vaporware.

The paid rail is LIVE and compounding.

${item.hint ? `→ ${item.hint}\n` : ""}→ syraa.fun`,

  "30d paid growth": ({ item }) =>
    `${item.value} paid growth in 30 days on Syra.

x402 micropayments are not a demo anymore — they're a revenue engine shipping in production.

${item.hint ? `→ ${item.hint}\n` : ""}Agents pay per call. Builders get paid per API hit.

→ syraa.fun`,

  "Unique users": ({ item }) =>
    `${item.value} unique users on Syra — and climbing.

AI agents + crypto natives are showing up for x402-native intelligence, swaps, and on-chain tools.

${item.hint ? `→ ${item.hint}\n` : ""}This is what product-market pull looks like.

→ syraa.fun`,

  "Total chats": ({ item }) =>
    `${item.value} agent chats shipped on Syra.

Every session is a live stress test for paid tools, real data, and on-chain execution.

${item.hint ? `→ ${item.hint}\n` : ""}The agent layer is eating the workflow.

→ syraa.fun`,

  "Paid conversion": ({ item }) =>
    `${item.value} paid conversion on Syra's x402 rail.

Free discovery → paid execution. No subscriptions. No API keys. Just sign and pay per call.

${item.hint ? `→ ${item.hint}\n` : ""}Micropayments that actually convert.

→ syraa.fun/playground`,

  "Playground shares": ({ item }) =>
    `${item.value} playground shares — devs are spreading Syra API calls like wildfire.

One link. One x402 payment. Instant agent-ready endpoints.

${item.hint ? `→ ${item.hint}\n` : ""}Builders share → agents pay → flywheel spins.

→ syraa.fun/playground`,
};

const MONETIZATION_ITEM_COPY: Record<string, (ctx: MetricShareCopyContext) => string> = {
  "Paid conversion (30d)": ({ section, item }) =>
    `${item.value} paid conversion in 30 days.

Syra's x402 rail turns curiosity into USDC. Every paid call is proof the agent economy works.

${section.heroHint ? `→ ${section.heroHint}\n` : ""}No gatekeepers. No monthly invoices. Pay per hit.

→ syraa.fun/playground`,

  "Paid calls (30d)": ({ item }) =>
    `${item.value} paid x402 calls in the last 30 days.

Agents are spending real USDC on Syra intelligence, tools, and on-chain data — at HTTP speed.

${item.hint ? `→ ${item.hint}\n` : ""}The meter is running. The product is shipping.

→ syraa.fun`,

  "30d paid growth": ({ item }) =>
    `Paid volume up ${item.value} in 30 days on Syra.

x402 micropayments aren't theory — they're a live revenue line compounding week over week.

${item.hint ? `→ ${item.hint}\n` : ""}Build in public. Get paid in public.

→ syraa.fun`,

  "Completed tool calls": ({ item }) =>
    `${item.value} completed paid tool calls — all time on Syra.

Every successful call = an agent that paid, executed, and got real output back.

This is the infrastructure layer for autonomous finance.

→ syraa.fun`,

  "Chats w/ paid tools": ({ item }) =>
    `${item.value} chats triggered paid x402 tools on Syra.

Users don't just chat — they execute. Swap. Query. Pay. Done.

The agent isn't a toy. It's a transaction machine.

→ syraa.fun`,

  "Paid requests (30d)": ({ item }) =>
    `${item.value} monetized API requests in 30 days.

Syra ships HTTP-native paid endpoints that agents can hit without friction — wallet signs, USDC moves, data flows.

${item.hint ? `→ ${item.hint}\n` : ""}Revenue rail: ON.

→ api.syraa.fun`,
};

const SECTION_COPY: Record<string, (ctx: MetricShareCopyContext) => string> = {
  headline: ({ section }) => {
    const stats = bulletStats(topItems(section, 4));
    return `Syra production metrics — LIVE.

The x402 agent stack is shipping, paying, and compounding in the wild.

${stats}

Real users. Real paid calls. Real build-in-public energy.

→ syraa.fun`;
  },

  monetization: ({ section }) => {
    const hero = section.heroValue ? `${section.heroLabel ?? "Paid conversion"}: ${section.heroValue}` : null;
    const stats = bulletStats(topItems(section, 4));
    return `Syra x402 monetization — CRUSHING.

${hero ? `${hero}\n${section.heroHint ? `→ ${section.heroHint}\n` : ""}` : ""}${stats}

Micropayments per API call. No subscriptions. Agents pay → builders earn.

→ syraa.fun/playground`;
  },

  charts: ({ section }) => {
    const stats = bulletStats(topItems(section, 4));
    return `Syra growth trends — accelerating.

14-day pulse on paid x402 calls + daily active users. The chart only goes one direction: UP.

${stats}

Agents arrive. They pay. They come back. Repeat.

→ syraa.fun`;

  },

  revenue: ({ section }) => {
    const stats = bulletStats(topItems(section, 5));
    return `Syra revenue rail — LIVE breakdown.

Paid x402 volume by source and API path. Every bar is real USDC from real agent traffic.

${stats}

This is what agent-native monetization looks like at scale.

→ api.syraa.fun`;
  },

  traffic: ({ section }) => {
    const stats = bulletStats(topItems(section, 4));
    return `Syra API traffic — PUMPING.

Production request volume, error rates, and path-level pulse. The backend is eating load.

${stats}

Built for agents. Stress-tested in the wild.

→ api.syraa.fun`;
  },

  engagement: ({ section }) => {
    const stats = bulletStats(topItems(section, 4));
    return `Syra engagement — DEEP.

Chat depth, message velocity, and session intensity. Users aren't bouncing — they're going deep.

${stats}

Sticky agents. Repeat paid tool use. Real product love.

→ syraa.fun`;
  },

  agents: ({ section }) => {
    const stats = bulletStats(topItems(section, 5));
    return `Syra agent leaderboard — WHO'S WINNING.

Top agents and tools driving paid activity right now. The ecosystem picks its favorites.

${stats}

Ship an agent. Plug into x402. Watch it climb.

→ syraa.fun`;
  },

  playground: ({ section }) => {
    const stats = bulletStats(topItems(section, 4));
    return `Syra API Playground — VIRAL among builders.

Shared request links spreading across chains. Devs test x402 endpoints and ship faster.

${stats}

Share a link → someone pays → your API gets exercised.

→ syraa.fun/playground`;
  },

  health: ({ section }) => {
    const stats = bulletStats(topItems(section, 4));
    return `Syra system health — BATTLE-TESTED.

Latency, reliability, and error spectrum across production endpoints. Fast. Stable. Shipping.

${stats}

Agents need uptime. We deliver.

→ api.syraa.fun`;
  },

  endpoints: ({ section }) => {
    const top = section.items[0];
    const stats = bulletStats(topItems(section, 4));
    return `Syra top paid endpoints — WHERE THE MONEY FLOWS.

${top ? `#1 ${top.label}: ${top.value} paid calls\n` : ""}${stats}

These API paths are the beating heart of the x402 agent economy.

→ api.syraa.fun`;
  },
};

function resolvePerItemCopy(ctx: MetricShareCopyContext): string | null {
  const { bundle, cardLabel } = ctx;
  if (bundle.sectionId === "headline") {
    return HEADLINE_ITEM_COPY[cardLabel]?.(ctx) ?? null;
  }
  if (bundle.sectionId === "monetization") {
    return MONETIZATION_ITEM_COPY[cardLabel]?.(ctx) ?? null;
  }
  return null;
}

export function getMetricShareCopy(ctx: MetricShareCopyContext): string {
  if (ctx.bundle.mode === "per-item") {
    const perItem = resolvePerItemCopy(ctx);
    if (perItem) return perItem.trim();
  }

  const sectionFn = SECTION_COPY[ctx.bundle.sectionId] ?? SECTION_COPY.headline!;
  return sectionFn(ctx).trim();
}

export function getMetricShareCopyWithUrl(ctx: MetricShareCopyContext): string {
  const body = getMetricShareCopy(ctx);
  const url =
    ctx.bundle.sectionId === "playground" ||
    ctx.cardLabel === "Paid conversion" ||
    ctx.cardLabel === "Playground shares" ||
    ctx.cardLabel.includes("conversion")
      ? SYRA_PLAYGROUND
      : SYRA_HOME;
  if (body.includes("syraa.fun")) return body;
  return `${body}\n\n${url}`;
}

export function buildMetricShareOnXUrl(ctx: MetricShareCopyContext): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(getMetricShareCopyWithUrl(ctx))}`;
}

export async function copyMetricShareText(ctx: MetricShareCopyContext): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getMetricShareCopyWithUrl(ctx));
    return true;
  } catch {
    return false;
  }
}
