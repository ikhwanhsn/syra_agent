import type { ComponentType } from "react";
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
  sparkBarsFromNumeric,
} from "@/components/info/metricsShare/primitives";

type L = MetricShareLayoutProps;

function maxNumeric(items: { numeric?: number }[]) {
  return Math.max(...items.map((i) => i.numeric ?? 0), 1);
}

function chartData(section: L["section"], idx = 0) {
  return section.charts?.[idx]?.data ?? [];
}

function chartSeries(section: L["section"], idx = 0) {
  return section.charts?.[idx];
}

/* ── CHARTS ── */
export function ChartsWall({ section }: L) {
  const c0 = chartSeries(section, 0);
  const c1 = chartSeries(section, 1);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Trends" />
        <div className="metrics-share-dual-charts metrics-share-dual-charts--tall">
          <div className="metrics-share-chart-panel">
            {c0 ? <ShareSparkBars data={c0.data.map((d) => d.value)} color={c0.color} height={280} /> : null}
            <p className="post-photo-kicker">{c0?.label}</p>
          </div>
          <div className="metrics-share-chart-panel">
            {c1 ? <ShareSparkBars data={c1.data.map((d) => d.value)} color={c1.color} height={280} /> : null}
            <p className="post-photo-kicker">{c1?.label}</p>
          </div>
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function ChartsVelocity({ section }: L) {
  const stats = section.items.slice(0, 4);
  const c0 = chartSeries(section, 0);
  const c1 = chartSeries(section, 1);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <PostPhotoStatGrid stats={stats.map((s) => ({ value: s.value, label: s.label }))} variant="counter" />
        <div className="metrics-share-dual-charts">
          {c0 ? <ShareAreaChart data={c0.data} color={c0.color} accent={c0.accent} label={c0.label} height={200} /> : null}
          {c1 ? <ShareAreaChart data={c1.data} color={c1.color} accent={c1.accent} label={c1.label} height={200} /> : null}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function ChartsTimeline({ section }: L) {
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
          {c0 ? <ShareAreaChart data={c0.data} color={c0.color} accent={c0.accent} label="" height={320} /> : null}
        </div>
      </div>
    </MetricsShareShell>
  );
}

/* ── REVENUE ── */
export function RevenueLadder({ section }: L) {
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Revenue" />
        <HorizontalRankBars items={section.items} maxItems={8} barColor="#F3BA2F" />
      </div>
    </MetricsShareShell>
  );
}

export function RevenueFacets({ section }: L) {
  const sources = section.items.filter((i) => !i.hint && i.label.length < 20).slice(0, 4);
  const paths = section.items.filter((i) => i.hint || i.label.includes("/")).slice(0, 5);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} />
        <div className="metrics-share-pill-row">
          {sources.map((s) => (
            <span key={s.label} className={cn("metrics-share-pill", s.highlight && "metrics-share-pill--gold")}>
              {s.label}: {s.value}
            </span>
          ))}
        </div>
        <HorizontalRankBars items={paths.length ? paths : section.items} maxItems={6} barColor="#F3BA2F" />
      </div>
    </MetricsShareShell>
  );
}

export function RevenueMarquee({ section }: L) {
  const cards = section.items.slice(0, 6);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <PostPhotoKicker>{section.title}</PostPhotoKicker>
        <div className="metrics-share-marquee-col">
          {cards.map((c, i) => (
            <div key={c.label} className={cn("metrics-share-marquee-card", i === 0 && "metrics-share-marquee-card--lead")}>
              <span className="metrics-share-marquee-val">{c.value}</span>
              <span className="post-photo-stat-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

/* ── TRAFFIC ── */
export function TrafficRiver({ section }: L) {
  const c0 = chartSeries(section, 0);
  const chips = section.items.slice(0, 4);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Traffic" />
        {c0 ? <ShareAreaChart data={c0.data} color={c0.color} accent={c0.accent} label={c0.label} height={260} /> : null}
        <div className="metrics-share-strip-full post-photo-metric-strip">
          {chips.map((c) => <StatChip key={c.label} item={c} />)}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function TrafficCommand({ section }: L) {
  const tiles = section.items.slice(0, 6);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} />
        <div className="metrics-share-command-grid">
          {tiles.map((t) => (
            <div key={t.label} className={cn("metrics-share-command-tile", t.highlight && "metrics-share-command-tile--gold")}>
              <span className="metrics-share-command-val">{t.value}</span>
              <span className="post-photo-stat-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function TrafficTerminal({ section }: L) {
  return (
    <MetricsShareShell className="metrics-share-canvas--terminal">
      <div className="metrics-share-receipt metrics-share-receipt--wide">
        <p className="metrics-share-terminal-prompt">
          <span className="metrics-share-terminal-dollar">$</span> syra traffic --live
        </p>
        <PostPhotoHeadline className="metrics-share-terminal-headline">{section.title}</PostPhotoHeadline>
        {section.items.slice(0, 8).map((r) => (
          <div key={r.label} className="metrics-share-receipt-line">
            <span>{r.label}</span>
            <span className={r.highlight ? "metrics-share-terminal-highlight" : undefined}>{r.value}</span>
          </div>
        ))}
      </div>
    </MetricsShareShell>
  );
}

/* ── ENGAGEMENT ── */
export function EngagementDepth({ section }: L) {
  const hero = section.items[0];
  const c0 = chartSeries(section, 0);
  const rest = section.items.slice(1, 4);
  return (
    <MetricsShareShell>
      <div className="metrics-share-split">
        <div className="metrics-share-split-left">
          <SectionHeader section={section} />
          {hero ? <FeaturedStat value={hero.value} label={hero.label} /> : null}
          <div className="metrics-share-mini-grid metrics-share-mini-grid--compact">
            {rest.map((r) => (
              <div key={r.label} className="metrics-share-stat-panel">
                <span className="metrics-share-panel-value">{r.value}</span>
                <span className="post-photo-stat-label">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="metrics-share-split-right">
          {c0 ? (
            <div className="metrics-share-chart-panel metrics-share-chart-panel--tall">
              <ShareAreaChart data={c0.data} color={c0.color} accent={c0.accent} label={c0.label} height={340} />
            </div>
          ) : null}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function EngagementCounter({ section }: L) {
  return (
    <MetricsShareShell>
      <div className="metrics-share-monolith-center metrics-share-monolith-center--top">
        <SectionHeader section={section} />
        <PostPhotoStatGrid
          stats={section.items.slice(0, 5).map((s) => ({ value: s.value, label: s.label }))}
          variant="counter"
        />
      </div>
    </MetricsShareShell>
  );
}

export function EngagementZigzag({ section }: L) {
  const steps = section.items.slice(0, 4);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} />
        <ul className="post-photo-zigzag metrics-share-zigzag-full">
          {steps.map((s, i) => (
            <li key={s.label} className={cn("post-photo-zigzag-item", i % 2 === 1 && "post-photo-zigzag-item--right")}>
              <span className="post-photo-timeline-dot">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="post-photo-timeline-title">{s.value}</p>
                <p className="post-photo-timeline-desc">{s.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MetricsShareShell>
  );
}

/* ── AGENTS ── */
export function AgentsPodium({ section }: L) {
  const agents = section.items.filter((i) => i.numeric != null).slice(0, 3);
  const heights = [160, 120, 96];
  const colors = ["#F3BA2F", "#C0C0C0", "#CD7F32"];
  const order = [1, 0, 2];
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Agents" />
        <div className="metrics-share-podium-row">
          {order.map((idx) => {
            const a = agents[idx];
            if (!a) return null;
            return (
              <div key={a.label} className="metrics-share-podium-col">
                <p className="metrics-share-podium-val">{a.value}</p>
                <div className="metrics-share-podium-bar" style={{ height: heights[idx], borderColor: `${colors[idx]}66`, background: `linear-gradient(to top, ${colors[idx]}33, transparent)` }}>
                  <span className="metrics-share-podium-label">{a.label.slice(0, 18)}</span>
                </div>
                <span className="metrics-share-podium-rank">#{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function AgentsBoard({ section }: L) {
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} />
        <HorizontalRankBars items={section.items.slice(0, 8)} maxItems={8} barColor="#A78BFA" />
      </div>
    </MetricsShareShell>
  );
}

export function AgentsMatrix({ section }: L) {
  const agents = section.items.slice(0, 4);
  const tools = section.items.slice(4, 8);
  return (
    <MetricsShareShell>
      <div className="metrics-share-matrix-split">
        <div>
          <PostPhotoKicker>Top agents</PostPhotoKicker>
          <div className="metrics-share-mini-grid">
            {agents.map((a) => (
              <div key={a.label} className="metrics-share-stat-panel metrics-share-stat-panel--gold">
                <span className="metrics-share-panel-value">{a.value}</span>
                <span className="post-photo-stat-label">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <PostPhotoKicker>Tool usage</PostPhotoKicker>
          <HorizontalRankBars items={tools} maxItems={4} barColor="#818CF8" />
        </div>
      </div>
    </MetricsShareShell>
  );
}

/* ── PLAYGROUND ── */
export function PlaygroundCurve({ section }: L) {
  const c0 = chartSeries(section, 0);
  const stats = section.items.slice(0, 3);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <div className="metrics-share-playground-top">
          {stats.map((s) => <StatChip key={s.label} item={s} />)}
        </div>
        {c0 ? <ShareAreaChart data={c0.data} color={c0.color} accent={c0.accent} label={c0.label} height={340} /> : null}
      </div>
    </MetricsShareShell>
  );
}

export function PlaygroundOrbit({ section }: L) {
  const chains = section.items.filter((i) => i.label.length < 12).slice(-4);
  const stats = section.items.slice(0, 3);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Dev adoption" />
        <div className="metrics-share-orbit-layout">
          <div className="metrics-share-orbit-center">
            {stats[0] ? <FeaturedStat value={stats[0].value} label={stats[0].label} /> : null}
          </div>
          <div className="metrics-share-orbit-pills">
            {chains.map((c, i) => (
              <span key={c.label} className={cn("metrics-share-orbit-pill", `metrics-share-orbit-pill--${i}`)}>
                {c.label} · {c.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function PlaygroundStack({ section }: L) {
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <PostPhotoKicker>{section.title}</PostPhotoKicker>
        <div className="metrics-share-marquee-col metrics-share-marquee-col--wide">
          {section.items.slice(0, 5).map((c, i) => (
            <div key={c.label} className={cn("metrics-share-marquee-card", i === 0 && "metrics-share-marquee-card--lead")}>
              <span className="metrics-share-marquee-val">{c.value}</span>
              <span className="post-photo-stat-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

/* ── HEALTH ── */
export function HealthRings({ section }: L) {
  const latency = section.items.filter((i) => i.label.toLowerCase().includes("latency")).slice(0, 3);
  const max = Math.max(...latency.map((l) => l.numeric ?? 0), 1);
  const colors = ["#34D399", "#FBBF24", "#F87171"];
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} badge="Reliability" />
        <div className="metrics-share-rings-row">
          {latency.map((l, i) => (
            <div key={l.label} className="metrics-share-ring-col">
              <div className="metrics-share-ring" style={{ background: `conic-gradient(${colors[i]} ${((l.numeric ?? 0) / max) * 360}deg, rgba(255,255,255,0.08) 0deg)` }}>
                <div className="metrics-share-ring-inner">{l.value.replace("ms", "")}</div>
              </div>
              <span className="post-photo-stat-label">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function HealthHistogram({ section }: L) {
  const statuses = section.items.filter((i) => !i.label.includes("/") && !i.label.toLowerCase().includes("latency")).slice(0, 6);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <SectionHeader section={section} />
        <ShareSparkBars data={statuses.map((s) => s.numeric ?? 1)} color="#34D399" height={300} />
        <div className="metrics-share-histogram-labels">
          {statuses.map((s) => (
            <span key={s.label} className="post-photo-stat-label">{s.label}</span>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function HealthSpectrum({ section }: L) {
  const errors = section.items.filter((i) => i.hint?.includes("errors") || i.label.includes("/"));
  const latency = section.items.filter((i) => i.label.toLowerCase().includes("latency"));
  return (
    <MetricsShareShell>
      <div className="metrics-share-split">
        <div className="metrics-share-split-left">
          <SectionHeader section={section} />
          <div className="metrics-share-spectrum-bar">
            {latency.map((l, i) => (
              <div key={l.label} className="metrics-share-spectrum-seg" style={{ flex: l.numeric ?? 1, opacity: 1 - i * 0.15 }}>
                <span>{l.label}</span>
                <strong>{l.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="metrics-share-split-right">
          <HorizontalRankBars items={errors.length ? errors : section.items.slice(3, 7)} maxItems={5} barColor="#F87171" />
        </div>
      </div>
    </MetricsShareShell>
  );
}

/* ── ENDPOINTS ── */
export function EndpointsEditorial({ section }: L) {
  const items = section.items.slice(0, 8);
  const max = maxNumeric(items);
  return (
    <MetricsShareShell light>
      <div className="metrics-share-editorial">
        <p className="metrics-share-editorial-kicker">Syra · x402 endpoints</p>
        <PostPhotoHeadline className="metrics-share-editorial-title">{section.title}</PostPhotoHeadline>
        {items.map((item, i) => (
          <div key={item.label} className="metrics-share-editorial-row">
            <span className="metrics-share-editorial-num">{String(i + 1).padStart(2, "0")}</span>
            <div className="metrics-share-editorial-body">
              <div className="metrics-share-editorial-meta">
                <span className="metrics-share-editorial-path">{item.label}</span>
                <span className="metrics-share-editorial-count">{item.value}</span>
              </div>
              <div className="metrics-share-editorial-track">
                <div className="metrics-share-editorial-fill" style={{ width: `${((item.numeric ?? 0) / max) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </MetricsShareShell>
  );
}

export function EndpointsTerminal({ section }: L) {
  return (
    <MetricsShareShell className="metrics-share-canvas--terminal">
      <div className="metrics-share-receipt metrics-share-receipt--wide">
        <p className="metrics-share-terminal-prompt">
          <span className="metrics-share-terminal-dollar">$</span> syra endpoints --top
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

export function EndpointsChampion({ section }: L) {
  const top = section.items[0];
  const rest = section.items.slice(1, 7);
  return (
    <MetricsShareShell>
      <div className="metrics-share-champion">
        <div className="metrics-share-champion-hero post-photo-card post-photo-card--gold">
          <PostPhotoBadge text="#1 endpoint" />
          {top ? (
            <>
              <p className="metrics-share-glass-value metrics-share-glass-value--md">{top.value}</p>
              <p className="post-photo-card-sub">{top.label}</p>
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

export const SECTION_LAYOUTS: Record<string, readonly [ComponentType<L>, ComponentType<L>, ComponentType<L>]> = {
  charts: [ChartsWall, ChartsVelocity, ChartsTimeline],
  revenue: [RevenueLadder, RevenueFacets, RevenueMarquee],
  traffic: [TrafficRiver, TrafficCommand, TrafficTerminal],
  engagement: [EngagementDepth, EngagementCounter, EngagementZigzag],
  agents: [AgentsPodium, AgentsBoard, AgentsMatrix],
  playground: [PlaygroundCurve, PlaygroundOrbit, PlaygroundStack],
  health: [HealthRings, HealthHistogram, HealthSpectrum],
  endpoints: [EndpointsEditorial, EndpointsTerminal, EndpointsChampion],
};
