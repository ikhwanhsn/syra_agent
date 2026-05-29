"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatSidebarToggleProps = {
  /** `expand` = show open-panel icon; `collapse` = show close-panel icon */
  mode: "expand" | "collapse";
  onClick: () => void;
  className?: string;
};

/** Paired Lucide panel icons for chat sidebar expand / collapse. */
export function ChatSidebarToggle({ mode, onClick, className }: ChatSidebarToggleProps) {
  const label = mode === "expand" ? "Show chats" : "Hide chats";
  const Icon = mode === "expand" ? PanelLeftOpen : PanelLeftClose;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "h-9 w-9 rounded-xl border-border/60 bg-background/85 shadow-sm backdrop-blur-md",
        "transition-[border-color,background-color,box-shadow] duration-200",
        "hover:border-border hover:bg-accent/40 hover:shadow-md",
        "focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <Icon className="h-[18px] w-[18px] text-foreground/90" strokeWidth={1.75} aria-hidden />
    </Button>
  );
}
