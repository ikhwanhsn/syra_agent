import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutVariant = "note" | "tip" | "warning" | "important";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<
  CalloutVariant,
  { icon: typeof Info; border: string; bg: string; title: string }
> = {
  note: {
    icon: Info,
    border: "border-l-primary/60",
    bg: "bg-muted/40",
    title: "Note",
  },
  tip: {
    icon: Lightbulb,
    border: "border-l-success/60",
    bg: "bg-success/5",
    title: "Tip",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-warning/70",
    bg: "bg-warning/5",
    title: "Warning",
  },
  important: {
    icon: AlertCircle,
    border: "border-l-destructive/60",
    bg: "bg-destructive/5",
    title: "Important",
  },
};

export function Callout({ variant = "note", title, children, className }: CalloutProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "my-6 rounded-r-lg border border-border/60 border-l-4 px-4 py-3",
        config.border,
        config.bg,
        className
      )}
    >
      <div className="flex gap-3">
        <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        <div className="min-w-0 flex-1 text-sm leading-7 text-foreground">
          {(title ?? config.title) && (
            <p className="font-semibold mb-1">{title ?? config.title}</p>
          )}
          <div className="text-muted-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
