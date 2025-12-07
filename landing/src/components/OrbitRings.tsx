import { motion } from "framer-motion";

export const OrbitRings = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Outer ring */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full border border-primary/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-neon-purple/60" />
      </motion.div>

      {/* Middle ring */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full border border-neon-blue/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-1/4 right-0 translate-x-1/2 w-2 h-2 rounded-full bg-neon-blue/60" />
        <div className="absolute bottom-1/4 left-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary/40" />
      </motion.div>

      {/* Inner ring */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full border border-neon-purple/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-0 right-1/4 w-2 h-2 rounded-full bg-neon-gold/60" />
      </motion.div>

      {/* Center glow */}
      <div className="absolute w-[200px] h-[200px] rounded-full bg-primary/5 blur-3xl" />
    </div>
  );
};
