import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ExternalLink,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { SYRA_AGENT_URL, SYRA_WEB_ORIGIN } from "@/content/syraUrls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchDocs } from "@/data/searchIndex";

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const results = useMemo(() => searchDocs(searchQuery), [searchQuery]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, typeof results>();
    for (const entry of results) {
      const list = groups.get(entry.category) ?? [];
      list.push(entry);
      groups.set(entry.category, list);
    }
    return groups;
  }, [results]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchQuery("");
        setIsSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openSearch = () => {
    setSearchQuery("");
    setIsSearchOpen(true);
  };

  const handleSelect = (href: string) => {
    navigate(href);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const navItems = [
    { label: "Docs", href: "/docs", match: (p: string) => p === "/docs" || p === "/docs/welcome" },
    { label: "API", href: "/docs/api-reference", match: (p: string) => p.startsWith("/docs/api") },
    { label: "Agent", href: "/docs/agent/getting-started", match: (p: string) => p.startsWith("/docs/agent") || p.startsWith("/docs/x402-agent") },
    { label: "Changelog", href: "/docs/changelog", match: (p: string) => p === "/docs/changelog" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl safe-top">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-4 lg:px-6 safe-left safe-right">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden min-touch flex-shrink-0"
              onClick={onMenuToggle}
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link to="/docs" className="flex items-center gap-2 group flex-shrink-0 min-w-0">
              <img
                src="/images/logo.jpg"
                alt="Syra"
                className="h-7 w-7 rounded-lg object-cover flex-shrink-0"
              />
              <span className="docs-display font-semibold text-base tracking-tight truncate">Syra</span>
              <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded border border-border/60 flex-shrink-0 hidden sm:inline-flex">
                docs
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-0.5 flex-shrink-0">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md transition-colors",
                  item.match(location.pathname)
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={openSearch}
              className="hidden sm:flex items-center gap-2 h-8 px-3 text-sm text-muted-foreground rounded-md border border-border/60 bg-muted/30 hover:bg-muted/50 hover:text-foreground transition-colors min-w-[140px] lg:min-w-[200px]"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left truncate">Search...</span>
              <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-border/60 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden min-touch text-muted-foreground hover:text-foreground"
              onClick={openSearch}
              aria-label="Search documentation"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground min-touch h-8 w-8"
              onClick={() => setTheme((theme ?? "dark") === "dark" ? "light" : "dark")}
              aria-label={(theme ?? "dark") === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {(theme ?? "dark") === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground min-touch h-8 w-8 hidden sm:flex" asChild>
              <a href={SYRA_WEB_ORIGIN} target="_blank" rel="noopener noreferrer" aria-label="Visit website">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            <Button variant="primary" size="sm" className="hidden sm:flex h-8" asChild>
              <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
                Try Agent
              </a>
            </Button>
          </div>
        </div>
      </header>

      <CommandDialog
        open={isSearchOpen}
        onOpenChange={(open) => {
          if (!open) setSearchQuery("");
          setIsSearchOpen(open);
        }}
        commandProps={{ shouldFilter: false }}
      >
        <CommandInput
          placeholder="Search documentation..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList className="max-h-[min(60dvh,360px)] sm:max-h-[min(70vh,400px)] overflow-y-auto">
          <CommandEmpty>No results found.</CommandEmpty>
          {Array.from(groupedResults.entries()).map(([category, entries]) => (
            <CommandGroup key={category} heading={category}>
              {entries.map((entry) => (
                <CommandItem
                  key={`${entry.href}-${entry.title}`}
                  value={`${entry.title} ${entry.href} ${entry.category}`}
                  onSelect={() => handleSelect(entry.href)}
                  className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                >
                  <span className="font-medium">{entry.title}</span>
                  <span className="text-xs text-muted-foreground">{entry.href}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex gap-3">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </CommandDialog>
    </>
  );
}
