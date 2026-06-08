import { motion, useReducedMotion } from "framer-motion";
import { ParticleField } from "@/components/marketing/ParticleField";
import { OrbitRings } from "@/components/marketing/OrbitRings";
import { BlogSceneIllustration } from "./BlogSceneIllustration";

export function BlogAmbient() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="blog-ambient pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Syra home-style grid canvas */}
      <div className="absolute inset-0 opacity-[0.55] grid-pattern" />
      <div className="absolute inset-0 opacity-[0.32] grid-pattern-accent" />
      <div className="blog-ambient-vignette absolute inset-0" />

      {/* Marketing-style soft light pools */}
      <div className="absolute top-0 left-1/4 h-[min(560px,70vh)] w-[min(560px,70vw)] rounded-full bg-primary/[0.07] blur-[130px]" />
      <div className="absolute bottom-0 right-1/4 h-[min(480px,60vh)] w-[min(480px,60vw)] rounded-full bg-primary/[0.05] blur-[110px]" />
      <div className="absolute top-1/2 right-0 h-[min(380px,50vh)] w-[min(380px,50vw)] rounded-full bg-accent/[0.07] blur-[110px]" />
      <div className="absolute bottom-1/4 left-0 h-[min(420px,55vh)] w-[min(420px,55vw)] rounded-full bg-accent/[0.06] blur-[100px]" />
      <div
        className="absolute top-1/3 left-1/2 h-[min(300px,40vh)] w-[min(300px,40vw)] -translate-x-1/2 rounded-full blur-[90px]"
        style={{ background: "hsl(var(--success) / 0.05)" }}
      />

      <div className="blog-ambient-base absolute inset-0" />

      {/* Orbit rings — same motif as marketing hero, subdued behind content */}
      <div className="blog-orbit-wrap absolute inset-0 opacity-[0.22]">
        <OrbitRings />
      </div>

      <ParticleField />
      <BlogSceneIllustration />

      {/* Ambient drift orbs */}
      <motion.div
        className="blog-orb blog-orb-a absolute rounded-full"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -30, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="blog-orb blog-orb-b absolute rounded-full"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 24, 0], y: [0, -16, 0], scale: [1, 1.05, 1] }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="blog-orb blog-orb-c absolute rounded-full"
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -24, 0], opacity: [0.25, 0.45, 0.25] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Dot constellation — subtle depth nodes */}
      <div className="blog-constellation absolute inset-0">
        {[
          { top: "8%", left: "22%", size: 4 },
          { top: "15%", right: "18%", size: 3 },
          { top: "42%", left: "14%", size: 5 },
          { top: "58%", right: "12%", size: 3 },
          { top: "75%", left: "20%", size: 4 },
          { top: "88%", right: "24%", size: 3 },
        ].map((node, i) => (
          <motion.span
            key={i}
            className="blog-constellation-node absolute rounded-full bg-primary/50"
            style={{
              top: node.top,
              left: "left" in node ? node.left : undefined,
              right: "right" in node ? node.right : undefined,
              width: node.size,
              height: node.size,
            }}
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.25, 0.7, 0.25], scale: [1, 1.3, 1] }
            }
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
