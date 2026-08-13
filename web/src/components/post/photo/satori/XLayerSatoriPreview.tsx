import { useEffect, useRef, useState } from "react";
import type { XLayerCardDef } from "@/content/announce/xlayerCards";
import { renderXLayerSvg } from "@/components/post/photo/satori/renderXLayerSvg";
import { PHOTO_SQUARE } from "@/components/post/photo/satori/tokens";

interface XLayerSatoriPreviewProps {
  card: XLayerCardDef;
}

export function XLayerSatoriPreview({ card }: XLayerSatoriPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const avail = wrap.clientWidth;
      if (avail <= 0) return;
      setScale(Math.min(1, avail / PHOTO_SQUARE.width));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    renderXLayerSvg(card)
      .then((next) => {
        if (cancelled) return;
        setSvg(next);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to render preview";
        console.error("[post/photo/xlayer] preview failed", err);
        setError(message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [card]);

  const scaledHeight = PHOTO_SQUARE.height * scale;

  return (
    <div ref={wrapRef} className="post-photo-frame-wrap" style={{ height: scaledHeight }}>
      <div
        className="post-photo-frame"
        style={{
          width: PHOTO_SQUARE.width,
          height: PHOTO_SQUARE.height,
          transform: `scale(${scale})`,
        }}
      >
        {loading && !svg ? (
          <div
            className="flex h-full w-full items-center justify-center bg-white"
            style={{ width: PHOTO_SQUARE.width, height: PHOTO_SQUARE.height }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-400">
              Rendering…
            </p>
          </div>
        ) : null}
        {error ? (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white px-8"
            style={{ width: PHOTO_SQUARE.width, height: PHOTO_SQUARE.height }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-red-600">
              Preview failed
            </p>
            <p className="max-w-md text-center text-sm text-neutral-500">{error}</p>
          </div>
        ) : null}
        {svg ? (
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
            alt=""
            width={PHOTO_SQUARE.width}
            height={PHOTO_SQUARE.height}
            className="block"
            style={{ width: PHOTO_SQUARE.width, height: PHOTO_SQUARE.height }}
          />
        ) : null}
      </div>
    </div>
  );
}
