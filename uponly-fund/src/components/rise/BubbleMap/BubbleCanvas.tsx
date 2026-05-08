import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { formatPctSigned } from "@/lib/marketDisplayFormat";
import { formatPriceSmart } from "@/components/rise/RiseShared";
import { hslFromTone, toneFromChange } from "./bubbleMapMath";
import type { BubbleSimNode, BubbleTone, WorldBBox } from "./bubbleMapTypes";
import type { DragEndResult } from "./bubbleMapTypes";

const imageCache = new Map<string, HTMLImageElement | "loading">();
/** Export-only CORS-safe image cache. Null means not exportable under current CORS policy. */
const exportImageCache = new Map<string, Promise<HTMLImageElement | null>>();
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

/** Tween thresholds for idle frame-rate reduction. */
const IDLE_KE_THRESHOLD = 4; // px^2/s^2 squared velocity per node
const IDLE_FRAMES_TO_DROP = 30;
const IDLE_FRAME_INTERVAL = 4; // every 4th RAF -> ~15fps repaint when idle

type View2D = { scale: number; tx: number; ty: number };

/** Module-cached gradient color stops keyed by tone + intensity bucket — saves ~24k allocations/sec at 60fps × 100 bubbles. */
type GradientColors = ReturnType<typeof hslFromTone>;
const gradientColorCache = new Map<string, GradientColors>();
function getCachedGradientColors(tone: BubbleTone, intensity: number): GradientColors {
  const bucket = Math.min(7, Math.max(0, Math.round(intensity * 7)));
  const key = `${tone}_${bucket}`;
  let cached = gradientColorCache.get(key);
  if (!cached) {
    cached = hslFromTone(tone, bucket / 7);
    gradientColorCache.set(key, cached);
  }
  return cached;
}

/** Module-cached subColor strings used per-bubble (depends only on tone + cached muted hsl). */
const SUB_COLOR_UP = "hsl(152 70% 42%)";
const SUB_COLOR_DOWN = "hsl(0 75% 58%)";

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

function fitViewToNodes(bb: WorldBBox | null, vw: number, vh: number): View2D {
  if (!bb || vw < 8 || vh < 8) return { scale: 1, tx: 0, ty: 0 };
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
  bb: WorldBBox | null,
  vw: number,
  vh: number,
): View2D {
  const wx = (lx - v.tx) / v.scale;
  const wy = (ly - v.ty) / v.scale;
  const ns = Math.min(MAX_ZOOM, Math.max(ABS_MIN_SCALE, v.scale * factor));
  const next = { scale: ns, tx: lx - wx * ns, ty: ly - wy * ns };
  return clampViewToBubbleBounds(next, vw, vh, bb);
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

type ThemeSnapshot = {
  card: string;
  background: string;
  foreground06: string;
  uof55: string;
  uof45: string;
  foreground95: string;
  muted: string;
};

function readThemeSnapshot(): ThemeSnapshot {
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

async function loadExportSafeImage(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  const u = url.trim();
  const cached = exportImageCache.get(u);
  if (cached) return await cached;
  const task = (async (): Promise<HTMLImageElement | null> => {
    try {
      const res = await fetch(u, { mode: "cors" });
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob || blob.size <= 0) return null;
      const objUrl = URL.createObjectURL(blob);
      try {
        const img = new Image();
        const loaded = await new Promise<HTMLImageElement | null>((resolve) => {
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = objUrl;
        });
        if (!loaded) return null;
        if (typeof loaded.decode === "function") {
          try {
            await loaded.decode();
          } catch {
            // Decoding failures still often render fine.
          }
        }
        return loaded;
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    } catch {
      return null;
    }
  })();
  exportImageCache.set(u, task);
  return await task;
}

function paintBackgroundToCtx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: ThemeSnapshot,
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
  theme: ThemeSnapshot,
  drawImages: boolean,
  safeImageOverride?: HTMLImageElement | null,
): void {
  const tone = toneFromChange(n.datum.priceChange24hPct);
  const intensity = Math.min(1, n.r / 56);
  const colors = getCachedGradientColors(tone, intensity);
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

  if (drawImages) {
    const url = n.datum.imageUrl;
    const u = url?.trim() ?? "";
    const img = safeImageOverride ?? (u ? imageCache.get(u) : undefined);
    const imageReady =
      img instanceof HTMLImageElement &&
      (safeImageOverride ? img.naturalWidth > 0 && img.naturalHeight > 0 : isCanvasImageReady(img, u));
    if (imageReady && img instanceof HTMLImageElement) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 0.88, 0, Math.PI * 2);
      ctx.clip();
      const ir = n.r * 1.76;
      ctx.drawImage(img, n.x - ir / 2, n.y - ir / 2, ir, ir);
      ctx.restore();
    }
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
  const subColor = tone === "up" ? SUB_COLOR_UP : tone === "down" ? SUB_COLOR_DOWN : theme.muted;
  ctx.fillStyle = subColor;
  ctx.strokeStyle = "hsl(0 0% 0% / 0.4)";
  ctx.lineWidth = 2;
  const subY = n.y + n.r * 0.38;
  ctx.strokeText(chg, n.x, subY);
  ctx.fillText(chg, n.x, subY);

  ctx.restore();
}

/** Cached devicePixelRatio with a one-time matchMedia listener for both DPR and viewport-class changes. */
let cachedDpr: number | null = null;
let dprListenerAttached = false;
function getCachedDpr(): number {
  if (cachedDpr !== null) return cachedDpr;
  if (typeof window === "undefined") return 1;
  const raw = window.devicePixelRatio || 1;
  const isMobileViewport = window.matchMedia("(max-width: 640px)").matches;
  cachedDpr = isMobileViewport ? Math.min(1.5, raw) : Math.min(2, raw);
  if (!dprListenerAttached) {
    const reset = () => {
      cachedDpr = null;
    };
    window.addEventListener("resize", reset, { passive: true });
    try {
      window.matchMedia("(max-width: 640px)").addEventListener("change", reset);
    } catch {
      /* legacy Safari */
    }
    dprListenerAttached = true;
  }
  return cachedDpr;
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
  boundsRef: React.MutableRefObject<WorldBBox | null>;
  tick: (dtMs: number) => number;
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
  /** Registers a snapshot exporter from the current viewport. */
  onExportSnapshotReady?: (exporter: (() => Promise<Blob>) | null) => void;
};

export function BubbleCanvas({
  width,
  height,
  nodesRef,
  boundsRef,
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
  onExportSnapshotReady,
}: BubbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
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
  const themeRef = useRef<ThemeSnapshot | null>(null);
  const visibleRef = useRef(true);
  const idleFramesRef = useRef(0);
  const idleSkipCounterRef = useRef(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);
  const [interaction, setInteraction] = useState<"idle" | "pan" | "bubble" | "pinch">("idle");
  const prefersFinePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
  const { resolvedTheme } = useTheme();

  const bgCacheRef = useRef<{ w: number; h: number; themeKey: string; canvas: HTMLCanvasElement } | null>(null);
  const drawRef = useRef<(() => void) | null>(null);

  /** Theme snapshot is read once per theme change (otherwise getComputedStyle would force layout per frame). */
  useEffect(() => {
    themeRef.current = readThemeSnapshot();
    bgCacheRef.current = null;
    drawRef.current?.();
  }, [resolvedTheme]);

  const getOrCreateBg = useCallback((w: number, h: number) => {
    const themeKey = resolvedTheme === "light" ? "light" : "dark";
    let entry = bgCacheRef.current;
    if (entry && entry.w === w && entry.h === h && entry.themeKey === themeKey) return entry.canvas;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.floor(w));
    c.height = Math.max(1, Math.floor(h));
    const octx = c.getContext("2d");
    if (octx) {
      const theme = themeRef.current ?? readThemeSnapshot();
      paintBackgroundToCtx(octx, w, h, theme);
    }
    entry = { w, h, themeKey, canvas: c };
    bgCacheRef.current = entry;
    return c;
  }, [resolvedTheme]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const w = width;
    const h = height;
    if (w < 8 || h < 8) return;

    viewRef.current = clampViewToBubbleBounds(viewRef.current, w, h, boundsRef.current);

    const dpr = getCachedDpr();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const v = viewRef.current;
    ctx.save();
    ctx.translate(v.tx, v.ty);
    ctx.scale(v.scale, v.scale);

    const bg = getOrCreateBg(w, h);
    ctx.drawImage(bg, 0, 0, w, h);

    const theme = themeRef.current ?? readThemeSnapshot();
    const nodes = nodesRef.current;
    const dragId = draggingRef.current ? dragMintRef.current : null;
    const hoverId = hoverMintRef.current;
    /** `nodesRef.current` is kept ascending-by-r by `useBubbleSimulation.tick`, so iterate directly. */
    for (let i = 0; i < nodes.length; i += 1) {
      drawBubble(ctx, nodes[i], dragId, hoverId, theme, true);
    }
    ctx.restore();
  }, [width, height, nodesRef, boundsRef, getOrCreateBg]);

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
      viewRef.current = fitViewToNodes(boundsRef.current, width, height);
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
  }, [fitKey, width, height, nodesRef, boundsRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = width;
    const h = height;
    if (w < 8 || h < 8) return;
    const dpr = getCachedDpr();
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
    if (!onExportSnapshotReady) return;
    const exportSnapshot = async (): Promise<Blob> => {
      // Fast path: if browser allows exporting the live canvas, keep exact fidelity
      // (including all token icons as currently rendered).
      const live = canvasRef.current;
      if (live) {
        try {
          const directBlob = await new Promise<Blob>((resolve, reject) => {
            live.toBlob((blob) => {
              if (!blob) {
                reject(new Error("live canvas blob empty"));
                return;
              }
              resolve(blob);
            }, "image/png", 1);
          });
          if (directBlob.size > 0) return directBlob;
        } catch {
          // Expected on tainted canvas; fall through to reconstructed export.
        }
      }

      const w = Math.max(1, width);
      const h = Math.max(1, height);
      const dpr = getCachedDpr();
      const out = document.createElement("canvas");
      out.width = Math.max(1, Math.floor(w * dpr));
      out.height = Math.max(1, Math.floor(h * dpr));
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("snapshot context unavailable");

      const v = clampViewToBubbleBounds(viewRef.current, w, h, boundsRef.current);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = getOrCreateBg(w, h);
      ctx.drawImage(bg, 0, 0, w, h);
      ctx.save();
      ctx.translate(v.tx, v.ty);
      ctx.scale(v.scale, v.scale);
      const theme = themeRef.current ?? readThemeSnapshot();
      const nodes = nodesRef.current;
      const dragId = draggingRef.current ? dragMintRef.current : null;
      const hoverId = hoverMintRef.current;
      const exportSafeImages = await Promise.all(
        nodes.map(async (node) => await loadExportSafeImage(node.datum.imageUrl)),
      );
      for (let i = 0; i < nodes.length; i += 1) {
        drawBubble(ctx, nodes[i], dragId, hoverId, theme, true, exportSafeImages[i] ?? null);
      }
      ctx.restore();

      return await new Promise<Blob>((resolve, reject) => {
        out.toBlob((blob) => {
          if (!blob) {
            reject(new Error("snapshot blob empty"));
            return;
          }
          resolve(blob);
        }, "image/png", 1);
      });
    };
    onExportSnapshotReady(exportSnapshot);
    return () => onExportSnapshotReady(null);
  }, [boundsRef, getOrCreateBg, height, nodesRef, onExportSnapshotReady, width]);

  /** Pause the RAF loop entirely when the canvas is off-screen. */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      visibleRef.current = true;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRef.current = entry.isIntersecting;
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
      viewRef.current = zoomAtScreen(lx, ly, viewRef.current, factor, boundsRef.current, width, height);
      idleFramesRef.current = 0; // user interaction = wake from idle
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [width, height, boundsRef]);

  useEffect(() => {
    return () => {
      if (tooltipRafRef.current) cancelAnimationFrame(tooltipRafRef.current);
    };
  }, []);

  useEffect(() => {
    lastTRef.current = performance.now();
    const loop = (t: number) => {
      if (document.visibilityState === "hidden" || !visibleRef.current) {
        lastTRef.current = t;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(48, t - lastTRef.current);
      lastTRef.current = t;

      let maxKE = 0;
      if (!reduceMotion) {
        maxKE = tick(dt);
      }

      // Idle short-circuit: if nothing's moving and no pointer interaction, repaint at ~15fps.
      const hasInteraction =
        draggingRef.current || panRef.current !== null || pinchRef.current !== null;
      if (!hasInteraction && maxKE < IDLE_KE_THRESHOLD) {
        idleFramesRef.current += 1;
      } else {
        idleFramesRef.current = 0;
        idleSkipCounterRef.current = 0;
      }

      const isIdle = idleFramesRef.current > IDLE_FRAMES_TO_DROP;
      if (isIdle) {
        idleSkipCounterRef.current += 1;
        if (idleSkipCounterRef.current < IDLE_FRAME_INTERVAL) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        idleSkipCounterRef.current = 0;
      }

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
    viewRef.current = clampViewToBubbleBounds(next, width, height, boundsRef.current);
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
    idleFramesRef.current = 0;

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
      idleFramesRef.current = 0;
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
      idleFramesRef.current = 0;
      const w = screenToWorld(lx, ly, viewRef.current);
      drag(w.x, w.y);
      setTooltip(null);
      return;
    }

    if (panRef.current) {
      idleFramesRef.current = 0;
      const p = panRef.current;
      viewRef.current = clampViewToBubbleBounds(
        {
          scale: viewRef.current.scale,
          tx: p.startTx + (lx - p.startLX),
          ty: p.startTy + (ly - p.startLY),
        },
        width,
        height,
        boundsRef.current,
      );
      hoverMintRef.current = null;
      setTooltip(null);
      return;
    }

    const world = screenToWorld(lx, ly, viewRef.current);
    const id = hitTest(world.x, world.y);
    hoverMintRef.current = id;
    if (id !== null) idleFramesRef.current = 0;
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
      viewRef.current = zoomAtScreen(lx, ly, viewRef.current, factor, boundsRef.current, width, height);
      idleFramesRef.current = 0;
      draw();
    },
    [width, height, boundsRef, draw],
  );

  // Suppress unused-import warning when this stays minimal: FIT_PADDING is exported for shared code.
  void FIT_PADDING;

  return (
    <div ref={wrapperRef} className="relative h-full min-h-0 w-full min-w-0">
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
