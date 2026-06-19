import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Code2, Layers, Wrench } from "lucide-react";
import {
  PLAYGROUND_TAB_ORDER,
  type PlaygroundTab,
} from "@/components/playground/PlaygroundTabBar.types";
import {
  playgroundSegmentedRoot,
  playgroundSegmentedTrigger,
} from "@/components/playground/playgroundStyles";

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
      className="playground-tab-bar sticky top-0 z-20 shrink-0 border-b border-border/45 bg-background/75 pt-3 backdrop-blur-xl sm:pt-4"
      style={{ ["--playground-tab-bar-height" as string]: "4.25rem" }}
      role="tablist"
      aria-label="Playground sections"
    >
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3 px-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80 lg:block">
          Playground
        </p>
        <div className={cn(playgroundSegmentedRoot(PLAYGROUND_TAB_ORDER.length), "lg:min-w-[32rem]")}>
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
                className={playgroundSegmentedTrigger(isActive)}
              >
                {icon}
                <span className="flex min-w-0 flex-col items-start text-left">
                  <span className="truncate leading-none">{label}</span>
                  <span
                    className={cn(
                      "mt-0.5 hidden truncate text-[10px] font-normal leading-none sm:block",
                      isActive ? "text-muted-foreground" : "text-muted-foreground/70",
                    )}
                  >
                    {description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
