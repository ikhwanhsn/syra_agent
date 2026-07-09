import { motion } from "framer-motion";

interface BlogFeaturedImageProps {
  src: string;
  alt: string;
}

export function BlogFeaturedImage({ src, alt }: BlogFeaturedImageProps) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-[0_24px_48px_-32px_rgba(0,0,0,0.55)]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted/20">
        <img
          src={src}
          alt={alt}
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-transparent" />
      </div>
    </motion.figure>
  );
}
