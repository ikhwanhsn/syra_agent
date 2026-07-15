import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ARTICLE_IMAGE_HEIGHT,
  ARTICLE_IMAGE_WIDTH,
  articleMediaFrameClass,
  articleMediaImgClass,
} from "@/lib/marketing/articleImageLayout";

interface BlogImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function BlogImage({ src, alt, caption, className }: BlogImageProps) {
  const reduceMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("blog-image my-10 w-full sm:my-12", className)}
    >
      <motion.div
        className={cn(
          "blog-image-frame group relative w-full overflow-hidden rounded-2xl border border-border/40 bg-muted/10 ring-1 ring-inset ring-white/[0.03]",
        )}
        whileHover={reduceMotion ? undefined : { y: -3 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div
          className="blog-image-glow pointer-events-none absolute -inset-2 rounded-[1.25rem] opacity-40"
          aria-hidden
        />
        <div className={articleMediaFrameClass}>
          <img
            src={src}
            alt={alt}
            width={ARTICLE_IMAGE_WIDTH}
            height={ARTICLE_IMAGE_HEIGHT}
            loading="lazy"
            decoding="async"
            className={cn(
              articleMediaImgClass,
              "transition-[opacity,transform] duration-500",
              loaded ? "opacity-100" : "opacity-0",
              !reduceMotion && "group-hover:scale-[1.02]",
            )}
            onLoad={() => setLoaded(true)}
          />
          <div className="blog-image-overlay pointer-events-none absolute inset-0" aria-hidden />
        </div>
      </motion.div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      ) : (
        <figcaption className="sr-only">{alt}</figcaption>
      )}
    </motion.figure>
  );
}
