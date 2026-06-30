import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
  activeId?: string;
  onActiveChange?: (id: string) => void;
}

export function TableOfContents({ items, activeId: controlledActiveId, onActiveChange }: TableOfContentsProps) {
  const [internalActiveId, setInternalActiveId] = useState("");
  const activeId = controlledActiveId ?? internalActiveId;

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const id = visible[visible.length - 1].target.id;
          setInternalActiveId(id);
          onActiveChange?.(id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, onActiveChange]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block sticky top-[calc(var(--docs-header-height)+1.5rem)] w-docs-toc shrink-0 self-start">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </p>
      <nav className="space-y-0.5 border-l border-border/60">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "block text-[13px] py-1.5 transition-colors border-l-2 -ml-px",
              item.level === 2 ? "pl-3" : "pl-5 font-normal text-muted-foreground/90",
              activeId === item.id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
            )}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}
