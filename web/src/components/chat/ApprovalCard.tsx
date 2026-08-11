import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ApprovalCard({
  question,
  children,
  className,
}: {
  question: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 space-y-3 rounded-2xl border border-border/60 bg-muted/15 p-4",
        className,
      )}
      role="group"
      aria-label={question}
    >
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground/80" aria-hidden />
        <p className="text-sm font-semibold leading-snug text-foreground">{question}</p>
      </div>
      {children}
    </div>
  );
}
