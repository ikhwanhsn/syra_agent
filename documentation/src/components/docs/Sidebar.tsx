import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, Twitter, Send, BookOpen, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { navigation, type NavItem } from "@/data/docsNav";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Collect section keys that contain this path so we keep those dropdowns open. */
function getSectionKeysForPath(pathname: string): string[] {
  const keys: string[] = [];
  for (const section of navigation) {
    let containsPath = false;
    let nestedKey: string | null = null;
    for (const item of section.items ?? []) {
      if (item.href && item.href === pathname) {
        containsPath = true;
        break;
      }
      if (item.items) {
        for (const child of item.items) {
          if (child.href && child.href === pathname) {
            containsPath = true;
            nestedKey = `${section.title}::${item.title}`;
            break;
          }
        }
        if (nestedKey) break;
      }
    }
    if (containsPath) {
      keys.push(section.title);
      if (nestedKey) keys.push(nestedKey);
    }
  }
  return keys;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<string[]>(() => getSectionKeysForPath(location.pathname));
  /** Sections the user explicitly closed; they stay closed until opened again even when path matches */
  const [explicitlyClosed, setExplicitlyClosed] = useState<Set<string>>(() => new Set());

  const pathKeys = useMemo(() => getSectionKeysForPath(location.pathname), [location.pathname]);

  useEffect(() => {
    setOpenSections((prev) => {
      const merged = new Set(prev);
      pathKeys.forEach((k) => merged.add(k));
      return merged.size === prev.length && pathKeys.every((k) => prev.includes(k)) ? prev : [...merged];
    });
  }, [location.pathname, pathKeys]);

  const handleNavClick = (href: string) => {
    setOpenSections((prev) => {
      const nextKeys = getSectionKeysForPath(href);
      const merged = new Set(prev);
      nextKeys.forEach((k) => merged.add(k));
      return [...merged];
    });
    onClose();
    navigate(href);
  };

  const toggleSection = (key: string) => {
    const currentlyOpen =
      !explicitlyClosed.has(key) && (openSections.includes(key) || pathKeys.includes(key));
    if (currentlyOpen) {
      setExplicitlyClosed((prev) => new Set(prev).add(key));
      setOpenSections((prev) => prev.filter((t) => t !== key));
    } else {
      setExplicitlyClosed((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setOpenSections((prev) => [...prev, key]);
    }
  };

  const isSectionOpen = (key: string) =>
    !explicitlyClosed.has(key) && (openSections.includes(key) || pathKeys.includes(key));
  const isActive = (href: string) => location.pathname === href;

  const renderItem = (item: NavItem, sectionTitle: string, depth: number) => {
    const hasNested = item.items && item.items.length > 0 && !item.href;
    const groupKey = `${sectionTitle}::${item.title}`;

    if (hasNested) {
      const open = isSectionOpen(groupKey);
      return (
        <div key={groupKey} className={cn(depth === 0 ? "mb-1" : "", "flex flex-col")}>
          <button
            type="button"
            onClick={() => toggleSection(groupKey)}
            className={cn(
              "flex items-center justify-between w-full rounded-md transition-colors text-left flex-shrink-0",
              depth === 0
                ? "px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40"
                : "px-2 py-1 text-sm font-medium text-foreground hover:bg-muted/50"
            )}
          >
            <span className="truncate">{item.title}</span>
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </button>
          {open && (
            <div className="relative z-10 isolate ml-2 mt-0.5 border-l border-border/60 pl-2 space-y-0.5">
              {item.items!.map((child) =>
                child.href ? (
                  <a
                    key={child.href + child.title}
                    href={child.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(child.href!);
                    }}
                    className={cn(
                      "block min-h-[2.25rem] py-1.5 pr-2 text-sm rounded-md transition-all duration-200 truncate cursor-pointer select-text",
                      "touch-manipulation relative z-[2]",
                      isActive(child.href)
                        ? "text-primary bg-primary/10 font-medium border-l-2 border-primary -ml-[9px] pl-1.5"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {child.title}
                  </a>
                ) : (
                  renderItem(child, sectionTitle, depth + 1)
                )
              )}
            </div>
          )}
        </div>
      );
    }

    if (item.href) {
      return (
        <a
          key={item.href + item.title}
          href={item.href}
          onClick={(e) => {
            e.preventDefault();
            handleNavClick(item.href!);
          }}
          className={cn(
            "block min-h-[2.25rem] px-2 py-1.5 text-sm rounded-md transition-all duration-200 cursor-pointer touch-manipulation relative z-[2] select-text",
            isActive(item.href)
              ? "text-primary bg-primary/10 font-medium border-l-2 border-primary -ml-0.5 pl-1.5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {item.title}
        </a>
      );
    }
    return null;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-14 sm:top-16 z-50 flex flex-col w-[min(280px,85vw)] sm:w-64 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] border-r border-border transition-transform duration-300 ease-out lg:translate-x-0",
          "bg-[var(--syra-card)] safe-left safe-bottom",
          "lg:w-64 lg:h-[calc(100vh-4rem)] lg:top-16",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="p-3 sm:p-4 space-y-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          {navigation.map((section) => {
            const sectionOpen = isSectionOpen(section.title);
            const hasNestedGroups =
              section.title === "API Documentation" &&
              section.items?.some((i) => i.items && !i.href);

            return (
              <div key={section.title} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {section.title}
                    {section.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                        {section.badge}
                      </span>
                    )}
                  </span>
                  {sectionOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {sectionOpen && section.items && (
                  <div
                    className={cn(
                      "mt-1 border-l pl-2 space-y-0.5",
                      hasNestedGroups ? "ml-0 border-border/60" : "ml-2 border-primary/20"
                    )}
                  >
                    {section.items.map((item) => renderItem(item, section.title, 0))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer – social / connect */}
        <div className="p-3 sm:p-4 pt-3 mt-auto border-t border-border shrink-0 safe-bottom">
          <p className="px-1 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Connect
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://x.com/syra_agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--syra-card)] transition-colors duration-150"
              title="X (Twitter)"
              aria-label="X (Twitter)"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://t.me/syra_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--syra-card)] transition-colors duration-150"
              title="Telegram"
              aria-label="Telegram"
            >
              <Send className="w-4 h-4" />
            </a>
            <a
              href="https://docs.syraa.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--syra-card)] transition-colors duration-150"
              title="Documentation"
              aria-label="Documentation"
            >
              <BookOpen className="w-4 h-4" />
            </a>
            <a
              href="https://syraa.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--syra-card)] transition-colors duration-150"
              title="Website"
              aria-label="Website"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
