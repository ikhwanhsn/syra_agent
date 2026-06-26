import type { ReactNode } from "react";

type EarnPanelHeaderProps = {
  title: string;
  action?: ReactNode;
};

export function EarnPanelHeader({ title, action }: EarnPanelHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}
