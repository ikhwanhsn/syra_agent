import { motion, useReducedMotion } from "framer-motion";

interface BlogFeaturedImageProps {
  src: string;
  alt: string;
}

export function BlogFeaturedImage({ src, alt }: BlogFeaturedImageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="blog-featured group relative mb-12 sm:mb-16"
    >
      <div className="blog-featured-perspective" style={{ perspective: "1200px" }}>
        <motion.div
          className="blog-featured-frame relative overflow-hidden rounded-2xl sm:rounded-3xl"
          whileHover={reduceMotion ? undefined : { rotateX: 2, rotateY: -2, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="blog-featured-glow pointer-events-none absolute -inset-4 rounded-[2rem] opacity-60" aria-hidden />
          <div className="blog-featured-border pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl" aria-hidden />

          <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
            <img
              src={src}
              alt={alt}
              width={1920}
              height={1080}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              loading="eager"
              fetchPriority="high"
            />
            <div className="blog-featured-overlay pointer-events-none absolute inset-0" aria-hidden />
          </div>

          {/* Floating depth accents */}
          <div className="blog-featured-float blog-featured-float-a" aria-hidden />
          <div className="blog-featured-float blog-featured-float-b" aria-hidden />
        </motion.div>
      </div>

      <figcaption className="mt-4 text-center text-xs text-muted-foreground">
        Featured illustration · Syra
      </figcaption>
    </motion.figure>
  );
}
