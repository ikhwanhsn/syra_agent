import type { X402Analytics } from "@/lib/internalAnalyticsApi";
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

function fmtUsd(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function formatNetwork(network: string): string {
  if (network.startsWith("solana:")) return network.includes("5eykt") ? "Solana mainnet" : "Solana";
  if (network.startsWith("eip155:8453")) return "Base";
  if (network.startsWith("eip155:56")) return "BSC";
  if (network.includes("algorand")) return "Algorand";
  return network.length > 20 ? `${network.slice(0, 18)}…` : network;
}

function toChartData(items: { date: string; usdVolume?: number; calls?: number; count?: number }[], key: "usdVolume" | "calls" | "count" = "count") {
  return items.slice(-14).map((d) => ({
    date: d.date,
    value: key === "usdVolume" ? (d.usdVolume ?? 0) : key === "calls" ? (d.calls ?? 0) : (d.count ?? 0),
  }));
}

function cardsFromItems(sectionId: string, items: MetricShareItem[]): MetricShareCardSpec[] {
  return items.map((item, i) => ({
    id: `${sectionId}-${i}`,
    label: item.label,
    item,
  }));
}

function buildSectionPayloads(data: X402Analytics): Record<string, MetricShareSectionPayload> {
  const { summary, funnel, topEndpoints, byNetwork, byFacilitator, daily, updatedAt } = data;

  return {
    "x402-headline": {
      sectionId: "x402-headline",
      title: "x402 telemetry",
      subtitle: "Per-call payment rail snapshot",
      updatedAt,
      badge: "x402 live",
      items: [
        {
          label: "USD volume (30d)",
          value: fmtUsd(summary.usdVolumeLast30d),
          hint: `${fmtUsd(summary.totalUsdVolume)} all-time`,
          highlight: true,
          numeric: summary.usdVolumeLast30d,
        },
        {
          label: "Success rate",
          value: pct(summary.successRate),
          hint: `${fmt(summary.paidCalls)} paid / ${fmt(summary.totalCalls)} total`,
          highlight: true,
          numeric: summary.successRate,
        },
        {
          label: "Unique payers",
          value: fmt(summary.uniquePayers),
          hint: "Inbound settled wallets",
          numeric: summary.uniquePayers,
        },
        {
          label: "Failures (7d)",
          value: fmt(summary.failuresLast7d),
          hint: `${fmt(summary.failuresLast30d)} last 30d`,
          numeric: summary.failuresLast7d,
        },
        {
          label: "402 → paid conversion",
          value: pct(summary.conversionRate),
          hint: `${pct(summary.growthPct, true)} paid growth 30d`,
          highlight: true,
          numeric: summary.conversionRate,
        },
        {
          label: "Inbound / Outbound",
          value: `${fmt(summary.inboundCalls)} / ${fmt(summary.outboundCalls)}`,
          hint: "Merchant vs agent payer",
          numeric: summary.inboundCalls + summary.outboundCalls,
        },
      ],
    },
    "x402-funnel": {
      sectionId: "x402-funnel",
      title: "Payment funnel",
      subtitle: "402 issued → verify → settle → paid",
      updatedAt,
      badge: "x402 funnel",
      heroValue: pct(funnel.conversionRate),
      heroLabel: "Conversion rate",
      heroHint: `${fmt(funnel.paid)} paid of ${fmt(funnel.paymentRequired + funnel.verifyFailed + funnel.settleFailed + funnel.paid)} inbound attempts`,
      items: [
        { label: "402 issued", value: fmt(funnel.paymentRequired), numeric: funnel.paymentRequired },
        { label: "Verify failed", value: fmt(funnel.verifyFailed), numeric: funnel.verifyFailed },
        { label: "Settle failed", value: fmt(funnel.settleFailed), numeric: funnel.settleFailed },
        { label: "Paid", value: fmt(funnel.paid), highlight: true, numeric: funnel.paid },
      ],
    },
    "x402-volume": {
      sectionId: "x402-volume",
      title: "Daily x402 volume",
      subtitle: "USD settled + call events — last 14 days",
      updatedAt,
      badge: "Revenue pulse",
      items: [
        { label: "USD (30d)", value: fmtUsd(summary.usdVolumeLast30d), highlight: true, numeric: summary.usdVolumeLast30d },
        { label: "Paid calls (30d)", value: fmt(summary.paidCallsLast30d), numeric: summary.paidCallsLast30d },
        { label: "Total events (30d)", value: fmt(summary.callsLast30d), numeric: summary.callsLast30d },
        { label: "Success rate", value: pct(summary.successRate), numeric: summary.successRate },
      ],
      charts: [
        {
          label: "Daily USD volume",
          color: "#34D399",
          accent: "rgba(52,211,153,0.35)",
          data: toChartData(daily, "usdVolume"),
        },
        {
          label: "Daily call events",
          color: "#F3BA2F",
          accent: "rgba(243,186,47,0.35)",
          data: toChartData(daily, "calls"),
        },
      ],
    },
    "x402-endpoints": {
      sectionId: "x402-endpoints",
      title: "Top x402 endpoints",
      subtitle: "Most used APIs by call volume (30d)",
      updatedAt,
      badge: "Endpoint rank",
      items: topEndpoints.slice(0, 10).map((e, i) => ({
        label: e.path,
        value: fmt(e.calls),
        hint: `${fmtUsd(e.successUsd)} · ${pct(e.errorRate)} err · ${e.direction}`,
        highlight: i === 0,
        numeric: e.calls,
      })),
    },
    "x402-reliability": {
      sectionId: "x402-reliability",
      title: "Network & facilitator health",
      subtitle: "Chain distribution and payment reliability",
      updatedAt,
      badge: "Reliability",
      items: [
        ...byNetwork.slice(0, 4).map((n, i) => ({
          label: formatNetwork(n.network),
          value: pct(n.successRate),
          hint: `${fmt(n.calls)} calls · ${fmtUsd(n.successUsd)}`,
          highlight: i === 0,
          numeric: n.successRate,
        })),
        ...byFacilitator.slice(0, 4).map((f) => ({
          label: f.facilitator,
          value: pct(f.successRate),
          hint: `${fmt(f.calls)} calls · ${fmtUsd(f.successUsd)}`,
          numeric: f.successRate,
        })),
      ],
    },
  };
}

export function buildX402ShareSectionBundle(
  sectionId: string,
  data: X402Analytics,
): MetricShareSectionBundle | null {
  const payloads = buildSectionPayloads(data);
  const section = payloads[sectionId];
  if (!section) return null;

  const mode = PER_ITEM_SHARE_SECTIONS.has(sectionId) ? "per-item" : "section";

  return {
    sectionId,
    sectionTitle: section.title,
    mode,
    updatedAt: section.updatedAt,
    badge: section.badge,
    cards:
      mode === "per-item"
        ? cardsFromItems(sectionId, section.items)
        : [{ id: sectionId, label: section.title, item: section.items[0] ?? { label: section.title, value: "—" } }],
    section,
  };
}

export function buildAllX402ShareBundles(data: X402Analytics): Record<string, MetricShareSectionBundle> {
  const ids = Object.keys(buildSectionPayloads(data));
  const out: Record<string, MetricShareSectionBundle> = {};
  for (const id of ids) {
    const bundle = buildX402ShareSectionBundle(id, data);
    if (bundle) out[id] = bundle;
  }
  return out;
}
