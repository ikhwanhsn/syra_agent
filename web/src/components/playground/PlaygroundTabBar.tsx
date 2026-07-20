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
  { label: string; icon: ReactNode }
> = {
  build: {
    label: "Integrate",
    icon: <Code2 className="h-4 w-4 shrink-0" aria-hidden />,
  },
  syra: {
    label: "Catalog",
    icon: <Layers className="h-4 w-4 shrink-0" aria-hidden />,
  },
  custom: {
    label: "Custom",
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
      className="playground-tab-bar marketplace-tab-bar sticky top-0 z-20 shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-xl"
      style={{ ["--playground-tab-bar-height" as string]: "3.25rem" }}
      role="tablist"
      aria-label="API sections"
    >
      <div className="mx-auto flex w-full max-w-[1680px] items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <p className="hidden shrink-0 font-display text-sm font-semibold tracking-tight text-foreground sm:block">
          APIs
        </p>
        <div className={cn(playgroundSegmentedRoot(PLAYGROUND_TAB_ORDER.length), "min-w-0 flex-1 sm:max-w-md")}>
          {PLAYGROUND_TAB_ORDER.map((id) => {
            const { label, icon } = TAB_CONFIG[id];
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
                className={cn(playgroundSegmentedTrigger(isActive), "gap-1.5 py-2")}
              >
                {icon}
                <span className="truncate text-sm">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
