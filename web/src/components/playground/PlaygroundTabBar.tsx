import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Code2, Layers, Wrench } from "lucide-react";
import {
  PLAYGROUND_TAB_ORDER,
  type PlaygroundTab,
} from "@/components/playground/PlaygroundTabBar.types";

export type { PlaygroundTab } from "@/components/playground/PlaygroundTabBar.types";
export {
  parsePlaygroundTab,
  playgroundTabToParam,
} from "@/components/playground/PlaygroundTabBar.types";

const TAB_CONFIG: Record<
  PlaygroundTab,
  { label: string; description: string; icon: ReactNode }
> = {
  syra: {
    label: "Syra APIs",
    description: "Browse & test x402 endpoints",
    icon: <Layers className="h-4 w-4 shrink-0" aria-hidden />,
  },
  build: {
    label: "Build on rail",
    description: "SDK, curl & MCP integration",
    icon: <Code2 className="h-4 w-4 shrink-0" aria-hidden />,
  },
  custom: {
    label: "Custom API",
    description: "Free-form request builder",
    icon: <Wrench className="h-4 w-4 shrink-0" aria-hidden />,
  },
};

interface PlaygroundTabBarProps {
  active: PlaygroundTab;
  onChange: (tab: PlaygroundTab) => void;
}

export function PlaygroundTabBar({ active, onChange }: PlaygroundTabBarProps) {
  return (
    <div
      className="playground-tab-bar sticky top-0 z-20 shrink-0 border-b border-border/50 bg-background/80 pt-4 backdrop-blur-xl sm:pt-5"
      style={{ ["--playground-tab-bar-height" as string]: "3.5rem" }}
      role="tablist"
      aria-label="Playground sections"
    >
      <div className="mx-auto flex w-full max-w-[1800px] gap-0.5 px-4 sm:px-6">
        {PLAYGROUND_TAB_ORDER.map((id) => {
          const { label, description, icon } = TAB_CONFIG[id];
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`playground-panel-${id}`}
              id={`playground-tab-${id}`}
              onClick={() => onChange(id)}
              className={cn(
                "group relative flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-3.5 sm:flex-initial sm:justify-start sm:px-5",
                "text-sm font-medium transition-colors duration-200",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80",
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
                  isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-75",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
