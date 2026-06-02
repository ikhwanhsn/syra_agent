import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Layers, Wrench } from "lucide-react";
import type { PlaygroundTab } from "@/components/playground/PlaygroundTabBar.types";

export type { PlaygroundTab } from "@/components/playground/PlaygroundTabBar.types";

interface PlaygroundTabBarProps {
  active: PlaygroundTab;
  onChange: (tab: PlaygroundTab) => void;
}

export function PlaygroundTabBar({ active, onChange }: PlaygroundTabBarProps) {
  return (
    <div className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1800px] gap-1 px-4 py-2">
        <TabButton
          active={active === "syra"}
          onClick={() => onChange("syra")}
          icon={<Layers className="h-4 w-4" />}
          label="Syra APIs"
        />
        <TabButton
          active={active === "custom"}
          onClick={() => onChange("custom")}
          icon={<Wrench className="h-4 w-4" />}
          label="Custom API"
        />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium sm:flex-initial sm:px-4",
        "transition-[background-color,color,transform,box-shadow] duration-200 ease-out",
        "active:scale-[0.98]",
        active
          ? "bg-muted text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
