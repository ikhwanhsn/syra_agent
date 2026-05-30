"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SidebarPanelToggleMode = "expand" | "collapse" | "menu";

type SidebarPanelToggleProps = {
  mode: SidebarPanelToggleMode;
  onClick: () => void;
  className?: string;
  /** Overrides default aria-label / tooltip */
  label?: string;
  /** `icon` = floating square; `rail` = centered in narrow rail; `bar` = full-width row with label */
  layout?: "icon" | "rail" | "bar";
};

const MODE_META: Record<
  SidebarPanelToggleMode,
  { label: string; Icon: typeof PanelLeftOpen }
> = {
  expand: { label: "Expand sidebar", Icon: PanelLeftOpen },
  collapse: { label: "Collapse sidebar", Icon: PanelLeftClose },
  menu: { label: "Open navigation", Icon: Menu },
};

const iconShellClass = cn(
  "inline-flex shrink-0 items-center justify-center rounded-[10px]",
  "border border-border/50 bg-muted/30 text-foreground/85",
  "transition-[border-color,background-color,transform] duration-200",
  "group-hover:border-border/80 group-hover:bg-background/80 group-hover:text-foreground",
  "group-active:scale-[0.96]",
);

export function SidebarPanelToggle({
  mode,
  onClick,
  className,
  label: labelOverride,
  layout = "icon",
}: SidebarPanelToggleProps) {
  const { label: defaultLabel, Icon } = MODE_META[mode];
  const label = labelOverride ?? defaultLabel;

  if (layout === "bar") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className={cn(
          "group flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left outline-none",
          "text-muted-foreground transition-[background-color,color,box-shadow] duration-200",
          "hover:bg-muted/45 hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          "active:scale-[0.99]",
          className,
        )}
      >
        <span className={cn(iconShellClass, "h-8 w-8")}>
          <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="text-[12px] font-medium tracking-tight">{label}</span>
      </button>
    );
  }

  const isRail = layout === "rail";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "rounded-xl border-border/55 bg-background/90 shadow-sm backdrop-blur-md",
        "transition-[border-color,background-color,box-shadow,transform] duration-200",
        "hover:border-border hover:bg-accent/35 hover:shadow-md",
        "active:scale-[0.97]",
        "focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        isRail ? "h-10 w-10" : "h-9 w-9",
        className,
      )}
    >
      <Icon
        className={cn(
          "text-foreground/90",
          isRail ? "h-[17px] w-[17px]" : "h-[18px] w-[18px]",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
    </Button>
  );
}

/** Chat agent page — same control with conversation-specific labels */
export function ChatSidebarToggle({
  mode,
  onClick,
  className,
  layout,
}: SidebarPanelToggleProps & { mode: "expand" | "collapse" }) {
  const chatLabel = mode === "expand" ? "Show chats" : "Hide chats";
  return (
    <SidebarPanelToggle
      mode={mode}
      onClick={onClick}
      className={className}
      layout={layout ?? "icon"}
      label={chatLabel}
    />
  );
}
