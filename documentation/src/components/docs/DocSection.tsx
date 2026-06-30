import { cn } from "@/lib/utils";

interface DocSectionProps {
  id: string;
  title?: string;
  level?: 2 | 3;
  description?: React.ReactNode;
  children: React.ReactNode;
  prose?: boolean;
  className?: string;
}

export function DocSection({
  id,
  title,
  level = 2,
  description,
  children,
  prose = false,
  className,
}: DocSectionProps) {
  const Heading = level === 3 ? "h3" : "h2";

  return (
    <section id={id} className={cn("mb-12 scroll-mt-24", className)}>
      {title && (
        <Heading
          className={cn(
            "docs-display font-semibold tracking-tight text-foreground mb-4",
            level === 2 ? "text-2xl" : "text-lg"
          )}
        >
          {title}
        </Heading>
      )}
      {description && (
        <p className="text-muted-foreground mb-4 leading-7">{description}</p>
      )}
      <div className={prose ? "docs-prose" : undefined}>{children}</div>
    </section>
  );
}
