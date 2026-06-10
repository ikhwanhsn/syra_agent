import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  PostPhotoBadge,
  PostPhotoBody,
  PostPhotoChrome,
  PostPhotoHeadline,
  PostPhotoKicker,
  PostPhotoStatGrid,
} from "@/components/post/photo/PostPhotoChrome";
import type { MetricShareChartPoint, MetricShareItem } from "@/components/info/metricsShare/types";

export function MetricsShareShell({
  children,
  className,
  light,
}: {
  children: ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <PostPhotoChrome className={cn("metrics-share-canvas", light && "metrics-share-canvas--light", className)}>
      {children}
    </PostPhotoChrome>
  );
}

export function sparkBarsFromNumeric(numeric: number | undefined, count = 14): number[] {
  const base = Math.max(numeric ?? 1, 1);
  return Array.from({ length: count }, (_, i) => {
    const wave = Math.sin(i * 0.65) * 0.22 + Math.cos(i * 0.35) * 0.12;
    const trend = (i / count) * 0.18;
    return Math.max(0.12, 0.35 + wave + trend + ((base + i * 7) % 13) / 65);
  });
}

export function maxNumeric(items: MetricShareItem[]): number {
  return Math.max(...items.map((i) => i.numeric ?? 0), 1);
}

export function ShareSparkBars({
  data,
  color = "#F3BA2F",
  height = 140,
  className,
}: {
  data: MetricShareChartPoint[] | number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const values = Array.isArray(data) && typeof data[0] === "number"
    ? (data as number[])
    : (data as MetricShareChartPoint[]).map((d) => d.value);
  const max = Math.max(...values, 1);

  return (
    <div className={cn("metrics-share-spark", className)} style={{ height }}>
      {values.map((v, i) => (
        <div key={i} className="metrics-share-spark-col">
          <div
            className="metrics-share-spark-bar"
            style={{
              height: Math.max(8, (v / max) * (height - 28)),
              background: `linear-gradient(to top, ${color}, ${color}55)`,
              boxShadow: v === max ? `0 0 18px ${color}44` : undefined,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function ShareAreaChart({
  data,
  color = "#F3BA2F",
  accent = "rgba(243,186,47,0.35)",
  label,
  height = 168,
}: {
  data: MetricShareChartPoint[];
  color?: string;
  accent?: string;
  label: string;
  height?: number;
}) {
  if (data.length < 2) {
    return <ShareSparkBars data={data.map((d) => d.value)} color={color} height={height} />;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 1000;
  const h = height;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 20 - (d.value / max) * (h - 36);
    return `${x},${y}`;
  });
  const gradId = `ms-area-${label.replace(/\W/g, "")}-${color.replace("#", "")}`;

  return (
    <div className="metrics-share-chart-block">
      {label ? <p className="post-photo-kicker">{label}</p> : null}
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="metrics-share-area-svg">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${points.join(" ")} ${w},${h}`} fill={`url(#${gradId})`} />
        <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function HorizontalRankBars({
  items,
  maxItems = 8,
  barColor = "#F3BA2F",
}: {
  items: MetricShareItem[];
  maxItems?: number;
  barColor?: string;
}) {
  const shown = items.filter((i) => i.numeric != null).slice(0, maxItems);
  const max = maxNumeric(shown);

  return (
    <div className="metrics-share-rank-list">
      {shown.map((item, i) => (
        <div key={item.label} className="metrics-share-rank-row">
          <span className="metrics-share-rank-num">{String(i + 1).padStart(2, "0")}</span>
          <div className="metrics-share-rank-body">
            <div className="metrics-share-rank-meta">
              <span className="metrics-share-rank-label">{item.label}</span>
              <span className="metrics-share-rank-value">{item.value}</span>
            </div>
            <div className="metrics-share-rank-track">
              <div
                className="metrics-share-rank-fill"
                style={{
                  width: `${((item.numeric ?? 0) / max) * 100}%`,
                  background: item.highlight
                    ? `linear-gradient(90deg, ${barColor}, ${barColor}99)`
                    : "linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.12))",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({
  section,
  badge,
}: {
  section: { title: string; subtitle?: string; badge?: string };
  badge?: string;
}) {
  return (
    <>
      <PostPhotoBadge text={badge ?? section.badge ?? "Internal"} />
      <PostPhotoKicker>{section.title}</PostPhotoKicker>
      {section.subtitle ? <PostPhotoBody className="metrics-share-sub">{section.subtitle}</PostPhotoBody> : null}
    </>
  );
}

export function StatChip({ item }: { item: MetricShareItem }) {
  return (
    <div className={cn("post-photo-metric-chip metrics-share-metric-chip", item.highlight && "metrics-share-metric-chip--gold")}>
      <span className="post-photo-stat-value metrics-share-chip-value">{item.value}</span>
      <span className="post-photo-stat-label">{item.label}</span>
    </div>
  );
}

export function FeaturedStat({ value, label }: { value: string; label: string }) {
  return <PostPhotoStatGrid stats={[{ value, label }]} featured />;
}

export { PostPhotoHeadline, PostPhotoKicker, PostPhotoBody, PostPhotoBadge, PostPhotoStatGrid };
