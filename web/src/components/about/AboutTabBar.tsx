"use client";

import { ABOUT_TABS, type AboutTabId } from "@/components/about/aboutTabs";
import { cn } from "@/lib/utils";

interface AboutTabBarProps {
  activeTab: AboutTabId;
  onChange: (tab: AboutTabId) => void;
}

export function AboutTabBar({ activeTab, onChange }: AboutTabBarProps) {
  return (
    <div
      className="about-tab-shell sticky top-0 z-30 -mx-1 shrink-0 border-b border-border/40 bg-background/85 px-1 py-2 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75"
      role="tablist"
      aria-label="About Syra sections"
    >
      <div className="about-tab-bar flex flex-wrap gap-1 sm:gap-1.5">
        {ABOUT_TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`about-panel-${id}`}
              id={`about-tab-${id}`}
              onClick={() => onChange(id)}
              className={cn(
                "about-tab-trigger group relative flex min-h-[2.65rem] flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2",
                "text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "border-border/55 bg-foreground/[0.07] text-foreground shadow-sm"
                  : "border-transparent bg-transparent text-muted-foreground hover:border-border/40 hover:bg-foreground/[0.04] hover:text-foreground",
                "sm:min-h-[2.85rem] sm:flex-none sm:px-5",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground/80",
                )}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
