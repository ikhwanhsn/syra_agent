import { useCallback, useEffect, useRef } from "react";
import { RISE_UPONLY_MINT } from "@/components/rise/RiseShared";
import {
  bubbleRadiusFillScale,
  computeRadius,
  layoutTargetsSeeded,
  metricRange,
  sizeValueForMetric,
} from "./bubbleMapMath";
import type { BubbleDatum, BubbleSimNode, BubbleSizeMetric, DragEndResult } from "./bubbleMapTypes";

const FRICTION = 0.988;
const WALL_RESTITUTION = 0.82;
const COLLISION_PUSH = 0.55;
const COLLISION_IMPULSE = 0.35;
const RADIUS_LERP = 0.14;
const ALPHA_IN = 0.08;
const ALPHA_OUT = 0.12;
const MIN_R = 17;
const MAX_R = 60;
const AREA_BUDGET = Math.PI * MAX_R * MAX_R;
/** Spatial grid cell — larger than max bubble diameter for fewer cells. */
const CELL = 108;

type DragState = {
  mint: string;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  startTime: number;
  maxMove: number;
};

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

function targetRadiusFor(
  d: BubbleDatum,
  metric: BubbleSizeMetric,
  minV: number,
  maxV: number,
): number {
  const v = sizeValueForMetric(d, metric);
  return computeRadius(v, minV, maxV, MIN_R, MAX_R, AREA_BUDGET);
}

function sortDrawOrder(nodes: BubbleSimNode[]): void {
  nodes.sort((a, b) => a.r - b.r);
}

function cellKey(ix: number, iy: number): string {
  return `${ix},${iy}`;
}

function resolvePairCollisions(
  nodes: BubbleSimNode[],
  indices: readonly number[],
  dragMint: string | null,
): void {
  for (let a = 0; a < indices.length; a += 1) {
    for (let b = a + 1; b < indices.length; b += 1) {
      const ia = indices[a];
      const ib = indices[b];
      if (ia === ib) continue;
      const nodeA = nodes[ia];
      const nodeB = nodes[ib];
      if (!nodeA || !nodeB || nodeA.removing || nodeB.removing) continue;

      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const dLen = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      const minDist = nodeA.r + nodeB.r;
      const overlap = minDist - dLen;
      if (overlap <= 0) continue;

      const nx = dx / dLen;
      const ny = dy / dLen;
      const push = overlap * COLLISION_PUSH;

      const aDrag = nodeA.mint === dragMint;
      const bDrag = nodeB.mint === dragMint;

      if (aDrag && !bDrag) {
        nodeB.x += nx * push * 2;
        nodeB.y += ny * push * 2;
        nodeB.vx += nx * push * COLLISION_IMPULSE;
        nodeB.vy += ny * push * COLLISION_IMPULSE;
      } else if (bDrag && !aDrag) {
        nodeA.x -= nx * push * 2;
        nodeA.y -= ny * push * 2;
        nodeA.vx -= nx * push * COLLISION_IMPULSE;
        nodeA.vy -= ny * push * COLLISION_IMPULSE;
      } else {
        nodeA.x -= nx * push;
        nodeA.y -= ny * push;
        nodeB.x += nx * push;
        nodeB.y += ny * push;

        const rvx = nodeB.vx - nodeA.vx;
        const rvy = nodeB.vy - nodeA.vy;
        const rel = rvx * nx + rvy * ny;
        if (rel < 0) {
          const imp = -rel * COLLISION_IMPULSE;
          nodeA.vx -= imp * nx;
          nodeA.vy -= imp * ny;
          nodeB.vx += imp * nx;
          nodeB.vy += imp * ny;
        }
      }
    }
  }
}

/** Broad-phase grid: only pairs that share a cell are narrow-phase checked. */
function resolveCollisionsSpatial(nodes: BubbleSimNode[], dragMint: string | null): void {
  const grid = new Map<string, number[]>();
  for (let idx = 0; idx < nodes.length; idx += 1) {
    const n = nodes[idx];
    if (n.removing) continue;
    const pad = n.r;
    const ix0 = Math.floor((n.x - pad) / CELL);
    const ix1 = Math.floor((n.x + pad) / CELL);
    const iy0 = Math.floor((n.y - pad) / CELL);
    const iy1 = Math.floor((n.y + pad) / CELL);
    for (let ix = ix0; ix <= ix1; ix += 1) {
      for (let iy = iy0; iy <= iy1; iy += 1) {
        const k = cellKey(ix, iy);
        let bucket = grid.get(k);
        if (!bucket) {
          bucket = [];
          grid.set(k, bucket);
        }
        bucket.push(idx);
      }
    }
  }

  const seen = new Set<string>();
  for (const bucket of grid.values()) {
    if (bucket.length < 2) continue;
    const uniq = [...new Set(bucket)];
    if (uniq.length < 2) continue;
    for (let a = 0; a < uniq.length; a += 1) {
      for (let b = a + 1; b < uniq.length; b += 1) {
        const i = uniq[a];
        const j = uniq[b];
        const pairKey = i < j ? `${i},${j}` : `${j},${i}`;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        resolvePairCollisions(nodes, [i, j], dragMint);
      }
    }
  }
}

export function useBubbleSimulation(args: {
  data: readonly BubbleDatum[];
  metric: BubbleSizeMetric;
  width: number;
  height: number;
  reduceMotion: boolean;
}) {
  const { data, metric, width, height, reduceMotion } = args;
  const nodesRef = useRef<BubbleSimNode[]>([]);
  const dragRef = useRef<DragState | null>(null);

  /** Resync graph when data / metric / dimensions / motion mode change. */
  useEffect(() => {
    if (width < 32 || height < 32) return;

    const { min, max } = metricRange(data, metric);
    const prev = new Map(nodesRef.current.map((n) => [n.mint, n]));

    const fill = bubbleRadiusFillScale(data.length, width, height);
    const rCap = Math.min(width, height) * 0.135;
    const radii = data.map((d) =>
      Math.min(rCap, targetRadiusFor(d, metric, min, max) * fill),
    );
    const seeded = layoutTargetsSeeded(width, height, radii, data, metric);

    if (reduceMotion) {
      const next: BubbleSimNode[] = data.map((d, i) => {
        const tr = radii[i] ?? MIN_R;
        const old = prev.get(d.mint);
        if (old && !old.removing) {
          return {
            ...old,
            datum: d,
            targetR: tr,
            r: tr,
            vx: 0,
            vy: 0,
            isUponly: d.mint === RISE_UPONLY_MINT,
            removing: false,
          };
        }
        const p = seeded[i] ?? { x: width / 2, y: height / 2 };
        return {
          mint: d.mint,
          datum: d,
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          r: tr,
          targetR: tr,
          alpha: 1,
          removing: false,
          isUponly: d.mint === RISE_UPONLY_MINT,
        };
      });
      nodesRef.current = next;
      return;
    }

    const next: BubbleSimNode[] = [];

    for (let i = 0; i < data.length; i += 1) {
      const d = data[i];
      const tr = radii[i] ?? MIN_R;
      const old = prev.get(d.mint);
      if (old && !old.removing) {
        next.push({
          ...old,
          datum: d,
          targetR: tr,
          isUponly: d.mint === RISE_UPONLY_MINT,
          removing: false,
        });
      } else {
        const margin = Math.max(tr, 8);
        const spanX = Math.max(1, width - 2 * margin);
        const spanY = Math.max(1, height - 2 * margin);
        next.push({
          mint: d.mint,
          datum: d,
          x: margin + Math.random() * spanX,
          y: margin + Math.random() * spanY,
          vx: (Math.random() - 0.5) * 28,
          vy: (Math.random() - 0.5) * 28,
          r: tr * 0.35,
          targetR: tr,
          alpha: 0,
          removing: false,
          isUponly: d.mint === RISE_UPONLY_MINT,
        });
      }
    }

    const inNext = new Set(next.map((n) => n.mint));
    for (const old of prev.values()) {
      if (!inNext.has(old.mint)) {
        next.push({ ...old, removing: true });
      }
    }

    nodesRef.current = next;
    sortDrawOrder(nodesRef.current);
  }, [data, metric, width, height, reduceMotion]);

  const hitTest = useCallback(
    (px: number, py: number): string | null => {
      const nodes = [...nodesRef.current].sort((a, b) => b.r - a.r);
      for (const n of nodes) {
        if (n.alpha < 0.15) continue;
        if (dist(px, py, n.x, n.y) <= n.r) return n.mint;
      }
      return null;
    },
    [],
  );

  const beginDrag = useCallback(
    (px: number, py: number): boolean => {
      const id = hitTest(px, py);
      if (!id) return false;
      const n = nodesRef.current.find((x) => x.mint === id);
      if (!n) return false;
      dragRef.current = {
        mint: id,
        offsetX: n.x - px,
        offsetY: n.y - py,
        startX: px,
        startY: py,
        startTime: performance.now(),
        maxMove: 0,
      };
      n.vx = 0;
      n.vy = 0;
      return true;
    },
    [hitTest],
  );

  const drag = useCallback((px: number, py: number) => {
    const d = dragRef.current;
    if (!d) return;
    const n = nodesRef.current.find((x) => x.mint === d.mint);
    if (!n) return;
    const move = dist(px, py, d.startX, d.startY);
    d.maxMove = Math.max(d.maxMove, move);
    n.x = px + d.offsetX;
    n.y = py + d.offsetY;
    n.vx = 0;
    n.vy = 0;
  }, []);

  const endDrag = useCallback((): DragEndResult => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return { click: false, mint: null };
    const elapsed = performance.now() - d.startTime;
    const click = d.maxMove < 5 && elapsed < 320;
    return { click, mint: d.mint };
  }, []);

  const tick = useCallback(
    (dtMs: number) => {
      if (reduceMotion) return;
      const dt = Math.min(32, Math.max(8, dtMs)) / 1000;
      const nodes = nodesRef.current;
      const dragMint = dragRef.current?.mint ?? null;

      const w = width;
      const h = height;

      for (const n of nodes) {
        if (n.removing) {
          n.alpha = Math.max(0, n.alpha - ALPHA_OUT * (dt * 60));
          continue;
        }
        n.alpha = Math.min(1, n.alpha + ALPHA_IN * (dt * 60));
        n.r += (n.targetR - n.r) * RADIUS_LERP * (dt * 60);

        if (n.mint === dragMint) continue;

        n.x += n.vx * dt;
        n.y += n.vy * dt;
        const damp = Math.pow(FRICTION, dt * 60);
        n.vx *= damp;
        n.vy *= damp;

        const rr = n.r;
        if (n.x < rr) {
          n.x = rr;
          n.vx *= -WALL_RESTITUTION;
        } else if (n.x > w - rr) {
          n.x = w - rr;
          n.vx *= -WALL_RESTITUTION;
        }
        if (n.y < rr) {
          n.y = rr;
          n.vy *= -WALL_RESTITUTION;
        } else if (n.y > h - rr) {
          n.y = h - rr;
          n.vy *= -WALL_RESTITUTION;
        }
      }

      resolveCollisionsSpatial(nodes, dragMint);

      nodesRef.current = nodes.filter((n) => !(n.removing && n.alpha <= 0.01));
      sortDrawOrder(nodesRef.current);
    },
    [width, height, reduceMotion],
  );

  return { nodesRef, tick, hitTest, beginDrag, drag, endDrag };
}
