import { motion, useScroll, useSpring } from "framer-motion";

export function BlogProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="blog-progress-bar fixed top-0 left-0 right-0 z-[10000] h-[2px] origin-left"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
