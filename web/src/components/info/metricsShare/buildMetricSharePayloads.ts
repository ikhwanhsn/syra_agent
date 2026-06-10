import type { AnalyticsKpi, AnalyticsKpiExtended } from "@/lib/internalAnalyticsApi";
import type {
  MetricShareCardSpec,
  MetricShareItem,
  MetricShareSectionBundle,
  MetricShareSectionPayload,
} from "@/components/info/metricsShare/types";
import { PER_ITEM_SHARE_SECTIONS } from "@/components/info/metricsShare/types";

function fmt(n: number): string {
  return n.toLocaleString();
}

function pct(n: number, signed = false): string {
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function sumDaily(items: { count: number }[]): number {
  return items.reduce((a, b) => a + b.count, 0);
}

function toChartData(items: { date: string; count: number }[]) {
  return items.slice(-14).map((d) => ({ date: d.date, value: d.count }));
}

function cardsFromItems(sectionId: string, items: MetricShareItem[]): MetricShareCardSpec[] {
  return items.map((item, i) => ({
    id: `${sectionId}-${i}`,
    label: item.label,
    item,
  }));
}

function buildSectionPayloads(
  kpi: AnalyticsKpi,
  extended: AnalyticsKpiExtended,
): Record<string, MetricShareSectionPayload> {
  const updatedAt = kpi.updatedAt;
  const errorRate7d =
    kpi.insights.totalRequestsLast7d > 0
      ? (kpi.insights.errorCountLast7d / kpi.insights.totalRequestsLast7d) * 100
      : 0;
  const paid7d = sumDaily(kpi.dailyPaidCalls.slice(-7));
  const dau7d = sumDaily(extended.users.dailyActiveUsers.slice(-7));

  return {
    headline: {
      sectionId: "headline",
      title: "Headline KPIs",
      subtitle: "Live production snapshot",
      updatedAt,
      badge: "Live metrics",
      items: [
        { label: "Total paid calls", value: fmt(kpi.totalPaidApiCalls), hint: `${fmt(kpi.paidApiCallsLast7Days)} last 7d`, highlight: true, numeric: kpi.totalPaidApiCalls },
        { label: "30d paid growth", value: pct(extended.revenue.growthPct, true), hint: `${fmt(extended.revenue.paidCurr30d)} vs ${fmt(extended.revenue.paidPrev30d)} prior`, highlight: true, numeric: extended.revenue.growthPct },
        { label: "Unique users", value: fmt(extended.users.uniqueUsersTotal), hint: `${fmt(extended.users.uniqueUsersLast7d)} active 7d`, numeric: extended.users.uniqueUsersTotal },
        { label: "Total chats", value: fmt(extended.users.totalChats), hint: `${fmt(extended.users.chatsLast30d)} new 30d`, numeric: extended.users.totalChats },
        { label: "Paid conversion", value: pct(extended.conversion.conversionRate), hint: `${fmt(extended.conversion.paidRequests30d)} / ${fmt(extended.conversion.totalRequests30d)} reqs`, numeric: extended.conversion.conversionRate },
        { label: "Playground shares", value: fmt(extended.playground.totalShares), hint: `${fmt(extended.playground.sharesLast7d)} last 7d`, numeric: extended.playground.totalShares },
      ],
    },
    monetization: {
      sectionId: "monetization",
      title: "Monetization & conversion",
      subtitle: "Paid rail activity · last 30 days",
      updatedAt,
      badge: "x402 revenue",
      heroValue: pct(extended.conversion.conversionRate),
      heroLabel: "Paid conversion rate",
      heroHint: `${fmt(extended.conversion.paidRequests30d)} paid / ${fmt(extended.conversion.totalRequests30d)} total requests`,
      items: [
        { label: "Paid conversion (30d)", value: pct(extended.conversion.conversionRate), hint: `${fmt(extended.conversion.paidRequests30d)} / ${fmt(extended.conversion.totalRequests30d)} reqs`, highlight: true, numeric: extended.conversion.conversionRate },
        { label: "Paid calls (30d)", value: fmt(kpi.paidApiCallsLast30Days), hint: `${fmt(kpi.paidApiCallsLast7Days)} last 7d`, numeric: kpi.paidApiCallsLast30Days },
        { label: "30d paid growth", value: pct(extended.revenue.growthPct, true), hint: `${fmt(extended.revenue.paidCurr30d)} vs ${fmt(extended.revenue.paidPrev30d)} prior`, highlight: true, numeric: extended.revenue.growthPct },
        { label: "Completed tool calls", value: fmt(kpi.completedPaidToolCalls), hint: "All-time successful paid tools", numeric: kpi.completedPaidToolCalls },
        { label: "Chats w/ paid tools", value: fmt(kpi.chatsWithPaidToolUse), hint: "Sessions that triggered x402", numeric: kpi.chatsWithPaidToolUse },
        { label: "Paid requests (30d)", value: fmt(extended.conversion.paidRequests30d), hint: "Monetized API requests", numeric: extended.conversion.paidRequests30d },
      ],
    },
    charts: {
      sectionId: "charts",
      title: "Growth trends",
      subtitle: "14-day paid calls & daily active users",
      updatedAt,
      badge: "Trends",
      items: [
        { label: "Paid calls (7d)", value: fmt(paid7d), highlight: true },
        { label: "DAU sum (7d)", value: fmt(dau7d), highlight: true },
        { label: "New chats (30d)", value: fmt(extended.users.chatsLast30d) },
        { label: "Paid growth", value: pct(extended.revenue.growthPct, true) },
      ],
      charts: [
        { label: "Paid x402 calls", color: "#F3BA2F", accent: "rgba(243,186,47,0.35)", data: toChartData(kpi.dailyPaidCalls) },
        { label: "Daily active users", color: "#A78BFA", accent: "rgba(167,139,250,0.35)", data: toChartData(extended.users.dailyActiveUsers) },
      ],
    },
    revenue: {
      sectionId: "revenue",
      title: "Revenue rail",
      subtitle: "Paid x402 by source & path (30d)",
      updatedAt,
      badge: "Revenue",
      items: [
        ...extended.revenue.bySource.map((s) => ({ label: s.source, value: fmt(s.count), highlight: s.source === "agent", numeric: s.count })),
        ...extended.revenue.byPathAndSource.slice(0, 6).map((r) => ({ label: r.path, value: fmt(r.count), hint: r.source, numeric: r.count })),
      ],
    },
    traffic: {
      sectionId: "traffic",
      title: "API traffic",
      subtitle: "Volume, errors & request pulse",
      updatedAt,
      badge: "Traffic",
      items: [
        { label: "Requests 24h", value: fmt(kpi.insights.totalRequestsLast24h), highlight: true, numeric: kpi.insights.totalRequestsLast24h },
        { label: "Requests 7d", value: fmt(kpi.insights.totalRequestsLast7d), numeric: kpi.insights.totalRequestsLast7d },
        { label: "Requests 30d", value: fmt(kpi.insights.totalRequestsLast30d), numeric: kpi.insights.totalRequestsLast30d },
        { label: "Errors 7d", value: fmt(kpi.insights.errorCountLast7d), numeric: kpi.insights.errorCountLast7d },
        { label: "Error rate 7d", value: pct(errorRate7d), numeric: errorRate7d },
        ...kpi.insights.requestsByPath.slice(0, 4).map((r) => ({ label: r.path, value: fmt(r.count), hint: `${fmt(r.avgDurationMs)}ms avg`, numeric: r.count })),
      ],
      charts: [{ label: "Daily requests", color: "#38BDF8", accent: "rgba(56,189,248,0.35)", data: toChartData(kpi.insights.dailyRequests) }],
    },
    engagement: {
      sectionId: "engagement",
      title: "Engagement",
      subtitle: "Chat depth & new session velocity",
      updatedAt,
      items: [
        { label: "Avg msgs / chat", value: extended.users.avgMessagesPerChat.toFixed(1), highlight: true },
        { label: "Total messages", value: fmt(extended.users.totalMessages) },
        { label: "Max in one chat", value: fmt(extended.users.maxMessagesInChat) },
        { label: "Paid tool calls", value: fmt(kpi.completedPaidToolCalls) },
        { label: "Unique users 30d", value: fmt(extended.users.uniqueUsersLast30d) },
      ],
      charts: [{ label: "New chats per day", color: "#38BDF8", accent: "rgba(56,189,248,0.35)", data: toChartData(extended.users.dailyNewChats) }],
    },
    agents: {
      sectionId: "agents",
      title: "Agent & tool usage",
      subtitle: "What drives paid activity",
      updatedAt,
      items: [
        ...extended.users.topAgents.slice(0, 6).map((a, i) => ({ label: a.agentId, value: fmt(a.count), highlight: i === 0, numeric: a.count })),
        ...extended.users.toolUsage.slice(0, 4).map((t) => ({ label: t.name, value: fmt(t.total), hint: `${pct(t.successRate)} success`, numeric: t.total })),
      ],
    },
    playground: {
      sectionId: "playground",
      title: "Playground adoption",
      subtitle: "Shared API request links",
      updatedAt,
      items: [
        { label: "Total shares", value: fmt(extended.playground.totalShares), highlight: true, numeric: extended.playground.totalShares },
        { label: "7d shares", value: fmt(extended.playground.sharesLast7d), numeric: extended.playground.sharesLast7d },
        { label: "30d shares", value: fmt(extended.playground.sharesLast30d), numeric: extended.playground.sharesLast30d },
        ...extended.playground.byChain.map((c) => ({ label: c.chain, value: fmt(c.count), numeric: c.count })),
      ],
      charts: [{ label: "Daily shares", color: "#FBBF24", accent: "rgba(251,191,36,0.35)", data: toChartData(extended.playground.dailyShares) }],
    },
    health: {
      sectionId: "health",
      title: "System health",
      subtitle: "Latency & reliability (7d)",
      updatedAt,
      badge: "Reliability",
      items: [
        { label: "Avg latency", value: `${fmt(extended.health.avgLatency)}ms`, highlight: true, numeric: extended.health.avgLatency },
        { label: "P95 latency", value: `${fmt(extended.health.p95Latency)}ms`, numeric: extended.health.p95Latency },
        { label: "P99 latency", value: `${fmt(extended.health.p99Latency)}ms`, numeric: extended.health.p99Latency },
        ...extended.health.statusCodeDistribution.map((s) => ({ label: s.status, value: fmt(s.count), numeric: s.count })),
        ...extended.health.errorRateByEndpoint.slice(0, 3).map((e) => ({ label: e.path, value: pct(e.errorRate), hint: `${fmt(e.errors)} errors`, numeric: e.errorRate })),
      ],
    },
    endpoints: {
      sectionId: "endpoints",
      title: "Top paid endpoints",
      subtitle: "All-time x402 volume by API path",
      updatedAt,
      items: kpi.byPath.slice(0, 10).map((r, i) => ({ label: r.path, value: fmt(r.count), highlight: i === 0, numeric: r.count })),
    },
  };
}

export function buildMetricShareSectionBundle(
  sectionId: string,
  kpi: AnalyticsKpi,
  extended: AnalyticsKpiExtended,
): MetricShareSectionBundle | null {
  const payloads = buildSectionPayloads(kpi, extended);
  const section = payloads[sectionId];
  if (!section) return null;

  const mode = PER_ITEM_SHARE_SECTIONS.has(sectionId) ? "per-item" : "section";

  return {
    sectionId,
    sectionTitle: section.title,
    mode,
    updatedAt: section.updatedAt,
    badge: section.badge,
    cards: mode === "per-item" ? cardsFromItems(sectionId, section.items) : [{ id: sectionId, label: section.title, item: section.items[0] ?? { label: section.title, value: "—" } }],
    section,
  };
}

export function buildAllMetricShareBundles(
  kpi: AnalyticsKpi,
  extended: AnalyticsKpiExtended,
): Record<string, MetricShareSectionBundle> {
  const ids = Object.keys(buildSectionPayloads(kpi, extended));
  const out: Record<string, MetricShareSectionBundle> = {};
  for (const id of ids) {
    const bundle = buildMetricShareSectionBundle(id, kpi, extended);
    if (bundle) out[id] = bundle;
  }
  return out;
}

/** @deprecated use buildAllMetricShareBundles */
export function buildMetricSharePayloads(kpi: AnalyticsKpi, extended: AnalyticsKpiExtended) {
  return buildSectionPayloads(kpi, extended);
}
