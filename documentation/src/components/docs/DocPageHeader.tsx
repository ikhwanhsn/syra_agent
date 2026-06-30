import { cn } from "@/lib/utils";

interface DocPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
  className?: string;
}

export function DocPageHeader({
  eyebrow,
  title,
  description,
  actions,
  wide = false,
  className,
}: DocPageHeaderProps) {
  return (
    <header className={cn("mb-10 pb-8 border-b border-border/60", className)}>
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-wider text-primary mb-2">{eyebrow}</p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className={cn(wide ? "max-w-docs-wide" : "max-w-docs")}>
          <h1 className="docs-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-3">
            {title}
          </h1>
          {description && (
            <div className="text-lg text-muted-foreground leading-relaxed">{description}</div>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
