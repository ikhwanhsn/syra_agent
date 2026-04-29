import { type ComponentType, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="pt-5 pb-1 first:pt-1">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
        {children}
      </p>
    </div>
  );
}

export function SidebarNavLink({
  to,
  icon: Icon,
  children,
  end,
  rightAdornment,
}: {
  to: string;
  icon: ComponentType<LucideProps>;
  children: ReactNode;
  end?: boolean;
  rightAdornment?: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {({ isActive }) => (
        <span
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium leading-none tracking-tight transition-all duration-200",
            "border border-transparent",
            isActive
              ? "border-sidebar-border/70 bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
              : "text-muted-foreground hover:border-border/60 hover:bg-muted/45 hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200",
              isActive
                ? "border-sidebar-border/55 bg-background/25 text-sidebar-accent-foreground"
                : "border-transparent bg-muted/35 text-muted-foreground group-hover:border-border/50 group-hover:bg-muted/55 group-hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate">{children}</span>
          {rightAdornment ? <span className="shrink-0 text-muted-foreground">{rightAdornment}</span> : null}
        </span>
      )}
    </NavLink>
  );
}
