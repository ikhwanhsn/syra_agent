import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPctSigned } from "@/lib/marketDisplayFormat";
import { formatPriceSmart } from "@/components/rise/RiseShared";
import { hslFromTone, toneFromChange } from "./bubbleMapMath";
import type { BubbleSimNode } from "./bubbleMapTypes";
import type { DragEndResult } from "./bubbleMapTypes";

const imageCache = new Map<string, HTMLImageElement | "loading">();
/** Redraw callbacks waiting on the same URL while one `Image` is in flight. */
const pendingRedraws = new Map<string, Set<() => void>>();
const IMAGE_LOAD_TIMEOUT_MS = 14_000;

function queueRedrawForUrl(urlKey: string, onRedraw: () => void): void {
  let bag = pendingRedraws.get(urlKey);
  if (!bag) {
    bag = new Set();
    pendingRedraws.set(urlKey, bag);
  }
  bag.add(onRedraw);
}

function flushRedrawsForUrl(urlKey: string): void {
  const bag = pendingRedraws.get(urlKey);
  pendingRedraws.delete(urlKey);
  if (!bag) return;
  for (const cb of bag) {
    try {
      cb();
    } catch {
      /* ignore */
    }
  }
}

function isCanvasImageReady(img: HTMLImageElement, src: string): boolean {
  if (!img.complete) return false;
  if (img.naturalWidth > 0 && img.naturalHeight > 0) return true;
  const s = src.toLowerCase();
  return s.includes("svg") || s.startsWith("data:image/svg");
}

const MAX_ZOOM = 4.25;
const FIT_PADDING = 32;
const WHEEL_SENS = 0.0011;
/** One step for +/- zoom buttons (center pivot). */
const BUTTON_ZOOM_STEP = 1.16;
/** Lower bound when there are no nodes (avoids degenerate scale). */
const ABS_MIN_SCALE = 0.12;

type View2D = { scale: number; tx: number; ty: number };

type WorldBBox = { minX: number; minY: number; maxX: number; maxY: number };

function bubbleWorldBounds(nodes: readonly BubbleSimNode[], pad: number): WorldBBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    if (n.removing && n.alpha < 0.2) continue;
    minX = Math.min(minX, n.x - n.r);
    minY = Math.min(minY, n.y - n.r);
    maxX = Math.max(maxX, n.x + n.r);
    maxY = Math.max(maxY, n.y + n.r);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
}

/** Max zoom-out = content must stay inside the canvas; pan is clamped to the same bounds. */
function clampViewToBubbleBounds(v: View2D, vw: number, vh: number, bb: WorldBBox | null): View2D {
  if (vw < 8 || vh < 8) return v;
  if (!bb) {
    return {
      scale: Math.min(MAX_ZOOM, Math.max(ABS_MIN_SCALE, v.scale)),
      tx: v.tx,
      ty: v.ty,
    };
  }
  const bw = Math.max(bb.maxX - bb.minX, 1e-3);
  const bh = Math.max(bb.maxY - bb.minY, 1e-3);
  const sFloor = Math.min(vw / bw, vh / bh);
  const scale = Math.min(MAX_ZOOM, Math.max(v.scale, sFloor));

  const txMin = -scale * bb.minX;
  const txMax = vw - scale * bb.maxX;
  const tyMin = -scale * bb.minY;
  const tyMax = vh - scale * bb.maxY;

  let tx = v.tx;
  let ty = v.ty;
  if (txMin > txMax) {
    const cx = (bb.minX + bb.maxX) / 2;
    tx = vw / 2 - scale * cx;
  } else {
    tx = Math.min(txMax, Math.max(txMin, tx));
  }
  if (tyMin > tyMax) {
    const cy = (bb.minY + bb.maxY) / 2;
    ty = vh / 2 - scale * cy;
  } else {
    ty = Math.min(tyMax, Math.max(tyMin, ty));
  }
  return { scale, tx, ty };
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

function fitViewToNodes(nodes: readonly BubbleSimNode[], vw: number, vh: number, pad: number): View2D {
  if (nodes.length === 0 || vw < 8 || vh < 8) return { scale: 1, tx: 0, ty: 0 };
  const bb = bubbleWorldBounds(nodes, pad);
  if (!bb) return { scale: 1, tx: 0, ty: 0 };
  const bw = Math.max(bb.maxX - bb.minX, 1e-6);
  const bh = Math.max(bb.maxY - bb.minY, 1e-6);
  const s = Math.min(MAX_ZOOM, Math.min(vw / bw, vh / bh));
  const cx = (bb.minX + bb.maxX) / 2;
  const cy = (bb.minY + bb.maxY) / 2;
  return clampViewToBubbleBounds({ scale: s, tx: vw / 2 - s * cx, ty: vh / 2 - s * cy }, vw, vh, bb);
}

function screenToWorld(lx: number, ly: number, v: View2D): { x: number; y: number } {
  return { x: (lx - v.tx) / v.scale, y: (ly - v.ty) / v.scale };
}

function zoomAtScreen(
  lx: number,
  ly: number,
  v: View2D,
  factor: number,
  nodes: readonly BubbleSimNode[],
  vw: number,
  vh: number,
): View2D {
  const wx = (lx - v.tx) / v.scale;
  const wy = (ly - v.ty) / v.scale;
  const ns = Math.min(MAX_ZOOM, Math.max(ABS_MIN_SCALE, v.scale * factor));
  const next = { scale: ns, tx: lx - wx * ns, ty: ly - wy * ns };
  return clampViewToBubbleBounds(next, vw, vh, bubbleWorldBounds(nodes, FIT_PADDING));
}

/** Canvas cannot use CSS `var()` in color strings — resolve shadcn HSL channels from :root. */
function hslFromRootVar(varName: string, alpha?: number): string {
  if (typeof document === "undefined") {
    return alpha !== undefined ? `hsl(220 14% 50% / ${alpha})` : "hsl(220 14% 50%)";
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const channels = raw.length > 0 ? raw : "0 0% 50%";
  return alpha !== undefined ? `hsl(${channels} / ${alpha})` : `hsl(${channels})`;
}

function readThemeSnapshot(): {
  card: string;
  background: string;
  foreground06: string;
  uof55: string;
  uof45: string;
  foreground95: string;
  muted: string;
} {
  return {
    card: hslFromRootVar("--card", 0.35),
    background: hslFromRootVar("--background", 0.92),
    foreground06: hslFromRootVar("--foreground", 0.06),
    uof55: hslFromRootVar("--uof", 0.55),
    uof45: hslFromRootVar("--uof", 0.45),
    foreground95: hslFromRootVar("--foreground", 0.95),
    muted: hslFromRootVar("--muted-foreground"),
  };
}

function loadTokenImage(url: string | null | undefined, onRedraw: () => void): void {
  if (!url || typeof url !== "string" || !url.trim()) return;
  const u = url.trim();
  const cached = imageCache.get(u);
  if (cached instanceof HTMLImageElement) {
    onRedraw();
    return;
  }
  if (cached === "loading") {
    queueRedrawForUrl(u, onRedraw);
    return;
  }

  queueRedrawForUrl(u, onRedraw);
  imageCache.set(u, "loading");

  const img = new Image();
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(safetyTimer);
    flushRedrawsForUrl(u);
  };

  const safetyTimer = window.setTimeout(() => {
    if (imageCache.get(u) !== "loading") return;
    imageCache.delete(u);
    finish();
  }, IMAGE_LOAD_TIMEOUT_MS);

  /** Do not set `crossOrigin`: many token CDNs omit CORS; anonymous mode fails load and hides logos. */
  img.onload = () => {
    if (settled) return;
    const commit = () => {
      imageCache.set(u, img);
      finish();
    };
    if (typeof img.decode === "function") {
      void img.decode().then(commit).catch(commit);
    } else {
      commit();
    }
  };
  img.onerror = () => {
    if (settled) return;
    imageCache.delete(u);
    finish();
  };
  img.src = u;
}

function paintBackgroundToCtx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: ReturnType<typeof readThemeSnapshot>,
): void {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.15, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  g.addColorStop(0, theme.card);
  g.addColorStop(1, theme.background);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = theme.foreground06;
  ctx.lineWidth = 1;
  const step = Math.max(40, Math.round(Math.min(w, h) / 14));
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const v = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.65);
  v.addColorStop(0, "transparent");
  v.addColorStop(1, "hsl(0 0% 0% / 0.38)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  n: BubbleSimNode,
  dragMint: string | null,
  hoverMint: string | null,
  theme: ReturnType<typeof readThemeSnapshot>,
): void {
  const tone = toneFromChange(n.datum.priceChange24hPct);
  const intensity = Math.min(1, n.r / 56);
  const colors = hslFromTone(tone, intensity);
  const isHot = n.mint === hoverMint || n.mint === dragMint;

  ctx.save();
  ctx.globalAlpha *= n.alpha;

  const rg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
  rg.addColorStop(0, colors.fill);
  rg.addColorStop(1, colors.fillEdge);
  ctx.beginPath();
  ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
  ctx.fillStyle = rg;
  ctx.fill();

  if (isHot) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r + 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const url = n.datum.imageUrl;
  const u = url?.trim() ?? "";
  const img = u ? imageCache.get(u) : undefined;
  if (u && img instanceof HTMLImageElement && isCanvasImageReady(img, u)) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r * 0.88, 0, Math.PI * 2);
    ctx.clip();
    const ir = n.r * 1.76;
    ctx.drawImage(img, n.x - ir / 2, n.y - ir / 2, ir, ir);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
  ctx.strokeStyle = isHot ? theme.uof55 : colors.stroke;
  ctx.lineWidth = n.isUponly ? 2.25 : isHot ? 2 : 1;
  ctx.stroke();

  if (n.isUponly) {
    ctx.strokeStyle = theme.uof45;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  const sym = n.datum.symbol ? `$${n.datum.symbol}` : "—";
  const fontPx = Math.max(9, Math.min(15, n.r * 0.38));
  ctx.font = `600 ${fontPx}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.foreground95;
  ctx.strokeStyle = "hsl(0 0% 0% / 0.45)";
  ctx.lineWidth = 3;
  ctx.strokeText(sym, n.x, n.y - fontPx * 0.35);
  ctx.fillText(sym, n.x, n.y - fontPx * 0.35);

  const chg = formatPctSigned(n.datum.priceChange24hPct);
  const subPx = Math.max(8, fontPx * 0.72);
  ctx.font = `500 ${subPx}px ui-monospace, monospace`;
  const subColor =
    tone === "up" ? "hsl(152 70% 42%)" : tone === "down" ? "hsl(0 75% 58%)" : theme.muted;
  ctx.fillStyle = subColor;
  ctx.strokeStyle = "hsl(0 0% 0% / 0.4)";
  ctx.lineWidth = 2;
  const subY = n.y + n.r * 0.38;
  ctx.strokeText(chg, n.x, subY);
  ctx.fillText(chg, n.x, subY);

  ctx.restore();
}

function effectiveDpr(): number {
  const raw = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches) {
    return Math.min(1.5, raw);
  }
  return Math.min(2, raw);
}

type PinchRef = {
  dist0: number;
  scale0: number;
  wx: number;
  wy: number;
};

type PanRef = { startLX: number; startLY: number; startTx: number; startTy: number };

export type BubbleCanvasProps = {
  width: number;
  height: number;
  nodesRef: React.MutableRefObject<BubbleSimNode[]>;
  tick: (dtMs: number) => void;
  reduceMotion: boolean;
  beginDrag: (x: number, y: number) => boolean;
  drag: (x: number, y: number) => void;
  endDrag: () => DragEndResult;
  hitTest: (x: number, y: number) => string | null;
  onBubbleClick: (mint: string) => void;
  a11yRows: readonly { mint: string; symbol: string; name: string }[];
  a11yListAriaLabel: string;
  a11yPickLabel: (symbol: string, name: string) => string;
  onA11yPick: (mint: string) => void;
  preloadMintsKey: string;
  /** When this string changes (e.g. mint set), camera refits to bounds. */
  fitKey: string;
  zoomInAria: string;
  zoomOutAria: string;
};

export function BubbleCanvas({
  width,
  height,
  nodesRef,
  tick,
  reduceMotion,
  beginDrag,
  drag,
  endDrag,
  hitTest,
  onBubbleClick,
  a11yRows,
  a11yListAriaLabel,
  a11yPickLabel,
  onA11yPick,
  preloadMintsKey,
  fitKey,
  zoomInAria,
  zoomOutAria,
}: BubbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTRef = useRef<number>(0);
  const draggingRef = useRef(false);
  const dragMintRef = useRef<string | null>(null);
  const hoverMintRef = useRef<string | null>(null);
  const viewRef = useRef<View2D>({ scale: 1, tx: 0, ty: 0 });
  const panRef = useRef<PanRef | null>(null);
  const pinchRef = useRef<PinchRef | null>(null);
  const pointersRef = useRef(new Map<number, { lx: number; ly: number }>());
  const lastFitSigRef = useRef<string>("");
  const tooltipRafRef = useRef(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);
  const [interaction, setInteraction] = useState<"idle" | "pan" | "bubble" | "pinch">("idle");
  const prefersFinePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  const bgCacheRef = useRef<{ w: number; h: number; themeKey: string; canvas: HTMLCanvasElement } | null>(null);
  const drawRef = useRef<(() => void) | null>(null);

  const getOrCreateBg = useCallback((w: number, h: number) => {
    const themeKey =
      typeof document !== "undefined" && document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    let entry = bgCacheRef.current;
    if (entry && entry.w === w && entry.h === h && entry.themeKey === themeKey) return entry.canvas;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.floor(w));
    c.height = Math.max(1, Math.floor(h));
    const octx = c.getContext("2d");
    if (octx) {
      const theme = readThemeSnapshot();
      paintBackgroundToCtx(octx, w, h, theme);
    }
    entry = { w, h, themeKey, canvas: c };
    bgCacheRef.current = entry;
    return c;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const w = width;
    const h = height;
    if (w < 8 || h < 8) return;

    viewRef.current = clampViewToBubbleBounds(
      viewRef.current,
      w,
      h,
      bubbleWorldBounds(nodesRef.current, FIT_PADDING),
    );

    const dpr = effectiveDpr();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const v = viewRef.current;
    ctx.save();
    ctx.translate(v.tx, v.ty);
    ctx.scale(v.scale, v.scale);

    const bg = getOrCreateBg(w, h);
    ctx.drawImage(bg, 0, 0, w, h);

    const theme = readThemeSnapshot();
    const nodes = nodesRef.current;
    const dragId = draggingRef.current ? dragMintRef.current : null;
    const hoverId = hoverMintRef.current;
    const sorted = [...nodes].sort((a, b) => a.r - b.r);
    for (const n of sorted) {
      drawBubble(ctx, n, dragId, hoverId, theme);
    }
    ctx.restore();
  }, [width, height, nodesRef, getOrCreateBg]);

  drawRef.current = draw;

  /** Refit camera when metric/data/dim change. Deferred so parent simulation can fill `nodesRef` first (child effects run before parent). */
  useEffect(() => {
    if (width < 32 || height < 32) return;
    const sig = `${fitKey}|${width}x${height}`;
    if (lastFitSigRef.current === sig) return;

    let cancelled = false;
    let raf = 0;
    const apply = () => {
      if (cancelled) return;
      const nodes = nodesRef.current;
      if (nodes.length === 0) return;
      viewRef.current = fitViewToNodes(nodes, width, height, FIT_PADDING);
      lastFitSigRef.current = sig;
    };

    queueMicrotask(() => {
      if (cancelled) return;
      raf = requestAnimationFrame(apply);
    });
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fitKey, width, height, nodesRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = width;
    const h = height;
    if (w < 8 || h < 8) return;
    const dpr = effectiveDpr();
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    bgCacheRef.current = null;
    draw();
  }, [width, height, draw]);

  useEffect(() => {
    const notify = () => {
      drawRef.current?.();
    };
    for (const n of nodesRef.current) {
      loadTokenImage(n.datum.imageUrl, notify);
    }
  }, [nodesRef, draw, preloadMintsKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const lx = ((e.clientX - rect.left) / rect.width) * width;
      const ly = ((e.clientY - rect.top) / rect.height) * height;
      const factor = Math.exp(-e.deltaY * WHEEL_SENS);
      viewRef.current = zoomAtScreen(lx, ly, viewRef.current, factor, nodesRef.current, width, height);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [width, height, nodesRef]);

  useEffect(() => {
    return () => {
      if (tooltipRafRef.current) cancelAnimationFrame(tooltipRafRef.current);
    };
  }, []);

  useEffect(() => {
    lastTRef.current = performance.now();
    const loop = (t: number) => {
      if (document.visibilityState === "hidden") {
        lastTRef.current = t;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(48, t - lastTRef.current);
      lastTRef.current = t;
      if (!reduceMotion) tick(dt);
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick, draw, reduceMotion]);

  const clientToLocal = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = rect.width > 0 ? ((clientX - rect.left) / rect.width) * width : 0;
    const y = rect.height > 0 ? ((clientY - rect.top) / rect.height) * height : 0;
    return { x, y };
  }, [width, height]);

  const updatePinchFromPointers = () => {
    const m = pointersRef.current;
    if (m.size < 2) {
      pinchRef.current = null;
      return;
    }
    const pts = [...m.values()];
    const p0 = pts[0];
    const p1 = pts[1];
    if (!p0 || !p1) return;
    const d = dist(p0.lx, p0.ly, p1.lx, p1.ly);
    if (d < 1e-6) return;
    const mx = (p0.lx + p1.lx) / 2;
    const my = (p0.ly + p1.ly) / 2;
    const p = pinchRef.current;
    if (!p) return;
    const ns = Math.min(MAX_ZOOM, Math.max(ABS_MIN_SCALE, p.scale0 * (d / p.dist0)));
    const next = { scale: ns, tx: mx - p.wx * ns, ty: my - p.wy * ns };
    viewRef.current = clampViewToBubbleBounds(next, width, height, bubbleWorldBounds(nodesRef.current, FIT_PADDING));
  };

  const scheduleTooltip = (clientX: number, clientY: number) => {
    if (!prefersFinePointer) {
      if (tooltipRafRef.current) {
        cancelAnimationFrame(tooltipRafRef.current);
        tooltipRafRef.current = 0;
      }
      setTooltip(null);
      return;
    }
    if (tooltipRafRef.current) cancelAnimationFrame(tooltipRafRef.current);
    tooltipRafRef.current = requestAnimationFrame(() => {
      tooltipRafRef.current = 0;
      const id = hoverMintRef.current;
      if (!id) {
        setTooltip(null);
        return;
      }
      const n = nodesRef.current.find((node) => node.mint === id);
      const label = n
        ? `${n.datum.symbol ? `$${n.datum.symbol}` : "—"} · ${formatPriceSmart(n.datum.priceUsd)}`
        : "";
      setTooltip({ x: clientX, y: clientY, label });
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: lx, y: ly } = clientToLocal(e.clientX, e.clientY);
    pointersRef.current.set(e.pointerId, { lx, ly });

    if (pointersRef.current.size >= 2) {
      panRef.current = null;
      const pts = [...pointersRef.current.values()];
      const p0 = pts[0];
      const p1 = pts[1];
      if (p0 && p1) {
        const d0 = dist(p0.lx, p0.ly, p1.lx, p1.ly);
        const mx0 = (p0.lx + p1.lx) / 2;
        const my0 = (p0.ly + p1.ly) / 2;
        const v = viewRef.current;
        const wx = (mx0 - v.tx) / v.scale;
        const wy = (my0 - v.ty) / v.scale;
        pinchRef.current = { dist0: Math.max(d0, 1e-6), scale0: v.scale, wx, wy };
      }
      setInteraction("pinch");
      return;
    }

    const world = screenToWorld(lx, ly, viewRef.current);
    const id = hitTest(world.x, world.y);
    if (id && beginDrag(world.x, world.y)) {
      draggingRef.current = true;
      dragMintRef.current = id;
      panRef.current = null;
      setInteraction("bubble");
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    panRef.current = { startLX: lx, startLY: ly, startTx: viewRef.current.tx, startTy: viewRef.current.ty };
    setInteraction("pan");
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: lx, y: ly } = clientToLocal(e.clientX, e.clientY);
    const pt = pointersRef.current.get(e.pointerId);
    if (pt) {
      pt.lx = lx;
      pt.ly = ly;
    }

    if (pointersRef.current.size >= 2) {
      if (!pinchRef.current) {
        const pts = [...pointersRef.current.values()];
        const p0 = pts[0];
        const p1 = pts[1];
        if (p0 && p1) {
          const d0 = dist(p0.lx, p0.ly, p1.lx, p1.ly);
          const mx0 = (p0.lx + p1.lx) / 2;
          const my0 = (p0.ly + p1.ly) / 2;
          const v = viewRef.current;
          const wx = (mx0 - v.tx) / v.scale;
          const wy = (my0 - v.ty) / v.scale;
          pinchRef.current = { dist0: Math.max(d0, 1e-6), scale0: v.scale, wx, wy };
        }
      } else {
        updatePinchFromPointers();
      }
      setInteraction("pinch");
      setTooltip(null);
      return;
    }

    if (draggingRef.current) {
      const w = screenToWorld(lx, ly, viewRef.current);
      drag(w.x, w.y);
      setTooltip(null);
      return;
    }

    if (panRef.current) {
      const p = panRef.current;
      viewRef.current = clampViewToBubbleBounds(
        {
          scale: viewRef.current.scale,
          tx: p.startTx + (lx - p.startLX),
          ty: p.startTy + (ly - p.startLY),
        },
        width,
        height,
        bubbleWorldBounds(nodesRef.current, FIT_PADDING),
      );
      hoverMintRef.current = null;
      setTooltip(null);
      return;
    }

    const world = screenToWorld(lx, ly, viewRef.current);
    const id = hitTest(world.x, world.y);
    hoverMintRef.current = id;
    if (!id) {
      if (tooltipRafRef.current) {
        cancelAnimationFrame(tooltipRafRef.current);
        tooltipRafRef.current = 0;
      }
      setTooltip(null);
      return;
    }
    scheduleTooltip(e.clientX, e.clientY);
  };

  const onPointerLeave = () => {
    if (!draggingRef.current && pointersRef.current.size === 0) {
      hoverMintRef.current = null;
      setInteraction("idle");
      if (tooltipRafRef.current) {
        cancelAnimationFrame(tooltipRafRef.current);
        tooltipRafRef.current = 0;
      }
      setTooltip(null);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (
      pointersRef.current.size > 0 &&
      !pinchRef.current &&
      !draggingRef.current &&
      !panRef.current
    ) {
      setInteraction("idle");
    }

    if (draggingRef.current) {
      draggingRef.current = false;
      dragMintRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const { click, mint } = endDrag();
      if (click && mint) onBubbleClick(mint);
    } else {
      panRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (pointersRef.current.size === 0) setInteraction("idle");
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    draggingRef.current = false;
    dragMintRef.current = null;
    panRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    endDrag();
    if (pointersRef.current.size === 0) setInteraction("idle");
  };

  const cursorClass =
    interaction === "idle"
      ? "cursor-grab"
      : interaction === "pan"
        ? "cursor-move"
        : "cursor-grabbing";

  const applyZoomStep = useCallback(
    (factor: number) => {
      if (width < 8 || height < 8) return;
      const lx = width / 2;
      const ly = height / 2;
      viewRef.current = zoomAtScreen(lx, ly, viewRef.current, factor, nodesRef.current, width, height);
      draw();
    },
    [width, height, nodesRef, draw],
  );

  return (
    <div className="relative h-full min-h-0 w-full min-w-0">
      <canvas
        ref={canvasRef}
        className={`block h-full min-h-[180px] w-full min-w-0 touch-none md:min-h-[220px] ${cursorClass}`}
        aria-label="RISE markets bubble map"
        role="img"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
      <div className="pointer-events-auto absolute bottom-2 right-2 z-[5] flex flex-col gap-1 sm:bottom-3 sm:right-3">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-9 w-9 rounded-lg border border-border/60 bg-background/90 shadow-md backdrop-blur-sm hover:bg-background"
          aria-label={zoomInAria}
          onClick={() => applyZoomStep(BUTTON_ZOOM_STEP)}
        >
          <ZoomIn className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-9 w-9 rounded-lg border border-border/60 bg-background/90 shadow-md backdrop-blur-sm hover:bg-background"
          aria-label={zoomOutAria}
          onClick={() => applyZoomStep(1 / BUTTON_ZOOM_STEP)}
        >
          <ZoomOut className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {tooltip && prefersFinePointer ? (
        <div
          className="pointer-events-none fixed z-[10002] max-w-[14rem] rounded-lg border border-border/60 bg-background/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          {tooltip.label}
        </div>
      ) : null}

      <div className="sr-only" role="list" aria-label={a11yListAriaLabel}>
        {a11yRows.map((row) => (
          <button
            key={row.mint}
            type="button"
            role="listitem"
            className="sr-only"
            onClick={() => onA11yPick(row.mint)}
          >
            {a11yPickLabel(row.symbol, row.name)}
          </button>
        ))}
      </div>
    </div>
  );
}
