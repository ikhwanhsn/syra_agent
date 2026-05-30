import { useCallback } from "react";
import { Bug, ChevronRight, Lightbulb, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Same address as landing/docs community contact. */
export const SYRA_FEEDBACK_EMAIL = "support@syraa.fun";

function buildFeedbackMailto(kind: "feature" | "bug"): string {
  const subject =
    kind === "feature"
      ? "[Syra Agent] Feature request"
      : "[Syra Agent] Bug report";
  const body =
    kind === "feature"
      ? `Hi Syra team,

I'd like to request the following feature:




---
Product: Syra Agent
`
      : `Hi Syra team,

I'm reporting a bug in Syra Agent.

What happened:


Steps to reproduce (if any):


Expected:


---
Product: Syra Agent
`;
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${SYRA_FEEDBACK_EMAIL}?${params.toString()}`;
}

export interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const openMailto = useCallback(
    (kind: "feature" | "bug") => {
      window.location.href = buildFeedbackMailto(kind);
      onOpenChange(false);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden border-border/60 p-0 shadow-2xl sm:max-w-md",
          "rounded-2xl bg-background ring-1 ring-white/[0.06]",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent" />
        <DialogHeader className="relative space-y-2 px-5 pb-4 pt-5 text-left sm:px-6 sm:pb-5 sm:pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
              <MessageSquare className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1.5 pt-0.5">
              <DialogTitle className="text-xl font-semibold tracking-tight sm:text-[1.35rem]">
                Send feedback
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                Choose a topic. Your email app opens with a draft to{" "}
                <span className="font-medium text-foreground/90">{SYRA_FEEDBACK_EMAIL}</span>
                — add details and send when you&apos;re ready.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative space-y-2 border-t border-border/50 bg-muted/[0.2] px-3 py-4 sm:px-4 sm:py-5">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            How can we help?
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => openMailto("feature")}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3.5 py-3.5 text-left",
                "shadow-sm transition-all duration-200",
                "hover:border-primary/25 hover:bg-card hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/15">
                <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">Request a feature</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  Suggest something new for Syra Agent
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </button>

            <button
              type="button"
              onClick={() => openMailto("bug")}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3.5 py-3.5 text-left",
                "shadow-sm transition-all duration-200",
                "hover:border-red-500/20 hover:bg-card hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25",
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 ring-1 ring-red-500/15">
                <Bug className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">Report a bug</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  Something broken or confusing? Tell us.
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </button>
          </div>

          <p className="px-1 pt-1 text-center text-[11px] leading-relaxed text-muted-foreground/85">
            No email app? Copy{" "}
            <a
              href={`mailto:${SYRA_FEEDBACK_EMAIL}`}
              className="font-medium text-foreground underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
            >
              {SYRA_FEEDBACK_EMAIL}
            </a>{" "}
            and write us from any inbox.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
