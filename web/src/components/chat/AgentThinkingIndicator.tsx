"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThinkingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="typing-dot typing-dot-delay-1 h-1.5 w-1.5 rounded-full bg-primary/85" />
      <span className="typing-dot typing-dot-delay-2 h-1.5 w-1.5 rounded-full bg-primary/70" />
    </span>
  );
}

export function AgentThinkingAvatar({
  agentName,
  src = "/logo.jpg",
  className,
}: {
  agentName: string;
  src?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <span
        className="animate-thinking-orbit pointer-events-none absolute -inset-1 rounded-full border border-primary/25"
        aria-hidden
      />
      <span
        className="animate-thinking-glow pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-md"
        aria-hidden
      />
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-card shadow-md ring-1 ring-border/60 ring-offset-2 ring-offset-background sm:h-9 sm:w-9">
        <img src={src} alt={agentName} className="h-full w-full object-cover" draggable={false} />
      </div>
    </div>
  );
}

type AgentThinkingIndicatorProps = {
  agentName: string;
  steps: string[];
  avatarSrc?: string;
};

const STEP_MS = 2400;
const FADE_MS = 220;

export function AgentThinkingIndicator({
  agentName,
  steps,
  avatarSrc,
}: AgentThinkingIndicatorProps) {
  const safeSteps = steps.length > 0 ? steps : ["Thinking…"];
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setStepIndex(0);
    setVisible(true);
  }, [safeSteps.join("|")]);

  useEffect(() => {
    if (safeSteps.length <= 1) return;
    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setStepIndex((i) => (i + 1) % safeSteps.length);
        setVisible(true);
      }, FADE_MS);
    }, STEP_MS);
    return () => window.clearInterval(interval);
  }, [safeSteps.length]);

  const label = safeSteps[stepIndex] ?? safeSteps[0];
  const progress = ((stepIndex + 1) / safeSteps.length) * 100;

  return (
    <div className="group flex min-w-0 animate-fade-in items-start gap-3 py-1.5 sm:gap-4 sm:py-2">
      <div className="flex-shrink-0 pt-1 sm:pt-1.5">
        <AgentThinkingAvatar agentName={agentName} src={avatarSrc} />
      </div>

      <div className="min-w-0 flex-1 pr-1 sm:pr-2">
        <div className="thinking-card relative overflow-hidden rounded-2xl border border-border/55 bg-[hsl(var(--message-agent)/0.92)] shadow-[0_0_0_1px_hsl(var(--foreground)/0.04)_inset,0_28px_64px_-32px_rgba(0,0,0,0.78),0_1px_0_0_hsl(var(--primary)/0.06)_inset] backdrop-blur-xl dark:bg-gradient-to-br dark:from-[hsl(var(--message-agent)/0.98)] dark:via-card/55 dark:to-card/20">
          <div
            className="pointer-events-none absolute inset-y-3 left-0 w-px rounded-full bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0"
            aria-hidden
          />
          <div
            className="thinking-shimmer-bar pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-80"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(120%_80%_at_0%_0%,hsl(var(--foreground)/0.07),transparent_55%)]"
            aria-hidden
          />

          <div className="relative space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className="animate-thinking-badge-pulse inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.08] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/90">
                  <Sparkles className="h-3 w-3 text-primary/80" strokeWidth={2.25} aria-hidden />
                  Thinking
                </span>
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-base">
                  {agentName}
                </span>
              </div>
              <ThinkingDots />
            </div>

            <div className="space-y-3">
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl border border-border/40 bg-background/[0.12] px-4 py-3.5 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.05)] transition-all duration-300 ease-out",
                  visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                )}
              >
                <p className="text-sm leading-snug text-foreground/92">{label}</p>
              </div>

              <div className="space-y-2 px-0.5" aria-hidden>
                <div className="flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/55">
                  <span>Progress</span>
                  <span className="tabular-nums">
                    {stepIndex + 1}/{safeSteps.length}
                  </span>
                </div>
                <div
                  className="h-1 overflow-hidden rounded-full bg-muted/40"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Step ${stepIndex + 1} of ${safeSteps.length}`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.max(12, progress)}%` }}
                  />
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {safeSteps.map((step, i) => (
                    <li
                      key={`${i}-${step}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        i === stepIndex
                          ? "w-6 bg-primary shadow-[0_0_12px_-2px_hsl(var(--primary)/0.8)]"
                          : i < stepIndex
                            ? "w-1.5 bg-primary/35"
                            : "w-1.5 bg-muted-foreground/25",
                      )}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
