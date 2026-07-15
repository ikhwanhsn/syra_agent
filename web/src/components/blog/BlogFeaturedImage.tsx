import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ARTICLE_IMAGE_HEIGHT,
  ARTICLE_IMAGE_WIDTH,
  articleMediaFrameClass,
  articleMediaImgClass,
} from "@/lib/marketing/articleImageLayout";

interface BlogFeaturedImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function BlogFeaturedImage({ src, alt, className }: BlogFeaturedImageProps) {
  const reduceMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative w-full", className)}
    >
      <div
        className={cn(
          articleMediaFrameClass,
          "rounded-2xl border border-border/50",
          "shadow-[0_28px_56px_-36px_rgba(0,0,0,0.65)]",
          "ring-1 ring-inset ring-white/[0.04]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(90%_70%_at_100%_100%,hsl(190_70%_45%/0.12),transparent_50%)]"
          aria-hidden
        />

        <img
          src={src}
          alt={alt}
          width={ARTICLE_IMAGE_WIDTH}
          height={ARTICLE_IMAGE_HEIGHT}
          className={cn(
            articleMediaImgClass,
            "transition-[opacity,transform] duration-700 ease-out",
            loaded ? "opacity-100" : "opacity-0",
            !reduceMotion && "group-hover:scale-[1.015]",
          )}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/35 via-transparent to-background/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/25 to-transparent"
          aria-hidden
        />
      </div>
    </motion.figure>
  );
}
