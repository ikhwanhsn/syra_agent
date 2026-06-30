import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, Twitter, BookOpen, ExternalLink, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { navigation, filterNavigation, type NavItem } from "@/data/docsNav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  const [filterQuery, setFilterQuery] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(() => getSectionKeysForPath(location.pathname));
  const [explicitlyClosed, setExplicitlyClosed] = useState<Set<string>>(() => new Set());

  const filteredNav = useMemo(() => filterNavigation(filterQuery), [filterQuery]);
  const pathKeys = useMemo(() => getSectionKeysForPath(location.pathname), [location.pathname]);

  useEffect(() => {
    if (filterQuery) {
      setOpenSections(filteredNav.map((s) => s.title));
    }
  }, [filterQuery, filteredNav]);

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
    filterQuery.length > 0 ||
    (!explicitlyClosed.has(key) && (openSections.includes(key) || pathKeys.includes(key)));
  const isActive = (href: string) => location.pathname === href;

  const renderItem = (item: NavItem, sectionTitle: string, depth: number) => {
    const hasNested = item.items && item.items.length > 0 && !item.href;
    const groupKey = `${sectionTitle}::${item.title}`;

    if (hasNested) {
      const open = isSectionOpen(groupKey);
      return (
        <div key={groupKey} className={cn(depth === 0 ? "mb-0.5" : "", "flex flex-col")}>
          <button
            type="button"
            onClick={() => toggleSection(groupKey)}
            className={cn(
              "flex items-center justify-between w-full rounded-md transition-colors text-left",
              depth === 0
                ? "px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40"
                : "px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50"
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
            <div className="relative ml-2 mt-0.5 border-l border-border/50 pl-2 space-y-0.5">
              {item.items!.map((child) =>
                child.href ? (
                  <a
                    key={child.href + child.title}
                    href={child.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(child.href!);
                    }}
                    aria-current={isActive(child.href) ? "page" : undefined}
                    className={cn(
                      "block py-1.5 pr-2 text-[13px] rounded-md transition-all truncate cursor-pointer",
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
          aria-current={isActive(item.href) ? "page" : undefined}
          className={cn(
            "block px-2 py-1.5 text-[13px] rounded-md transition-all cursor-pointer",
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
          "fixed left-0 top-14 z-50 flex flex-col w-[min(280px,85vw)] sm:w-docs-sidebar h-[calc(100dvh-var(--docs-header-height))] border-r border-border/80 transition-transform duration-300 ease-out lg:translate-x-0",
          "bg-sidebar safe-left safe-bottom",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-3 pb-2 shrink-0 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Filter navigation..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="h-8 pl-8 pr-8 text-sm bg-muted/30 border-border/60"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <nav className="p-3 space-y-1">
            {filteredNav.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">No matching pages</p>
            ) : (
              filteredNav.map((section) => {
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
                      <span className="flex items-center gap-2 truncate">
                        {section.title}
                        {section.badge && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
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
                          "mt-0.5 border-l pl-2 space-y-0.5",
                          hasNestedGroups ? "ml-0 border-border/50" : "ml-2 border-primary/15"
                        )}
                      >
                        {section.items.map((item) => renderItem(item, section.title, 0))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        </ScrollArea>

        <div className="p-3 pt-2 border-t border-border/60 shrink-0 safe-bottom">
          <div className="flex gap-1">
            <a
              href="https://x.com/syra_agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="X (Twitter)"
              aria-label="X (Twitter)"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://docs.syraa.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Documentation"
              aria-label="Documentation"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://syraa.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Website"
              aria-label="Website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
