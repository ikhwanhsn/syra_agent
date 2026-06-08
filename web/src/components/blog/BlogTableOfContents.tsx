import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { List } from "lucide-react";
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
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      aria-label="Table of contents"
      className="blog-toc hidden lg:block"
    >
      <div className="blog-toc-panel sticky top-28 rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <List className="h-3.5 w-3.5" />
          On this page
        </div>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "blog-toc-link block rounded-lg px-3 py-2 text-sm transition-all",
                  activeId === item.id
                    ? "blog-toc-link-active font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.nav>
  );
}
