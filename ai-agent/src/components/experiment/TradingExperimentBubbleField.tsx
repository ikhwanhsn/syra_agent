import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AgentBubble = {
  id: number;
  /** Shown in the orb as “#…”. Defaults to `id` when omitted (use when `id` is encoded for uniqueness). */
  displayAgentId?: number;
  label: string;
  token: string;
  winRatePct: number | null;
  openPositions: number;
  decided: number;
  radius: number;
};

type Props = {
  bubbles: AgentBubble[];
  isLoading?: boolean;
  getAgentHref: (agentId: number) => string;
};

type Tier = "strong" | "mid" | "weak" | "empty";

const ZOOM_MIN = 0.45;
const ZOOM_MAX = 2.75;
const DRAG_THRESHOLD_PX = 6;
const TOOLTIP_Z = 99990;

function tierFor(b: AgentBubble): Tier {
  if (b.decided === 0) return "empty";
  const w = b.winRatePct ?? 0;
  if (w >= 60) return "strong";
  if (w >= 45) return "mid";
  return "weak";
}

/** Per-tier glass orb: soft highlight + deep body (no harsh neon). */
const TIER_THEME: Record<
  Tier,
  {
    highlight: string;
    body: string;
    depth: string;
    ring: string;
    label: string;
    shadow: string;
    dragGlow: string;
  }
> = {
  strong: {
    highlight: "hsla(158, 48%, 72%, 0.42)",
    body: "hsla(158, 38%, 32%, 0.88)",
    depth: "hsla(158, 42%, 14%, 0.96)",
    ring: "hsla(158, 35%, 55%, 0.35)",
    label: "Strong",
    shadow: "0 12px 36px -10px hsla(158, 45%, 8%, 0.55), inset 0 1px 0 hsla(0,0%,100%,0.18)",
    dragGlow: "hsla(158, 55%, 48%, 0.55)",
  },
  mid: {
    highlight: "hsla(43, 58%, 78%, 0.38)",
    body: "hsla(38, 42%, 38%, 0.88)",
    depth: "hsla(32, 45%, 16%, 0.96)",
    ring: "hsla(43, 40%, 58%, 0.32)",
    label: "Mid",
    shadow: "0 12px 36px -10px hsla(32, 40%, 8%, 0.5), inset 0 1px 0 hsla(0,0%,100%,0.16)",
    dragGlow: "hsla(38, 58%, 52%, 0.5)",
  },
  weak: {
    highlight: "hsla(350, 42%, 76%, 0.32)",
    body: "hsla(350, 38%, 40%, 0.86)",
    depth: "hsla(350, 42%, 16%, 0.96)",
    ring: "hsla(350, 35%, 52%, 0.3)",
    label: "Weak",
    shadow: "0 12px 36px -10px hsla(350, 40%, 8%, 0.48), inset 0 1px 0 hsla(0,0%,100%,0.14)",
    dragGlow: "hsla(350, 50%, 52%, 0.5)",
  },
  empty: {
    highlight: "hsla(220, 16%, 70%, 0.22)",
    body: "hsla(220, 14%, 34%, 0.82)",
    depth: "hsla(220, 18%, 12%, 0.94)",
    ring: "hsla(220, 12%, 42%, 0.28)",
    label: "No sample",
    shadow: "0 10px 32px -12px hsla(220, 20%, 4%, 0.45), inset 0 1px 0 hsla(0,0%,100%,0.1)",
    dragGlow: "hsla(220, 25%, 55%, 0.45)",
  },
};

/** Golden-angle spiral with room for larger orbs (fewer overlaps). */
function spiralPositions(n: number): { x: number; y: number }[] {
  if (n <= 0) return [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const maxR = n > 12 ? 0.46 : n > 8 ? 0.42 : 0.4;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / Math.max(1, n);
    const angle = i * golden;
    const r = 0.14 + Math.sqrt(t) * maxR;
    const x = 50 + Math.cos(angle) * r * 100;
    const y = 50 + Math.sin(angle) * r * 100;
    out.push({ x, y });
  }
  return out;
}

type Pan = { x: number; y: number };

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

type PlacedBubble = AgentBubble & {
  x: number;
  y: number;
  d: number;
  dur: number;
  delay: number;
  tier: Tier;
  theme: (typeof TIER_THEME)[Tier];
  z: number;
};

export function TradingExperimentBubbleField({ bubbles, getAgentHref }: Props) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeBubbleDragId, setActiveBubbleDragId] = useState<number | null>(null);
  const [bubblePosOverrides, setBubblePosOverrides] = useState<Record<number, { x: number; y: number }>>({});
  const [tooltipFixed, setTooltipFixed] = useState<{ cx: number; top: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const bubbleAnchorRefs = useRef<Record<number, HTMLAnchorElement | null>>({});
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const panSessionRef = useRef<{ startClient: Pan; startPan: Pan } | null>(null);
  const bubbleDragRef = useRef<{
    id: number;
    startClient: Pan;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);
  const bubbleDragMovedIdsRef = useRef<Set<number>>(new Set());

  const bubbleKey = useMemo(() => [...bubbles.map((b) => b.id)].sort((a, b) => a - b).join(","), [bubbles]);
  const prevBubbleKeyRef = useRef(bubbleKey);
  useEffect(() => {
    if (prevBubbleKeyRef.current !== bubbleKey) {
      prevBubbleKeyRef.current = bubbleKey;
      setBubblePosOverrides({});
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [bubbleKey]);

  const placed = useMemo((): PlacedBubble[] => {
    const positions = spiralPositions(bubbles.length);
    return bubbles.map((b, i) => {
      const spiral = positions[i] ?? { x: 50, y: 50 };
      const ov = bubblePosOverrides[b.id];
      const x = ov?.x ?? spiral.x;
      const y = ov?.y ?? spiral.y;
      const d = Math.round(Math.max(48, Math.min(152, b.radius * 2)));
      const displayNum = b.displayAgentId ?? b.id;
      const dur = 7 + (displayNum % 5) * 0.45;
      const delay = (displayNum % 11) * 0.1;
      const tier = tierFor(b);
      const theme = TIER_THEME[tier];
      const z = 20 + Math.round(d);
      return { ...b, x, y, d, dur, delay, tier, theme, z };
    });
  }, [bubbles, bubblePosOverrides]);

  const hoveredPlaced = useMemo(
    () => (hoverId != null ? placed.find((p) => p.id === hoverId) ?? null : null),
    [hoverId, placed],
  );

  useLayoutEffect(() => {
    if (hoverId == null) {
      setTooltipFixed(null);
      return;
    }
    const el = bubbleAnchorRefs.current[hoverId];
    if (!el) {
      setTooltipFixed(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTooltipFixed({ cx: r.left + r.width / 2, top: r.bottom + 8 });
  }, [hoverId, zoom, pan, placed, bubblePosOverrides, activeBubbleDragId]);

  const applyZoomAt = useCallback((nextZoom: number, mx: number, my: number, cw: number, ch: number) => {
    const s0 = zoomRef.current;
    const s1 = clampZoom(nextZoom);
    if (Math.abs(s1 - s0) < 1e-6) return;
    const cx = cw / 2;
    const cy = ch / 2;
    const pan0 = panRef.current;
    const pan1: Pan = {
      x: mx - cx - (s1 / s0) * (mx - cx - pan0.x),
      y: my - cy - (s1 / s0) * (my - cy - pan0.y),
    };
    setZoom(s1);
    setPan(pan1);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cw = rect.width;
      const ch = rect.height;
      const factor = e.deltaY > 0 ? 0.9 : 1.11;
      applyZoomAt(zoomRef.current * factor, mx, my, cw, ch);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyZoomAt]);

  const zoomStepAtCenter = useCallback(
    (direction: 1 | -1) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      const factor = direction > 0 ? 1.15 : 1 / 1.15;
      applyZoomAt(zoomRef.current * factor, cw / 2, ch / 2, cw, ch);
    },
    [applyZoomAt],
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setBubblePosOverrides({});
  }, []);

  const onWorldPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panSessionRef.current = {
      startClient: { x: e.clientX, y: e.clientY },
      startPan: { ...panRef.current },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onWorldPointerMove = useCallback((e: React.PointerEvent) => {
    const panSess = panSessionRef.current;
    if (!panSess) return;
    const dx = e.clientX - panSess.startClient.x;
    const dy = e.clientY - panSess.startClient.y;
    setPan({ x: panSess.startPan.x + dx, y: panSess.startPan.y + dy });
  }, []);

  const onWorldPointerUp = useCallback((e: React.PointerEvent) => {
    setIsPanning(false);
    if (panSessionRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      panSessionRef.current = null;
    }
  }, []);

  const onBubblePointerDown = useCallback((item: { id: number; x: number; y: number }) => {
    return (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      bubbleDragRef.current = {
        id: item.id,
        startClient: { x: e.clientX, y: e.clientY },
        baseX: item.x,
        baseY: item.y,
        moved: false,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
  }, []);

  const onBubblePointerMove = useCallback((e: React.PointerEvent) => {
    const sess = bubbleDragRef.current;
    if (!sess) return;
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const z = zoomRef.current;
    const dx = e.clientX - sess.startClient.x;
    const dy = e.clientY - sess.startClient.y;
    const dist = Math.hypot(dx, dy);
    if (!sess.moved && dist >= DRAG_THRESHOLD_PX) {
      sess.moved = true;
      setActiveBubbleDragId(sess.id);
    }
    if (!sess.moved) return;
    const dxPct = (dx / z / cw) * 100;
    const dyPct = (dy / z / ch) * 100;
    setBubblePosOverrides((prev) => ({
      ...prev,
      [sess.id]: {
        x: Math.min(98, Math.max(2, sess.baseX + dxPct)),
        y: Math.min(96, Math.max(4, sess.baseY + dyPct)),
      },
    }));
  }, []);

  const onBubblePointerUp = useCallback((id: number) => {
    return (e: React.PointerEvent) => {
      const sess = bubbleDragRef.current;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* */
      }
      if (sess?.id === id && sess.moved) {
        bubbleDragMovedIdsRef.current.add(id);
      }
      bubbleDragRef.current = null;
      setActiveBubbleDragId((cur) => (cur === id ? null : cur));
    };
  }, []);

  const onBubbleClick = useCallback((id: number) => {
    return (e: React.MouseEvent) => {
      if (bubbleDragMovedIdsRef.current.has(id)) {
        e.preventDefault();
        bubbleDragMovedIdsRef.current.delete(id);
      }
    };
  }, []);

  const tooltipPortal =
    hoveredPlaced && tooltipFixed && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed w-max max-w-[260px] -translate-x-1/2 rounded-xl border border-white/10 bg-popover/95 px-3.5 py-2.5 text-left shadow-2xl shadow-black/40 backdrop-blur-xl"
            style={{ left: tooltipFixed.cx, top: tooltipFixed.top, zIndex: TOOLTIP_Z }}
          >
            <p className="truncate text-xs font-semibold tracking-tight text-popover-foreground">{hoveredPlaced.label}</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              #{hoveredPlaced.id} · {hoveredPlaced.token}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
              <span className="rounded-md border border-border/50 bg-muted/80 px-1.5 py-0.5 font-medium text-foreground">
                {hoveredPlaced.theme.label}
              </span>
              <span>
                Win{" "}
                <span className="font-mono text-foreground">
                  {hoveredPlaced.winRatePct != null ? `${hoveredPlaced.winRatePct}%` : "—"}
                </span>
              </span>
              <span>
                <span className="font-mono text-foreground">{hoveredPlaced.decided}</span> dec
              </span>
              <span>
                <span className="font-mono text-foreground">{hoveredPlaced.openPositions}</span> open
              </span>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes syra-bubble-drift {
          0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
          50% { transform: translate(-50%, -50%) translate(3px, -5px); }
        }
        @keyframes syra-bubble-drag-pulse {
          0%, 100% { filter: brightness(1.12) drop-shadow(0 0 14px hsla(158, 60%, 50%, 0.45)); }
          50% { filter: brightness(1.2) drop-shadow(0 0 20px hsla(158, 65%, 55%, 0.55)); }
        }
      `}</style>

      {tooltipPortal}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Visualization</p>
          <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">Agent bubble map</h3>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            Wheel or ± to zoom · drag background to pan · drag a bubble to reposition · click a bubble (without dragging)
            to open its profile.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/25 p-1.5 shadow-inner backdrop-blur-sm dark:bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 border-border/70 bg-background/80 shadow-sm"
            onClick={() => zoomStepAtCenter(-1)}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[3.25rem] rounded-lg bg-background/85 px-2 py-1.5 text-center font-mono text-xs font-medium tabular-nums text-foreground ring-1 ring-border/50">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 border-border/70 bg-background/80 shadow-sm"
            onClick={() => zoomStepAtCenter(1)}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 gap-1.5 border border-border/50 px-3 text-xs font-medium shadow-sm"
            onClick={resetView}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={cn(
          "relative h-[clamp(360px,48vh,560px)] min-h-[360px] w-full overflow-hidden rounded-2xl touch-none select-none",
          "border border-border/50 bg-[hsl(222_47%_6%)] ring-1 ring-white/[0.06]",
          "shadow-[inset_0_1px_0_0_hsla(0,0%,100%,0.07),0_28px_80px_-28px_rgba(0,0,0,0.65)]",
          isPanning ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {/* Depth: vignette + subtle grid — pointer-events none */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 50% 40%, hsla(217, 33%, 17%, 0.5), transparent 70%),
              radial-gradient(circle at 50% 100%, hsl(222 47% 4%), transparent 55%)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at center, hsla(0,0%,100%,0.06) 0.5px, transparent 0.6px)`,
            backgroundSize: "18px 18px",
          }}
        />

        <div
          className="relative z-[1] h-full w-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
          onPointerDown={onWorldPointerDown}
          onPointerMove={onWorldPointerMove}
          onPointerUp={onWorldPointerUp}
          onPointerCancel={onWorldPointerUp}
        >
          {placed.map((b) => {
            const bg = `
            radial-gradient(ellipse 70% 55% at 30% 24%, ${b.theme.highlight}, transparent 58%),
            radial-gradient(circle at 50% 115%, ${b.theme.depth}, ${b.theme.body} 45%, ${b.theme.depth} 100%)
          `;
            const isDragging = activeBubbleDragId === b.id;
            const isHovered = hoverId === b.id;
            const drift = isDragging ? "none" : `syra-bubble-drift ${b.dur}s ease-in-out infinite`;
            const stackBoost = isHovered || isDragging ? 4000 : 0;

            return (
              <Link
                key={b.id}
                ref={(el) => {
                  if (el) bubbleAnchorRefs.current[b.id] = el;
                  else delete bubbleAnchorRefs.current[b.id];
                }}
                to={getAgentHref(b.id)}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className={cn(
                  "group absolute flex flex-col items-center justify-center rounded-full text-center outline-none touch-none",
                  "border border-white/[0.12] backdrop-blur-[2px]",
                  "transition-[transform,box-shadow,filter,border-color] duration-200 ease-out",
                  "hover:scale-[1.06] hover:brightness-[1.06]",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(222_47%_6%)]",
                  "cursor-grab active:cursor-grabbing",
                  isDragging &&
                    "ring-2 ring-white/50 border-white/35 scale-[1.1] brightness-[1.15] shadow-[0_0_0_1px_hsla(0,0%,100%,0.2),0_16px_48px_-8px_hsla(0,0%,0%,0.65)]",
                  isHovered && !isDragging && "ring-1 ring-white/25",
                )}
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.d,
                  height: b.d,
                  zIndex: stackBoost + b.z,
                  background: bg,
                  boxShadow: isDragging
                    ? `${b.theme.shadow}, 0 0 36px -2px ${b.theme.dragGlow}`
                    : b.theme.shadow,
                  borderColor: isDragging ? "hsla(0,0%,100%,0.35)" : b.theme.ring,
                  animation: isDragging ? "syra-bubble-drag-pulse 1.2s ease-in-out infinite" : drift,
                  animationDelay: isDragging ? "0s" : `${b.delay}s`,
                }}
                onPointerDown={onBubblePointerDown({ id: b.id, x: b.x, y: b.y })}
                onPointerMove={onBubblePointerMove}
                onPointerUp={onBubblePointerUp(b.id)}
                onPointerCancel={onBubblePointerUp(b.id)}
                onClick={onBubbleClick(b.id)}
                onMouseEnter={() => setHoverId(b.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {/* Inner glass rim */}
                <span
                  className="pointer-events-none absolute inset-[3px] rounded-full border border-white/[0.14]"
                  style={{ boxShadow: "inset 0 -8px 16px -6px hsla(0,0%,0%,0.25)" }}
                />

                {b.d > 54 ? (
                  <div className="relative z-[1] flex flex-col items-center gap-0.5 px-1 pointer-events-none">
                    <span
                      className="font-mono text-[10px] font-semibold tracking-tight text-white/95 sm:text-[11px]"
                      style={{ textShadow: "0 1px 3px hsla(0,0%,0%,0.65)" }}
                    >
                      #{b.displayAgentId ?? b.id}
                    </span>
                    <span
                      className="font-mono text-[9px] font-medium tabular-nums text-white/75 sm:text-[10px]"
                      style={{ textShadow: "0 1px 2px hsla(0,0%,0%,0.55)" }}
                    >
                      {b.winRatePct != null ? `${b.winRatePct}%` : "—"}
                    </span>
                  </div>
                ) : (
                  <span
                    className="relative z-[1] font-mono text-[9px] font-semibold text-white/90 pointer-events-none"
                    style={{ textShadow: "0 1px 2px hsla(0,0%,0%,0.6)" }}
                  >
                    #{b.displayAgentId ?? b.id}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground sm:text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/90">Legend</span>
            {(Object.keys(TIER_THEME) as Tier[]).map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-white/25 shadow-sm ring-1 ring-black/20"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, ${TIER_THEME[t].highlight}, ${TIER_THEME[t].body})`,
                  }}
                />
                <span className="font-medium text-foreground/85">{TIER_THEME[t].label}</span>
              </span>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs sm:text-right">
            Bubble <span className="font-medium text-foreground/80">size</span> reflects resolved trades (W+L).
          </p>
        </div>
      </div>
    </div>
  );
}
