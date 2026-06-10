import { cn } from "@/lib/utils";
import type { MetricShareLayoutProps } from "@/components/info/metricsShare/types";
import {
  FeaturedStat,
  MetricsShareShell,
  PostPhotoBadge,
  PostPhotoBody,
  PostPhotoHeadline,
  PostPhotoKicker,
} from "@/components/info/metricsShare/primitives";

export function HeadlineMonolith({ section, item }: MetricShareLayoutProps) {
  return (
    <MetricsShareShell>
      <div className="metrics-share-monolith-center">
        <PostPhotoBadge text={section.badge ?? "Live metrics"} />
        <PostPhotoKicker>{section.title}</PostPhotoKicker>
        <FeaturedStat value={item.value} label={item.label} />
        {item.hint ? <PostPhotoBody className="metrics-share-hint">{item.hint}</PostPhotoBody> : null}
      </div>
    </MetricsShareShell>
  );
}

export function HeadlineBand({ section, item }: MetricShareLayoutProps) {
  const peers = section.items.filter((i) => i.label !== item.label).slice(0, 3);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <div className="metrics-share-title-band">
          <PostPhotoKicker>{section.title}</PostPhotoKicker>
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

export function HeadlineTicker({ section, item }: MetricShareLayoutProps) {
  const peers = section.items.filter((i) => i.label !== item.label).slice(0, 5);
  return (
    <MetricsShareShell>
      <div className="metrics-share-ticker-layout">
        <div className="metrics-share-ticker-card post-photo-card post-photo-card--gold">
          <PostPhotoBadge text={section.badge ?? "KPI"} />
          <p className="metrics-share-glass-value">{item.value}</p>
          <p className="post-photo-card-sub">{item.label}</p>
          {item.hint ? <p className="post-photo-card-detail">{item.hint}</p> : null}
        </div>
        <div className="metrics-share-ticker-rail">
          <p className="post-photo-kicker">Rail context</p>
          {peers.map((p) => (
            <div key={p.label} className="metrics-share-ticker-row">
              <span className="metrics-share-ticker-label">{p.label}</span>
              <span className="metrics-share-ticker-val">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function MonetizationFunnel({ section, item }: MetricShareLayoutProps) {
  const steps = section.items.slice(0, 4);
  return (
    <MetricsShareShell>
      <div className="metrics-share-fill">
        <PostPhotoBadge text={section.badge ?? "x402 revenue"} />
        <PostPhotoKicker>{section.title}</PostPhotoKicker>
        <div className="metrics-share-funnel-hero">
          <p className="metrics-share-pulse-value">{item.value}</p>
          <p className="post-photo-card-sub">{item.label}</p>
        </div>
        <div className="metrics-share-funnel-steps">
          {steps.map((s, i) => (
            <div key={s.label} className="metrics-share-funnel-step" style={{ width: `${100 - i * 10}%` }}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </MetricsShareShell>
  );
}

export function MonetizationVault({ section, item }: MetricShareLayoutProps) {
  const ledger = section.items.filter((i) => i.label !== item.label).slice(0, 5);
  return (
    <MetricsShareShell>
      <div className="metrics-share-vault-split">
        <div className="metrics-share-vault-door post-photo-card post-photo-card--gold">
          <PostPhotoKicker>x402 revenue</PostPhotoKicker>
          <p className="metrics-share-glass-value">{item.value}</p>
          <p className="post-photo-card-sub">{item.label}</p>
          {item.hint ? <p className="post-photo-card-detail">{item.hint}</p> : null}
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

export function MonetizationReceipt({ section, item }: MetricShareLayoutProps) {
  const rows = section.items.slice(0, 6);
  return (
    <MetricsShareShell className="metrics-share-canvas--terminal">
      <div className="metrics-share-receipt">
        <p className="metrics-share-terminal-prompt">
          <span className="metrics-share-terminal-dollar">$</span> syra monetization export
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
        <p className="metrics-share-receipt-footer">syraa.fun/internal · {section.title}</p>
      </div>
    </MetricsShareShell>
  );
}

export const HEADLINE_ITEM_LAYOUTS = [HeadlineMonolith, HeadlineBand, HeadlineTicker] as const;
export const MONETIZATION_ITEM_LAYOUTS = [MonetizationFunnel, MonetizationVault, MonetizationReceipt] as const;
