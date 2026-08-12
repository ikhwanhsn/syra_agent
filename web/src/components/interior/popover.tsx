"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;
const CROSSFADE = { type: "spring", stiffness: 260, damping: 34, mass: 0.8 } as const;
const RADIUS = 6;
const MIN_W = 160;
const MIN_H = 88;

const useIsoLayoutEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect;

export type PopoverSide = "top" | "right" | "bottom" | "left";
export type PopoverAlign = "start" | "center" | "end";

const FLIP: Record<PopoverSide, PopoverSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const ARROW_EDGE: Record<PopoverSide, string> = {
  bottom: "border-t border-l",
  top: "border-b border-r",
  right: "border-b border-l",
  left: "border-t border-r",
};

const FROM: Record<PopoverSide, { x?: number; y?: number }> = {
  top: { y: 6 },
  bottom: { y: -6 },
  left: { x: 6 },
  right: { x: -6 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

export type UsePopoverOptions = {
  open: boolean;
  side?: PopoverSide;
  align?: PopoverAlign;
  offset?: number;
  padding?: number;
  arrowSize?: number;
  boundary?: RefObject<HTMLElement | null>;
};

export type UsePopoverResult<A extends HTMLElement = HTMLElement> = {
  anchorRef: RefObject<A | null>;
  floatingRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  arrowRef: RefObject<HTMLSpanElement | null>;
  side: PopoverSide;
  update: () => void;
};

export function usePopover<A extends HTMLElement = HTMLElement>({
  open,
  side = "bottom",
  align = "center",
  offset = 10,
  padding = 8,
  arrowSize = 9,
  boundary,
}: UsePopoverOptions): UsePopoverResult<A> {
  const anchorRef = useRef<A>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  const [resolved, setResolved] = useState<PopoverSide>(side);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    const wrap = floatingRef.current;
    const panel = panelRef.current;
    if (!anchor || !wrap || !panel) return;

    const content = contentRef.current;
    panel.style.maxWidth = "";
    if (content) content.style.maxHeight = "";

    const a = anchor.getBoundingClientRect();
    const b = boundary?.current?.getBoundingClientRect() ?? null;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    const left = b ? Math.max(padding, b.left + padding) : padding;
    const top = b ? Math.max(padding, b.top + padding) : padding;
    const right = b ? Math.min(vw - padding, b.right - padding) : vw - padding;
    const bottom = b ? Math.min(vh - padding, b.bottom - padding) : vh - padding;

    panel.style.maxWidth = `${Math.max(MIN_W, right - left)}px`;

    const room: Record<PopoverSide, number> = {
      top: a.top - top - offset,
      bottom: bottom - a.bottom - offset,
      left: a.left - left - offset,
      right: right - a.right - offset,
    };

    let next = side;
    const wanted =
      next === "top" || next === "bottom" ? panel.offsetHeight : panel.offsetWidth;
    if (room[next] < wanted && room[FLIP[next]] > room[next]) next = FLIP[next];

    const horizontal = next === "top" || next === "bottom";
    if (!horizontal) {
      panel.style.maxWidth = `${Math.max(MIN_W, Math.min(right - left, room[next]))}px`;
    }
    if (content) {
      const chrome = panel.offsetHeight - content.offsetHeight;
      const allowed = horizontal ? room[next] : bottom - top;
      content.style.maxHeight = `${Math.max(MIN_H, allowed - chrome)}px`;
    }

    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    let x: number;
    let y: number;
    if (horizontal) {
      y = next === "top" ? a.top - offset - h : a.bottom + offset;
      x =
        align === "start"
          ? a.left
          : align === "end"
            ? a.right - w
            : a.left + (a.width - w) / 2;
    } else {
      x = next === "left" ? a.left - offset - w : a.right + offset;
      y =
        align === "start"
          ? a.top
          : align === "end"
            ? a.bottom - h
            : a.top + (a.height - h) / 2;
    }
    x = clamp(x, left, right - w);
    y = clamp(y, top, bottom - h);

    const base = wrap.getBoundingClientRect();
    const originX = base.left - (parseFloat(wrap.style.left) || 0);
    const originY = base.top - (parseFloat(wrap.style.top) || 0);
    wrap.style.left = `${Math.round(x - originX)}px`;
    wrap.style.top = `${Math.round(y - originY)}px`;

    const half = arrowSize / 2;
    const point = horizontal
      ? clamp(a.left + a.width / 2 - x, RADIUS + half, w - RADIUS - half)
      : clamp(a.top + a.height / 2 - y, RADIUS + half, h - RADIUS - half);

    panel.style.transformOrigin = horizontal
      ? `${Math.round(point)}px ${next === "top" ? h : 0}px`
      : `${next === "left" ? w : 0}px ${Math.round(point)}px`;

    const arrow = arrowRef.current;
    if (arrow) {
      if (horizontal) {
        arrow.style.left = `${Math.round(point - half)}px`;
        arrow.style.top = `${Math.round(next === "top" ? h - half : -half)}px`;
      } else {
        arrow.style.top = `${Math.round(point - half)}px`;
        arrow.style.left = `${Math.round(next === "left" ? w - half : -half)}px`;
      }
    }

    setResolved((prev) => (prev === next ? prev : next));
  }, [side, align, offset, padding, arrowSize, boundary]);

  useIsoLayoutEffect(() => {
    if (!open) return;
    update();
  }, [open, update]);

  useEffect(() => {
    if (!open) return;

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    const observer = new ResizeObserver(schedule);
    if (anchorRef.current) observer.observe(anchorRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [open, update]);

  return {
    anchorRef,
    floatingRef,
    panelRef,
    contentRef,
    arrowRef,
    side: resolved,
    update,
  };
}

export type PopoverProps = {
  trigger: ReactNode;
  children: ReactNode;
  label: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: PopoverSide;
  align?: PopoverAlign;
  offset?: number;
  padding?: number;
  arrowSize?: number;
  boundary?: RefObject<HTMLElement | null>;
  asChild?: boolean;
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  triggerClassName?: string;
  className?: string;
};

export function Popover({
  trigger,
  children,
  label,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "center",
  offset = 10,
  padding = 8,
  arrowSize = 9,
  boundary,
  asChild = false,
  triggerProps,
  triggerClassName = "",
  className = "",
}: PopoverProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = controlled ?? uncontrolled;

  const id = useId();
  const reduced = useReducedMotion();

  const notify = useRef(onOpenChange);
  notify.current = onOpenChange;

  const { anchorRef, floatingRef, panelRef, contentRef, arrowRef, side: at } =
    usePopover<HTMLElement>({
      open,
      side,
      align,
      offset,
      padding,
      arrowSize,
      boundary,
    });

  const setOpen = useCallback(
    (next: boolean) => {
      if (controlled === undefined) setUncontrolled(next);
      notify.current?.(next);
    },
    [controlled],
  );

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
  }, [open, panelRef]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target))
        return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      anchorRef.current?.focus({ preventScroll: true });
      setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, setOpen, anchorRef, panelRef]);

  const toggle = () => setOpen(!open);

  const anchorAria = {
    "aria-haspopup": "dialog" as const,
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
  };

  let triggerNode: ReactNode;

  if (asChild && isValidElement(trigger)) {
    const child = trigger as ReactElement<
      HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }
    >;
    triggerNode = cloneElement(child, {
      ...triggerProps,
      ...anchorAria,
      ref: mergeRefs(anchorRef, child.props.ref),
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        child.props.onClick?.(event);
        triggerProps?.onClick?.(
          event as unknown as ReactMouseEvent<HTMLButtonElement>,
        );
        if (!event.defaultPrevented) toggle();
      },
      className: cn(child.props.className, triggerClassName, triggerProps?.className),
    });
  } else {
    triggerNode = (
      <button
        ref={anchorRef as RefObject<HTMLButtonElement | null>}
        type="button"
        {...anchorAria}
        {...triggerProps}
        onClick={(event) => {
          triggerProps?.onClick?.(event);
          if (!event.defaultPrevented) toggle();
        }}
        className={cn(
          "inline-flex h-9 select-none items-center gap-2 rounded-md border border-border bg-popover px-3 text-[13px] font-medium text-foreground outline-none transition-[border-color,box-shadow] duration-150 hover:border-border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
          triggerClassName,
          triggerProps?.className,
        )}
      >
        {trigger}
      </button>
    );
  }

  return (
    <>
      {triggerNode}
      <AnimatePresence>
        {open ? (
          <div
            key="popover"
            ref={floatingRef}
            className="fixed left-0 top-0 z-50"
            onBlurCapture={(event) => {
              const next = event.relatedTarget as Node | null;
              if (!next) return;
              if (panelRef.current?.contains(next) || anchorRef.current?.contains(next))
                return;
              setOpen(false);
            }}
          >
            <motion.div
              ref={panelRef}
              id={id}
              role="dialog"
              aria-label={label}
              tabIndex={-1}
              initial={
                reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, ...FROM[at] }
              }
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={
                reduced
                  ? { opacity: 0, transition: { duration: 0.1 } }
                  : {
                      opacity: 0,
                      scale: 0.97,
                      transition: { duration: 0.13, ease: EASE },
                    }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : { ...CROSSFADE, opacity: { duration: 0.14, ease: EASE } }
              }
              className={cn(
                "relative rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-medium focus-visible:outline-none",
                className,
              )}
            >
              <span
                ref={arrowRef}
                aria-hidden
                style={{
                  width: arrowSize,
                  height: arrowSize,
                  transform: "rotate(45deg)",
                }}
                className={cn(
                  "absolute block border-border bg-popover",
                  ARROW_EDGE[at],
                )}
              />
              <div
                ref={contentRef}
                className="relative overflow-y-auto overscroll-contain"
              >
                {children}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
