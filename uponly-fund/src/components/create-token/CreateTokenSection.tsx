import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/rise/RiseShared";

type Props = {
  title: string;
  hint: string;
  children: ReactNode;
  delay?: number;
};

export function CreateTokenSection({ title, hint, children, delay = 0 }: Props) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard padded={false} className="overflow-hidden border-border/50">
        <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{hint}</p>
        </div>
        <motion.div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">{children}</motion.div>
      </GlassCard>
    </motion.div>
  );
}
