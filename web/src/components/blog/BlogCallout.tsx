import type { ReactNode } from "react";
import { AlertTriangle, Info, Lightbulb, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleCalloutType } from "@/data/marketing/articleContent";

const CALLOUT_CONFIG: Record<
  ArticleCalloutType,
  { label: string; icon: typeof Info; className: string }
> = {
  tip: {
    label: "Pro tip",
    icon: Lightbulb,
    className: "blog-callout-tip",
  },
  note: {
    label: "Note",
    icon: Info,
    className: "blog-callout-note",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    className: "blog-callout-warning",
  },
  important: {
    label: "Important",
    icon: ShieldAlert,
    className: "blog-callout-important",
  },
};

interface BlogCalloutProps {
  type: ArticleCalloutType;
  children: ReactNode;
}

export function BlogCallout({ type, children }: BlogCalloutProps) {
  const config = CALLOUT_CONFIG[type];
  const Icon = config.icon;

  return (
    <aside
      className={cn(
        "blog-callout group relative my-8 overflow-hidden rounded-2xl p-5 sm:p-6",
        config.className,
      )}
      role="note"
    >
      <div className="blog-callout-shine pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
      <div className="relative flex gap-4">
        <div className="blog-callout-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em]">
            {config.label}
          </p>
          <div className="blog-callout-body text-[15px] leading-relaxed sm:text-base">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function parseCalloutType(text: string): ArticleCalloutType | null {
  const match = text.match(/^\[!(TIP|NOTE|WARNING|IMPORTANT)\]/i);
  if (!match) return null;
  const map: Record<string, ArticleCalloutType> = {
    TIP: "tip",
    NOTE: "note",
    WARNING: "warning",
    IMPORTANT: "important",
  };
  return map[match[1].toUpperCase()] ?? null;
}
