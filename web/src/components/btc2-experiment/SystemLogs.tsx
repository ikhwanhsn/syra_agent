import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { SectionHeader } from "./shared/SectionHeader";
import type { LogLine } from "@/lib/btc2/types";

const levelColors: Record<LogLine["level"], string> = {
  info: "text-blue-400",
  success: "text-emerald-400",
  warn: "text-amber-400",
  system: "text-muted-foreground",
};

export function SystemLogs({ logs }: { logs: LogLine[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 12"
        title="System Logs"
        description="Live agent loop telemetry — oracle reads, inference, risk checks, and execution."
      />

      <div
        className={cn(
          overviewCardShell,
          "overflow-hidden rounded-2xl border-border/60 bg-[#0a0a0a]/90 font-mono text-xs",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[10px] text-muted-foreground">btc-quant-agent — zsh</span>
        </div>
        <div ref={scrollRef} className="max-h-[280px] overflow-y-auto p-4 space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 leading-relaxed">
              <span className="shrink-0 text-muted-foreground/60">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={cn("shrink-0 uppercase", levelColors[log.level])}>
                [{log.level}]
              </span>
              <span className="text-foreground/90">{log.message}</span>
            </div>
          ))}
          <span className="inline-block h-4 w-2 animate-pulse bg-amber-500/80" />
        </div>
      </div>
    </motion.section>
  );
}
