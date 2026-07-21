import { useEffect, useRef, useState } from "react";
import type { PostPhotoCardDef } from "@/content/posts/photo/types";
import { renderPhotoSvg } from "@/components/post/photo/satori/renderPhotoSvg";
import { PHOTO_SIZE } from "@/components/post/photo/satori/tokens";
import type { PhotoLayoutVariant } from "@/components/post/photo/satori/variants";

interface PostPhotoSatoriPreviewProps {
  card: PostPhotoCardDef;
  variant?: PhotoLayoutVariant;
}

export function PostPhotoSatoriPreview({
  card,
  variant = 0,
}: PostPhotoSatoriPreviewProps) {
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
      setScale(Math.min(1, avail / PHOTO_SIZE.width));
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

    renderPhotoSvg(card, variant)
      .then((next) => {
        if (cancelled) return;
        setSvg(next);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to render preview";
        console.error("[post/photo/satori] preview failed", err);
        setError(message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [card, variant]);

  const scaledHeight = PHOTO_SIZE.height * scale;

  return (
    <div ref={wrapRef} className="post-photo-frame-wrap" style={{ height: scaledHeight }}>
      <div
        className="post-photo-frame"
        style={{
          width: PHOTO_SIZE.width,
          height: PHOTO_SIZE.height,
          transform: `scale(${scale})`,
        }}
      >
        {loading && !svg ? (
          <div
            className="flex h-full w-full items-center justify-center bg-[#050505]"
            style={{ width: PHOTO_SIZE.width, height: PHOTO_SIZE.height }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
              Rendering…
            </p>
          </div>
        ) : null}
        {error ? (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#050505] px-8"
            style={{ width: PHOTO_SIZE.width, height: PHOTO_SIZE.height }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-red-400/80">
              Preview failed
            </p>
            <p className="max-w-md text-center text-sm text-white/45">{error}</p>
          </div>
        ) : null}
        {svg ? (
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
            alt=""
            width={PHOTO_SIZE.width}
            height={PHOTO_SIZE.height}
            className="block"
            style={{ width: PHOTO_SIZE.width, height: PHOTO_SIZE.height }}
          />
        ) : null}
      </div>
    </div>
  );
}
