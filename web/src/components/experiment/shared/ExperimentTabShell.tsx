import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ExperimentTabId = "start" | "results" | "activity";

const TAB_ITEMS: ReadonlyArray<{ id: ExperimentTabId; label: string; hint: string }> = [
  { id: "start", label: "Get started", hint: "Learn and pick a strategy" },
  { id: "results", label: "Live results", hint: "See what's winning" },
  { id: "activity", label: "Activity", hint: "Recent trades" },
];

export interface ExperimentTabShellProps {
  activeTab: ExperimentTabId;
  onTabChange: (tab: ExperimentTabId) => void;
  accentClass?: string;
  startContent: ReactNode;
  resultsContent: ReactNode;
  activityContent: ReactNode;
  className?: string;
}

export function ExperimentTabShell({
  activeTab,
  onTabChange,
  accentClass = "data-[state=active]:bg-background data-[state=active]:text-foreground",
  startContent,
  resultsContent,
  activityContent,
  className,
}: ExperimentTabShellProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as ExperimentTabId)}
      className={cn("space-y-6", className)}
    >
      <div className="sticky top-0 z-10 -mx-1 px-1 pb-1 pt-0.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <TabsList
          className={cn(
            "grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-border/50 bg-muted/40 p-1.5",
            "shadow-[inset_0_1px_0_0_hsl(var(--background)/0.6)]",
          )}
        >
          {TAB_ITEMS.map(({ id, label, hint }) => (
            <TabsTrigger
              key={id}
              value={id}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-center",
                "text-muted-foreground transition-all duration-200",
                "data-[state=active]:shadow-sm",
                accentClass,
              )}
            >
              <span className="text-sm font-semibold tracking-tight">{label}</span>
              <span className="hidden text-[10px] font-normal leading-tight text-muted-foreground sm:block">
                {hint}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="start" className="mt-0 space-y-8 outline-none">
        {startContent}
      </TabsContent>
      <TabsContent value="results" className="mt-0 space-y-8 outline-none">
        {resultsContent}
      </TabsContent>
      <TabsContent value="activity" className="mt-0 space-y-8 outline-none">
        {activityContent}
      </TabsContent>
    </Tabs>
  );
}
