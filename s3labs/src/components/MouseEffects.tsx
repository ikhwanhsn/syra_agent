import { useState, useEffect, useRef } from "react";

const MOUSE_GLOW_SIZE = 420;
const RIPPLE_DURATION_MS = 700;
const RIPPLE_MAX = 5;

let rippleId = 0;

export default function MouseEffects() {
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasPointer, setHasPointer] = useState(true);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const handler = () => setReducedMotion(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    setHasPointer(!coarse.matches);
    const handler = () => setHasPointer(!coarse.matches);
    coarse.addEventListener("change", handler);
    return () => coarse.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const handleMove = (e: MouseEvent) => {
      if (!hasPointer) return;
      posRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setMouse(posRef.current);
        rafRef.current = 0;
      });
    };

    const handleClick = (e: MouseEvent) => {
      const id = ++rippleId;
      setRipples((prev) => [
        ...prev.slice(-(RIPPLE_MAX - 1)),
        { id, x: e.clientX, y: e.clientY },
      ]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, RIPPLE_DURATION_MS);
    };

    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("click", handleClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, hasPointer]);

  if (reducedMotion) return null;

  return (
    <>
      {/* Soft glow that follows the cursor (only when mouse/trackpad) */}
      {hasPointer && (
        <div
          className="mouse-glow"
          aria-hidden
          style={{
            left: mouse.x,
            top: mouse.y,
            width: MOUSE_GLOW_SIZE,
            height: MOUSE_GLOW_SIZE,
            marginLeft: -MOUSE_GLOW_SIZE / 2,
            marginTop: -MOUSE_GLOW_SIZE / 2,
          }}
        />
      )}

      {/* Ripple on click */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="click-ripple"
          aria-hidden
          style={{
            left: r.x,
            top: r.y,
          }}
        />
      ))}
    </>
  );
}
