import type { ButtonHTMLAttributes } from "react";
import { PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerDismissButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Shown as tooltip and accessible name */
  label: string;
}

export function DrawerDismissButton({
  label,
  className,
  type = "button",
  ...props
}: DrawerDismissButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "group/dismiss relative inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center sm:h-10 sm:w-10",
        "rounded-full border border-sidebar-border/80 bg-sidebar-accent/[0.16] text-sidebar-foreground",
        "shadow-[inset_0_1px_0_0_hsl(var(--sidebar-foreground)/0.05)]",
        "transition-[transform,background-color,border-color,box-shadow,color,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        "hover:border-sidebar-border hover:bg-sidebar-accent/[0.32] hover:shadow-[inset_0_1px_0_0_hsl(var(--sidebar-foreground)/0.07)]",
        "active:scale-[0.94] active:bg-sidebar-accent/[0.4]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        "disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      title={label}
      aria-label={label}
      {...props}
    >
      <PanelLeftClose
        strokeWidth={1.75}
        className="h-[18px] w-[18px] opacity-[0.88] transition-[opacity,transform] duration-200 ease-out group-hover/dismiss:scale-95 group-hover/dismiss:opacity-100"
        aria-hidden
      />
    </button>
  );
}
