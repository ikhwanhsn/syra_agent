import { useState } from "react";
import { ImageIcon, Play } from "lucide-react";

import type { KolTweetMedia } from "@/lib/kolApi";
import { getTweetMediaDisplayUrl } from "@/lib/kolApi";
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

function TweetMediaTile({
  item,
  tweetUrl,
  single,
}: {
  item: KolTweetMedia;
  tweetUrl: string;
  single: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const isVideo = isVideoType(item.mediaType);
  const imageSrc = getTweetMediaDisplayUrl(item);

  if (failed) {
    return (
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-muted-foreground",
          single ? "min-h-[12rem] max-h-[28rem]" : "aspect-video",
        )}
      >
        <ImageIcon className="h-8 w-8 opacity-50" aria-hidden />
      </a>
    );
  }

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-muted/20",
        single ? "block w-full" : "aspect-video",
      )}
    >
      <img
        src={imageSrc}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(
          "w-full transition-transform duration-300 group-hover:scale-[1.02]",
          single ? "max-h-[28rem] object-contain bg-black/20" : "h-full object-cover",
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
      {items.map((item, index) => (
        <TweetMediaTile
          key={`${item.url}-${index}`}
          item={item}
          tweetUrl={tweetUrl}
          single={items.length === 1}
        />
      ))}
    </div>
  );
}

interface CampaignTweetPreviewProps {
  media?: KolTweetMedia[];
  tweetUrl: string;
  className?: string;
}

function CampaignTweetNoImage({
  tweetUrl,
  className,
}: {
  tweetUrl: string;
  className?: string;
}) {
  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "group relative flex aspect-[1.91/1] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/25",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 80% at 50% 40%, hsl(var(--primary) / 0.1), transparent 65%), linear-gradient(135deg, hsl(var(--muted) / 0.5) 0%, transparent 50%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden
      />
      <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-muted-foreground shadow-sm transition-colors group-hover:border-primary/30 group-hover:text-primary">
        <ImageIcon className="h-5 w-5" aria-hidden />
      </span>
      <span className="relative mt-2.5 text-xs font-medium tracking-wide text-muted-foreground">
        No image
      </span>
      <span className="relative mt-0.5 text-[10px] text-muted-foreground/70">
        Open source post
      </span>
    </a>
  );
}

/** Compact image preview for campaign browse cards. */
export function CampaignTweetPreview({ media, tweetUrl, className }: CampaignTweetPreviewProps) {
  const [failed, setFailed] = useState(false);
  const items = media?.filter((item) => item.url) ?? [];

  if (items.length === 0 || failed) {
    return <CampaignTweetNoImage tweetUrl={tweetUrl} className={className} />;
  }

  const preview = items.find((item) => !isVideoType(item.mediaType)) ?? items[0];

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "block overflow-hidden rounded-xl border border-border/50 bg-muted/20 aspect-[1.91/1] relative group",
        className,
      )}
    >
      <img
        src={getTweetMediaDisplayUrl(preview)}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      {items.length > 1 ? (
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          +{items.length - 1}
        </span>
      ) : null}
      {isVideoType(preview.mediaType) ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/20">
            <Play className="h-4 w-4 text-white fill-white ml-0.5" aria-hidden />
          </span>
        </span>
      ) : null}
    </a>
  );
}
