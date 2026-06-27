import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ProfileSectionHeaderProps {
  icon: ReactNode;
  title: string;
  className?: string;
}

export function ProfileSectionHeader({ icon, title, className }: ProfileSectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
        {icon}
      </span>
      <h2 className="font-semibold text-base sm:text-lg tracking-tight truncate">{title}</h2>
    </div>
  );
}
