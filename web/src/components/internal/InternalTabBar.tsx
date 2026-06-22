import type { ReactNode } from "react";
import { BarChart3, Bot, Coins, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INTERNAL_TAB_ORDER,
  type InternalTab,
} from "@/components/internal/InternalTabBar.types";

export type { InternalTab } from "@/components/internal/InternalTabBar.types";
export {
  parseInternalTab,
  internalTabToParam,
} from "@/components/internal/InternalTabBar.types";

const TAB_CONFIG: Record<
  InternalTab,
  { label: string; description: string; icon: ReactNode }
> = {
  metrics: {
    label: "Metrics",
    description: "Live product & rail analytics",
    icon: <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />,
  },
  x402: {
    label: "x402",
    description: "Payment errors, volume & health",
    icon: <Coins className="h-4 w-4 shrink-0" aria-hidden />,
  },
  agents: {
    label: "Agents",
    description: "Scouts & partnership pipeline",
    icon: <Bot className="h-4 w-4 shrink-0" aria-hidden />,
  },
  tools: {
    label: "Tools",
    description: "Internal utilities & generators",
    icon: <Wrench className="h-4 w-4 shrink-0" aria-hidden />,
  },
};

interface InternalTabBarProps {
  active: InternalTab;
  onChange: (tab: InternalTab) => void;
}

export function InternalTabBar({ active, onChange }: InternalTabBarProps) {
  return (
    <div
      className="sticky top-0 z-20 shrink-0 border-b border-border/50 bg-background/80 pt-1 backdrop-blur-xl"
      role="tablist"
      aria-label="Internal hub sections"
    >
      <div className="flex gap-0.5">
        {INTERNAL_TAB_ORDER.map((id) => {
          const { label, description, icon } = TAB_CONFIG[id];
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`internal-panel-${id}`}
              id={`internal-tab-${id}`}
              onClick={() => onChange(id)}
              className={cn(
                "group relative flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-3.5 sm:flex-initial sm:justify-start sm:px-5",
                "text-sm font-medium transition-colors duration-200",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              {icon}
              <span className="flex min-w-0 flex-col items-start">
                <span className="truncate leading-none">{label}</span>
                <span
                  className={cn(
                    "mt-0.5 hidden truncate text-[11px] font-normal leading-none sm:block",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {description}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary transition-all duration-300 ease-out sm:inset-x-4",
                  isActive ? "scale-x-100 opacity-100" : "scale-x-75 opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
