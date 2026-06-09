import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { POST_PHOTO_HEIGHT, POST_PHOTO_WIDTH } from "@/components/post/photo/postPhotoExport";

interface PostPhotoFrameProps {
  children: ReactNode;
  exportRef?: React.RefObject<HTMLDivElement | null>;
}

/** Scales the fixed 1200×675 canvas to fit the preview area; export ref targets full-size node. */
export function PostPhotoFrame({ children, exportRef }: PostPhotoFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const setFrameRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (exportRef) {
        (exportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [exportRef],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const avail = wrap.clientWidth;
      if (avail <= 0) return;
      setScale(Math.min(1, avail / POST_PHOTO_WIDTH));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const scaledHeight = POST_PHOTO_HEIGHT * scale;

  return (
    <div ref={wrapRef} className="post-photo-frame-wrap" style={{ height: scaledHeight }}>
      <div
        ref={setFrameRef}
        className="post-photo-frame"
        style={{
          width: POST_PHOTO_WIDTH,
          height: POST_PHOTO_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
