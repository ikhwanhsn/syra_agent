import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const MIN_SCALE = 0.68;

interface PostSlideFitProps {
  isActive: boolean;
  children: ReactNode;
}

/**
 * Scales slide content down when it exceeds the 16:9 frame so all text stays visible.
 * Re-runs on resize and when the slide becomes active.
 */
export function PostSlideFit({ isActive, children }: PostSlideFitProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    inner.style.transform = "none";
    const contentHeight = inner.scrollHeight;
    const contentWidth = inner.scrollWidth;
    const availHeight = outer.clientHeight;
    const availWidth = outer.clientWidth;

    if (contentHeight <= 0 || contentWidth <= 0 || availHeight <= 0 || availWidth <= 0) {
      setScale(1);
      return;
    }

    const next = Math.min(1, availHeight / contentHeight, availWidth / contentWidth);
    setScale(Math.max(MIN_SCALE, next));
  }, []);

  useLayoutEffect(() => {
    if (!isActive) {
      setScale(1);
      return;
    }

    measure();

    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(outer);
    observer.observe(inner);

    // Re-fit after stagger/reveal animations finish
    const t1 = window.setTimeout(measure, 450);
    const t2 = window.setTimeout(measure, 950);

    return () => {
      observer.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isActive, measure, children]);

  return (
    <div ref={outerRef} className="post-slide-fit">
      <div
        ref={innerRef}
        className="post-slide-fit-inner"
        style={{
          transform: scale === 1 ? undefined : `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
