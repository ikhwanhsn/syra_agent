import type { BubbleDatum, BubbleSizeMetric, BubbleTone } from "./bubbleMapTypes";

const EPS = 1e-9;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Numeric value for sizing; null/invalid → 0. */
export function sizeValueForMetric(d: BubbleDatum, metric: BubbleSizeMetric): number {
  const v = d[metric];
  if (v === null || !Number.isFinite(v) || v < 0) return 0;
  return metric === "holders" ? v : v;
}

/** Min/max over dataset for the active metric. */
export function metricRange(rows: readonly BubbleDatum[], metric: BubbleSizeMetric): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const d of rows) {
    const v = sizeValueForMetric(d, metric);
    if (v > max) max = v;
    if (v < min) min = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  if (max - min < EPS) return { min: min - 1, max: max + 1 };
  return { min, max };
}

/**
 * Sqrt-area scaling: small tokens stay readable, whales dominate without exploding layout.
 * `areaBudget` is max circle area in px² for the largest bubble in view.
 */
export function computeRadius(
  value: number,
  minV: number,
  maxV: number,
  rMin: number,
  rMax: number,
  areaBudget: number,
): number {
  const span = maxV - minV;
  const t = span < EPS ? 0.5 : clamp((value - minV) / span, 0, 1);
  const sqrtT = Math.sqrt(t);
  const rLinear = rMin + sqrtT * (rMax - rMin);
  const rMaxByArea = Math.sqrt(Math.max(areaBudget / Math.PI, EPS));
  return clamp(rLinear, rMin, Math.min(rMax, rMaxByArea));
}

/**
 * Extra scale so bubble sizes track map area (~N overlapping circles filling the view).
 */
export function bubbleRadiusFillScale(nodeCount: number, vw: number, vh: number): number {
  if (nodeCount <= 0 || vw < 32 || vh < 32) return 1;
  const canvasArea = vw * vh;
  const overlapFactor = 2.05;
  const rEffective = Math.sqrt((overlapFactor * canvasArea) / (nodeCount * Math.PI));
  const baseline = 24;
  return clamp(rEffective / baseline, 1.18, 2.2);
}

export function toneFromChange(pct: number | null): BubbleTone {
  if (pct === null || !Number.isFinite(pct)) return "neutral";
  if (pct > 0.01) return "up";
  if (pct < -0.01) return "down";
  return "neutral";
}

/** HSL strings for canvas fills (tone + optional intensity 0–1). */
export function hslFromTone(
  tone: BubbleTone,
  intensity: number,
): { fill: string; fillEdge: string; glow: string; stroke: string } {
  const i = clamp(intensity, 0.35, 1);
  if (tone === "up") {
    return {
      fill: `hsl(152 55% ${42 + 8 * (1 - i)}% / 0.92)`,
      fillEdge: `hsl(152 48% 28% / 0.55)`,
      glow: `hsl(152 60% 45% / ${0.22 + 0.15 * i})`,
      stroke: `hsl(152 50% 55% / 0.75)`,
    };
  }
  if (tone === "down") {
    return {
      fill: `hsl(0 58% ${48 + 6 * (1 - i)}% / 0.9)`,
      fillEdge: `hsl(0 50% 26% / 0.52)`,
      glow: `hsl(0 65% 50% / ${0.2 + 0.14 * i})`,
      stroke: `hsl(0 55% 58% / 0.72)`,
    };
  }
  return {
    fill: `hsl(220 14% ${58 + 10 * (1 - i)}% / 0.88)`,
    fillEdge: `hsl(220 16% 22% / 0.5)`,
    glow: `hsl(220 20% 50% / ${0.12 + 0.1 * i})`,
    stroke: `hsl(220 12% 45% / 0.55)`,
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomPointInMargin(
  width: number,
  height: number,
  rr: number,
  next: () => number,
): { x: number; y: number } {
  const margin = Math.max(rr, 8);
  const spanX = Math.max(1, width - 2 * margin);
  const spanY = Math.max(1, height - 2 * margin);
  return {
    x: margin + next() * spanX,
    y: margin + next() * spanY,
  };
}

/**
 * Random-looking (x,y) per bubble, stable for the same mints + metric + canvas size (reduced-motion).
 */
export function layoutTargetsSeeded(
  width: number,
  height: number,
  radii: readonly number[],
  data: readonly Pick<BubbleDatum, "mint">[],
  metric: BubbleSizeMetric,
): { x: number; y: number }[] {
  const n = radii.length;
  if (n === 0 || width < 1 || height < 1) return [];
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i += 1) {
    const rr = radii[i] ?? 20;
    const mint = data[i]?.mint ?? `${i}`;
    const seed = hashSeed(`${mint}|${metric}|${width}x${height}`);
    const next = mulberry32(seed ^ (i * 2654435761));
    out.push(randomPointInMargin(width, height, rr, next));
  }
  return out;
}
