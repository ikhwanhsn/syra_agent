import { motion } from "framer-motion";

export const SyraLogo = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div 
      className={`flex items-center gap-3 ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(190, 100%, 50%)" />
            <stop offset="50%" stopColor="hsl(220, 100%, 60%)" />
            <stop offset="100%" stopColor="hsl(270, 100%, 65%)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer circuit ring */}
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="url(#logoGradient)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        
        {/* Neural connections */}
        <path
          d="M20 6 L20 14 M20 26 L20 34 M6 20 L14 20 M26 20 L34 20"
          stroke="url(#logoGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#glow)"
        />
        
        {/* Central hexagon */}
        <path
          d="M20 10 L28 15 L28 25 L20 30 L12 25 L12 15 Z"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
        />
        
        {/* Inner core */}
        <circle
          cx="20"
          cy="20"
          r="4"
          fill="url(#logoGradient)"
          filter="url(#glow)"
        />
        
        {/* Connection nodes */}
        <circle cx="20" cy="6" r="2" fill="url(#logoGradient)" />
        <circle cx="20" cy="34" r="2" fill="url(#logoGradient)" />
        <circle cx="6" cy="20" r="2" fill="url(#logoGradient)" />
        <circle cx="34" cy="20" r="2" fill="url(#logoGradient)" />
      </svg>
      
      <span className="text-2xl font-bold tracking-tight neon-text">
        SYRA
      </span>
    </motion.div>
  );
};
