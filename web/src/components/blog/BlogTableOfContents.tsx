import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { List } from "lucide-react";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
}

interface BlogTableOfContentsProps {
  contentSelector?: string;
}

export function BlogTableOfContents({
  contentSelector = ".blog-content",
}: BlogTableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const root = document.querySelector(contentSelector);
    if (!root) return;

    const headings = Array.from(
      root.querySelectorAll<HTMLElement>("h2, h3"),
    ).map((el) => ({
      id: el.id,
      text: el.textContent ?? "",
      level: el.tagName === "H2" ? 2 : 3,
    }));

    setItems(headings.filter((h) => h.id));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [contentSelector]);

  if (items.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      aria-label="Table of contents"
      className={cn(overviewCardShell, "p-4")}
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
        <List className="h-3.5 w-3.5" />
        On this page
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                activeId === item.id
                  ? "bg-muted/30 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/20 hover:text-foreground",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
