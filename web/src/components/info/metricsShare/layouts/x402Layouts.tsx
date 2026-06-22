import { cn } from "@/lib/utils";
import type { MetricShareLayoutProps } from "@/components/info/metricsShare/types";
import {
  FeaturedStat,
  HorizontalRankBars,
  MetricsShareShell,
  PostPhotoBadge,
  PostPhotoBody,
  PostPhotoHeadline,
  PostPhotoKicker,
  PostPhotoStatGrid,
  SectionHeader,
  ShareAreaChart,
  ShareSparkBars,
  StatChip,
} from "@/components/info/metricsShare/primitives";

type L = MetricShareLayoutProps;

function chartData(section: L["section"], idx = 0) {
  return section.charts?.[idx]?.data ?? [];
}

function chartSeries(section: L["section"], idx = 0) {
  return section.charts?.[idx];
}

/* ── x402 HEADLINE (per-item) ── */

export function X402Monolith({ section, item }: L) {
  return (
    <MetricsShareShell>
      <div className="metrics-share-monolith-center">
        <PostPhotoBadge text={section.badge ?? "x402 live"} />
        <PostPhotoKicker>{section.title}</PostPhotoKicker>
        <FeaturedStat value={item.value} label={item.label} />
        {item.hint ? <PostPhotoBody className="metrics-share-hint">{item.hint}</PostPhotoBody> : null}
        <p className="post-photo-kicker mt-6 opacity-50">syraa.fun · machine money rail</p>
      </div>
    </MetricsShareShell>
  );
}

export function X402Circuit({ section, item }: L) {
  const peers = section.items.filter((i) => i.label !== item.label).slice(0, 3);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <div className="metrics-share-title-band">
          <PostPhotoKicker>{section.badge ?? "x402 telemetry"}</PostPhotoKicker>
          <PostPhotoHeadline className="metrics-share-band-headline">{item.label}</PostPhotoHeadline>
        </div>
        <div className="metrics-share-band-body">
          <div className="metrics-share-band-stat">
            <FeaturedStat value={item.value} label={item.label} />
            {item.hint ? <PostPhotoBody className="metrics-share-hint">{item.hint}</PostPhotoBody> : null}
          </div>
          <div className="metrics-share-orbit-ring" aria-hidden>
            <div className="metrics-share-orbit-core">{item.value}</div>
            {peers.map((p, i) => (
              <span key={p.label} className={cn("metrics-share-orbit-node", `metrics-share-orbit-node--${i}`)}>
                {p.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function X402Receipt({ section, item }: L) {
  const rows = section.items.slice(0, 5);
  return (
    <MetricsShareShell className="metrics-share-canvas--terminal">
      <div className="metrics-share-receipt">
        <p className="metrics-share-terminal-prompt">
          <span className="metrics-share-terminal-dollar">$</span> x402 settle --export
        </p>
        <p className="metrics-share-receipt-title">{item.label}</p>
        <p className="metrics-share-receipt-hero">{item.value}</p>
        {item.hint ? <p className="metrics-share-receipt-hint"># {item.hint}</p> : null}
        <div className="metrics-share-receipt-divider" />
        {rows.map((r) => (
          <div key={r.label} className="metrics-share-receipt-line">
            <span>{r.label}</span>
            <span>{r.value}</span>
          </div>
        ))}
        <p className="metrics-share-receipt-footer">HTTP 402 → PAYMENT-SIGNATURE → 200 · syraa.fun</p>
      </div>
    </MetricsShareShell>
  );
}

/* ── x402 FUNNEL (section) ── */

export function X402FunnelCascade({ section }: L) {
  const steps = section.items;
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <PostPhotoBadge text={section.badge ?? "x402 funnel"} />
        <PostPhotoKicker>{section.title}</PostPhotoKicker>
        {section.heroValue ? (
          <div className="metrics-share-funnel-hero">
            <p className="metrics-share-pulse-value">{section.heroValue}</p>
            <p className="post-photo-card-sub">{section.heroLabel ?? "Conversion"}</p>
            {section.heroHint ? <PostPhotoBody className="metrics-share-hint">{section.heroHint}</PostPhotoBody> : null}
          </div>
        ) : null}
        <div className="metrics-share-funnel-steps">
          {steps.map((s, i) => (
            <div key={s.label} className="metrics-share-funnel-step" style={{ width: `${100 - i * 12}%` }}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function X402FunnelVault({ section }: L) {
  const paid = section.items.find((i) => i.highlight) ?? section.items[section.items.length - 1];
  const ledger = section.items.filter((i) => i !== paid);
  return (
    <MetricsShareShell>
      <div className="metrics-share-vault-split">
        <div className="metrics-share-vault-door post-photo-card post-photo-card--gold">
          <PostPhotoKicker>402 → paid</PostPhotoKicker>
          <p className="metrics-share-glass-value">{paid?.value ?? "—"}</p>
          <p className="post-photo-card-sub">{paid?.label ?? "Paid"}</p>
          {section.heroHint ? <p className="post-photo-card-detail">{section.heroHint}</p> : null}
        </div>
        <div className="metrics-share-vault-ledger">
          <PostPhotoKicker>{section.title}</PostPhotoKicker>
          {ledger.map((row) => (
            <div key={row.label} className="metrics-share-ledger-row">
              <span>{row.label}</span>
              <span className="metrics-share-ledger-val">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function X402FunnelStream({ section }: L) {
  return (
    <MetricsShareShell className="metrics-share-canvas--terminal">
      <div className="metrics-share-receipt metrics-share-receipt--wide">
        <p className="metrics-share-terminal-prompt">
          <span className="metrics-share-terminal-dollar">$</span> x402 funnel --inbound --30d
        </p>
        <p className="metrics-share-receipt-title">{section.heroLabel ?? "Conversion"}: {section.heroValue ?? "—"}</p>
        <div className="metrics-share-receipt-divider" />
        {section.items.map((r) => (
          <div key={r.label} className="metrics-share-receipt-line">
            <span>{r.label}</span>
            <span className={r.highlight ? "metrics-share-terminal-highlight" : undefined}>{r.value}</span>
          </div>
        ))}
        <p className="metrics-share-receipt-footer">syraa.fun/internal · x402 merchant rail</p>
      </div>
    </MetricsShareShell>
  );
}

/* ── x402 VOLUME (section) ── */

export function X402VolumeWave({ section }: L) {
  const c0 = chartSeries(section, 0);
  const stats = section.items.slice(0, 4);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="USD pulse" />
        <PostPhotoStatGrid stats={stats.map((s) => ({ value: s.value, label: s.label }))} variant="counter" />
        {c0 ? (
          <ShareAreaChart data={c0.data} color={c0.color} accent={c0.accent} label={c0.label} height={240} />
        ) : null}
      </div>
    </MetricsShareShell>
  );
}

export function X402VolumePulse({ section }: L) {
  const c0 = chartSeries(section, 0);
  const c1 = chartSeries(section, 1);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} />
        <div className="metrics-share-dual-charts metrics-share-dual-charts--tall">
          <div className="metrics-share-chart-panel">
            {c0 ? <ShareSparkBars data={c0.data.map((d) => d.value)} color={c0.color} height={260} /> : null}
            <p className="post-photo-kicker">{c0?.label}</p>
          </div>
          <div className="metrics-share-chart-panel">
            {c1 ? <ShareSparkBars data={c1.data.map((d) => d.value)} color={c1.color} height={260} /> : null}
            <p className="post-photo-kicker">{c1?.label}</p>
          </div>
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function X402VolumeStack({ section }: L) {
  const c0 = chartSeries(section, 0);
  const corners = section.items.slice(0, 4);
  return (
    <MetricsShareShell>
      <div className="metrics-share-timeline-layout">
        <div className="metrics-share-timeline-corners">
          {corners.map((c) => (
            <StatChip key={c.label} item={c} />
          ))}
        </div>
        <div className="metrics-share-timeline-chart">
          <PostPhotoHeadline>{section.title}</PostPhotoHeadline>
          {c0 ? <ShareAreaChart data={c0.data} color={c0.color} accent={c0.accent} label="" height={300} /> : null}
        </div>
      </div>
    </MetricsShareShell>
  );
}

/* ── x402 ENDPOINTS (section) ── */

export function X402EndpointsRank({ section }: L) {
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Top APIs" />
        <HorizontalRankBars items={section.items} maxItems={8} barColor="#34D399" />
      </div>
    </MetricsShareShell>
  );
}

export function X402EndpointsTerminal({ section }: L) {
  return (
    <MetricsShareShell className="metrics-share-canvas--terminal">
      <div className="metrics-share-receipt metrics-share-receipt--wide">
        <p className="metrics-share-terminal-prompt">
          <span className="metrics-share-terminal-dollar">$</span> x402 top --by-calls --30d
        </p>
        {section.items.slice(0, 10).map((r, i) => (
          <div key={r.label} className="metrics-share-receipt-line">
            <span>{String(i + 1).padStart(2, "0")} {r.label}</span>
            <span className={i === 0 ? "metrics-share-terminal-highlight" : undefined}>{r.value}</span>
          </div>
        ))}
      </div>
    </MetricsShareShell>
  );
}

export function X402EndpointsChampion({ section }: L) {
  const top = section.items[0];
  const rest = section.items.slice(1, 7);
  return (
    <MetricsShareShell>
      <div className="metrics-share-champion">
        <div className="metrics-share-champion-hero post-photo-card post-photo-card--gold">
          <PostPhotoBadge text="#1 x402 endpoint" />
          {top ? (
            <>
              <p className="metrics-share-glass-value metrics-share-glass-value--md">{top.value}</p>
              <p className="post-photo-card-sub">{top.label}</p>
              {top.hint ? <p className="post-photo-card-detail">{top.hint}</p> : null}
            </>
          ) : null}
        </div>
        <div className="metrics-share-champion-grid">
          {rest.map((r) => (
            <div key={r.label} className="metrics-share-stat-panel">
              <span className="metrics-share-panel-value metrics-share-panel-value--sm">{r.value}</span>
              <span className="post-photo-stat-label">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

/* ── x402 RELIABILITY (section) ── */

export function X402ReliabilityGrid({ section }: L) {
  const networks = section.items.filter((i) => !["payai", "corbits", "b402", "algorand", "local", "upstream"].includes(i.label));
  const facilitators = section.items.filter((i) =>
    ["payai", "corbits", "b402", "algorand", "local", "upstream"].includes(i.label),
  );
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Reliability" />
        <PostPhotoKicker>Networks</PostPhotoKicker>
        <div className="metrics-share-pill-row mb-4">
          {networks.slice(0, 4).map((n) => (
            <span key={n.label} className={cn("metrics-share-pill", n.highlight && "metrics-share-pill--gold")}>
              {n.label}: {n.value}
            </span>
          ))}
        </div>
        <PostPhotoKicker>Facilitators</PostPhotoKicker>
        <div className="metrics-share-pill-row">
          {facilitators.slice(0, 4).map((f) => (
            <span key={f.label} className="metrics-share-pill">
              {f.label}: {f.value}
            </span>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function X402ReliabilitySpectrum({ section }: L) {
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} />
        <HorizontalRankBars items={section.items} maxItems={8} barColor="#A78BFA" />
      </div>
    </MetricsShareShell>
  );
}

export function X402ReliabilityCommand({ section }: L) {
  const tiles = section.items.slice(0, 6);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Health" />
        <div className="metrics-share-command-grid">
          {tiles.map((t) => (
            <div
              key={t.label}
              className={cn("metrics-share-command-tile", t.highlight && "metrics-share-command-tile--gold")}
            >
              <span className="metrics-share-command-val">{t.value}</span>
              <span className="post-photo-stat-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export const X402_HEADLINE_ITEM_LAYOUTS = [X402Monolith, X402Circuit, X402Receipt] as const;

export const X402_SECTION_LAYOUTS = {
  "x402-funnel": [X402FunnelCascade, X402FunnelVault, X402FunnelStream] as const,
  "x402-volume": [X402VolumeWave, X402VolumePulse, X402VolumeStack] as const,
  "x402-endpoints": [X402EndpointsRank, X402EndpointsTerminal, X402EndpointsChampion] as const,
  "x402-reliability": [X402ReliabilityGrid, X402ReliabilitySpectrum, X402ReliabilityCommand] as const,
};
