import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Shared responsive frame for earn tab modals (playbooks / skills / token). */
const earnDialogSurface = cn(
  "flex flex-col gap-0 overflow-hidden p-0",
  "w-[calc(100vw-0.75rem)] sm:w-[min(100%,calc(100vw-2rem))]",
  "max-w-none sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl",
  "max-h-[min(94dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-0.75rem))]",
  "rounded-xl sm:rounded-2xl border-border/50",
  "bg-gradient-to-br from-card/98 via-card to-muted/[0.05]",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.45),0_32px_64px_-24px_rgba(0,0,0,0.55)]",
);

const earnDialogOverlay = "bg-black/55 backdrop-blur-[2px]";

const earnFieldControlClass = cn(
  "h-11 rounded-xl border-border/60 bg-muted/25",
  "placeholder:text-muted-foreground/55",
  "focus-visible:bg-background focus-visible:ring-primary/25",
  "transition-colors duration-150",
);

const earnTextareaClass = cn(
  "min-h-[7.5rem] rounded-xl border-border/60 bg-muted/25",
  "placeholder:text-muted-foreground/55",
  "focus-visible:bg-background focus-visible:ring-primary/25",
  "transition-colors duration-150 resize-y",
);

const earnSelectTriggerClass = cn(
  "h-11 rounded-xl border-border/60 bg-muted/25",
  "focus:ring-primary/25",
  "transition-colors duration-150",
);

type EarnDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function EarnDialogShell({
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
}: EarnDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(earnDialogSurface, className)}
        overlayClassName={earnDialogOverlay}
      >
        <DialogHeader className="relative shrink-0 space-y-0 border-b border-border/50 px-4 pb-4 pr-12 pt-5 text-left sm:px-6 sm:pb-5 sm:pt-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_140px_at_8%_-20%,hsl(var(--primary)/0.1),transparent_60%)]"
          />
          <div className="relative flex items-start gap-3 sm:gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.12)] sm:h-11 sm:w-11">
              <Icon className="h-[18px] w-[18px] text-primary" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1 sm:space-y-1.5 sm:pt-0.5">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className={cn(
            "min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain",
            "px-4 py-4 sm:px-6 sm:py-5",
            "max-h-[min(62dvh,560px)] sm:max-h-[min(64dvh,640px)] md:max-h-[min(68dvh,720px)] lg:max-h-[min(70dvh,780px)]",
            bodyClassName,
          )}
        >
          {children}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border/50 bg-muted/15 px-4 py-3.5 sm:space-x-0 sm:px-6 sm:py-4">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EarnDialogFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

export function EarnDialogField({
  label,
  htmlFor,
  hint,
  optional,
  children,
  className,
}: EarnDialogFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className="text-[13px] font-medium tracking-tight text-foreground/90"
        >
          {label}
        </Label>
        {optional ? (
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
            Optional
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

type EarnDialogSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function EarnDialogSection({
  title,
  description,
  children,
  className,
}: EarnDialogSectionProps) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-border/45 bg-muted/15 p-3.5 sm:p-4",
        className,
      )}
    >
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
          {title}
        </p>
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function EarnDialogError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-sm leading-relaxed text-destructive"
    >
      {message}
    </div>
  );
}

export {
  earnFieldControlClass,
  earnTextareaClass,
  earnSelectTriggerClass,
};
