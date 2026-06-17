import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Wraps export children so metrics read on dark share frames. */
export function BtcShareExportSkin({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "[&_.text-foreground]:!text-[#fafafa] [&_.text-muted-foreground]:!text-[#a1a1aa]",
        "[&_.font-display]:!text-[#fafafa]",
        className,
      )}
    >
      {children}
    </div>
  );
}
