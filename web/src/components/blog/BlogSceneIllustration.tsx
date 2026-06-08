import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Brain,
  Cpu,
  Globe,
  Layers,
  Shield,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FLOAT_ICONS: {
  Icon: LucideIcon;
  label: string;
  style: CSSProperties;
  delay: number;
  depth: "near" | "mid" | "far";
}[] = [
  { Icon: Brain, label: "Intelligence", style: { top: "11%", left: "5%" }, delay: 0, depth: "near" },
  { Icon: Zap, label: "x402", style: { top: "24%", right: "4%" }, delay: 0.4, depth: "mid" },
  { Icon: Globe, label: "Solana", style: { top: "48%", left: "3%" }, delay: 0.8, depth: "far" },
  { Icon: Shield, label: "Security", style: { top: "68%", right: "6%" }, delay: 1.2, depth: "mid" },
  { Icon: BarChart3, label: "Signals", style: { top: "82%", left: "8%" }, delay: 1.6, depth: "far" },
  { Icon: Cpu, label: "Agents", style: { top: "36%", right: "2%" }, delay: 0.6, depth: "near" },
  { Icon: Layers, label: "MPP", style: { top: "58%", right: "3%" }, delay: 1, depth: "mid" },
];

function FloatingIconChip({
  Icon,
  label,
  style,
  delay,
  depth,
  reduceMotion,
}: {
  Icon: LucideIcon;
  label: string;
  style: CSSProperties;
  delay: number;
  depth: "near" | "mid" | "far";
  reduceMotion: boolean | null;
}) {
  return (
    <motion.div
      className={`blog-icon-chip blog-icon-chip--${depth}`}
      style={style}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="blog-icon-chip-inner"
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -10, 0], rotateZ: [0, 2, 0, -2, 0] }
        }
        transition={{
          duration: 5 + delay,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
      >
        <div className="blog-icon-chip-glass">
          <Icon className="blog-icon-chip-svg" aria-hidden />
        </div>
        <span className="blog-icon-chip-label">{label}</span>
      </motion.div>
    </motion.div>
  );
}

function WireCube({ reduceMotion }: { reduceMotion: boolean | null }) {
  const faces = ["front", "back", "right", "left", "top", "bottom"] as const;

  return (
    <motion.div
      className="blog-wire-cube-scene"
      animate={reduceMotion ? undefined : { rotateX: [18, 22, 18], rotateY: [0, 360, 0] }}
      transition={{ rotateY: { duration: 32, repeat: Infinity, ease: "linear" }, rotateX: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
    >
      <div className="blog-wire-cube">
        {faces.map((face) => (
          <div key={face} className={`blog-wire-cube-face blog-wire-cube-face--${face}`} />
        ))}
      </div>
    </motion.div>
  );
}

function IsometricStack({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.div
      className="blog-iso-stack"
      animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="blog-iso-plate blog-iso-plate--3" aria-hidden />
      <div className="blog-iso-plate blog-iso-plate--2" aria-hidden />
      <div className="blog-iso-plate blog-iso-plate--1">
        <div className="blog-iso-logo-wrap">
          <img
            src="/images/logo.jpg"
            alt=""
            width={48}
            height={48}
            className="blog-iso-logo"
          />
          <div className="blog-iso-logo-glow" aria-hidden />
        </div>
        <span className="blog-iso-badge">SYRA</span>
      </div>
      <div className="blog-iso-ring" aria-hidden />
    </motion.div>
  );
}

export function BlogSceneIllustration() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      {/* Decorative connector lines */}
      <svg
        className="blog-scene-lines hidden lg:block"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <motion.path
          d="M120 180 Q 360 120 520 280 T 720 200"
          className="blog-scene-line"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.3 }}
        />
        <motion.path
          d="M1320 220 Q 1080 160 920 320 T 720 240"
          className="blog-scene-line"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.6 }}
        />
        <motion.path
          d="M100 620 Q 280 560 440 680 T 680 600"
          className="blog-scene-line blog-scene-line--faint"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, delay: 0.9 }}
        />
        <motion.path
          d="M1340 640 Q 1160 580 1000 700 T 760 620"
          className="blog-scene-line blog-scene-line--faint"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, delay: 1.1 }}
        />
      </svg>

      {/* Left: isometric Syra stack */}
      <div className="blog-scene-left hidden lg:block" aria-hidden>
        <IsometricStack reduceMotion={reduceMotion} />
      </div>

      {/* Right: wireframe cube */}
      <div className="blog-scene-right hidden lg:block" aria-hidden>
        <WireCube reduceMotion={reduceMotion} />
        <div className="blog-hex-ring">
          <div className="blog-hex-ring-inner" />
        </div>
      </div>

      {/* Floating themed icon chips */}
      <div className="blog-icon-field hidden md:block" aria-hidden>
        {FLOAT_ICONS.map(({ Icon, label, style, delay, depth }) => (
          <FloatingIconChip
            key={label}
            Icon={Icon}
            label={label}
            style={style}
            delay={delay}
            depth={depth}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </>
  );
}
