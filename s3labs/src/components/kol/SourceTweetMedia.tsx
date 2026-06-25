import { Play } from "lucide-react";

import type { KolTweetMedia } from "@/lib/kolApi";
import { cn } from "@/lib/utils";

interface SourceTweetMediaProps {
  media: KolTweetMedia[];
  tweetUrl: string;
  className?: string;
}

function isVideoType(mediaType: string): boolean {
  const type = mediaType.toLowerCase();
  return type === "video" || type === "gif" || type === "animated_gif";
}

export function SourceTweetMedia({ media, tweetUrl, className }: SourceTweetMediaProps) {
  const items = media.filter((item) => item.url);
  if (items.length === 0) return null;

  const gridClass =
    items.length === 1
      ? "grid-cols-1"
      : items.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={cn("grid gap-2", gridClass, className)}>
      {items.map((item, index) => {
        const isVideo = isVideoType(item.mediaType);
        const imageSrc = item.previewUrl || item.url;

        return (
          <a
            key={`${item.url}-${index}`}
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border/60 bg-muted/20",
              items.length === 1 ? "max-h-[28rem]" : "aspect-video",
            )}
          >
            <img
              src={imageSrc}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className={cn(
                "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]",
                items.length === 1 ? "max-h-[28rem]" : "",
              )}
            />
            {isVideo ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/20">
                  <Play className="h-5 w-5 text-white fill-white ml-0.5" aria-hidden />
                </span>
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
