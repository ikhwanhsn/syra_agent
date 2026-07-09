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
      className="fixed left-0 right-0 z-50 h-0.5 origin-left bg-primary"
      style={{
        scaleX,
        top: "var(--syra-global-nav-height, 3.5rem)",
      }}
      aria-hidden
    />
  );
}
