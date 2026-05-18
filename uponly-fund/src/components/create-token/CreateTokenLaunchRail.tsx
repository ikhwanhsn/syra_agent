import { Check, Circle, Loader2, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/rise/RiseShared";
import { cn } from "@/lib/utils";
import type { DashboardDictionary } from "@/lib/dashboardI18n";

type Props = {
  copy: DashboardDictionary["createTokenPage"];
  busy: boolean;
  hasImage: boolean;
  hasIdentity: boolean;
  walletConnected: boolean;
};

type StepState = "done" | "active" | "pending";

function stepState(index: number, busy: boolean): StepState {
  if (!busy) return index === 0 ? "active" : "pending";
  if (index === 0) return "done";
  if (index === 1) return "active";
  return "pending";
}

export function CreateTokenLaunchRail({ copy, busy, hasImage, hasIdentity, walletConnected }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const steps = [copy.stepMetadata, copy.stepTransactions, copy.stepConfirm] as const;

  const checklist = [
    { label: copy.checklistImage, done: hasImage },
    { label: copy.checklistName, done: hasIdentity },
    { label: copy.checklistWallet, done: walletConnected },
    { label: copy.checklistSol, done: walletConnected },
  ];

  return (
    <GlassCard padded={false} className="overflow-hidden border-border/50">
      <motion.div className="border-b border-border/45 px-4 py-3.5 sm:px-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.launchRailTitle}</p>
      </motion.div>

      <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        <ol className="space-y-3" aria-label={copy.launchRailTitle}>
          {steps.map((label, i) => {
            const state = busy && i === 2 ? "active" : stepState(i, busy);
            return (
              <motion.li
                key={label}
                className="flex items-center gap-3"
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <StepIcon state={state} busy={busy && i === 1} />
                <span
                  className={cn(
                    "text-sm",
                    state === "active" && "font-medium text-foreground",
                    state === "done" && "text-muted-foreground",
                    state === "pending" && "text-muted-foreground/70",
                  )}
                >
                  {label}
                </span>
              </motion.li>
            );
          })}
        </ol>

        <ul className="space-y-2 border-t border-border/40 pt-4">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 text-xs">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  item.done
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                    : "border-border/55 bg-muted/20 text-muted-foreground/40",
                )}
                aria-hidden
              >
                {item.done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : <Circle className="h-2 w-2 fill-current" />}
              </span>
              <span className={item.done ? "text-foreground/85" : "text-muted-foreground"}>{item.label}</span>
            </li>
          ))}
        </ul>

        {!walletConnected ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5 text-xs text-amber-200/90 dark:text-amber-100/85">
            <Wallet className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <p>{copy.connectWalletPrompt}</p>
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}

function StepIcon({ state, busy }: { state: StepState; busy?: boolean }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-500">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border/50 bg-muted/20">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" aria-hidden />
    </span>
  );
}
