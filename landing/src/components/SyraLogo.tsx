import { motion } from "framer-motion";
import logo from "/images/logo.jpg";

export const SyraLogo = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <img src={logo} width={40} height={40} alt="SYRA Logo" />
      <span className="text-2xl font-bold tracking-tight neon-text">SYRA</span>
    </motion.div>
  );
};
