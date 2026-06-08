import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlogImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function BlogImage({ src, alt, caption, className }: BlogImageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("blog-image my-10 sm:my-12", className)}
    >
      <motion.div
        className="blog-image-frame group relative overflow-hidden rounded-2xl"
        whileHover={reduceMotion ? undefined : { y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <div className="blog-image-glow pointer-events-none absolute -inset-2 rounded-[1.25rem] opacity-50" aria-hidden />
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="relative w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="blog-image-overlay pointer-events-none absolute inset-0" aria-hidden />
      </motion.div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </motion.figure>
  );
}
