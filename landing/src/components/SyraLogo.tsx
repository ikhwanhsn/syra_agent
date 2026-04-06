import { motion } from "framer-motion";
import logo from "/images/logo.jpg";

export const SyraLogo = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <img
        src={logo}
        width={40}
        height={40}
        alt="SYRA Logo"
        className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
      />
      <span className="text-xl font-bold tracking-tight neon-text sm:text-2xl">
        SYRA
      </span>
    </motion.div>
  );
};
