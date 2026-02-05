import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Search, Menu, X, ExternalLink, Sun, Moon } from "lucide-react";
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

  // ⌘K / Ctrl+K to open search
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
    { label: "Docs", href: "/docs" },
    { label: "API", href: "/docs/api-reference" },
    { label: "Changelog", href: "/docs/changelog" },
    { label: "Community", href: "/docs/community" },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-50 glass-strong border-b border-border safe-top"
        style={{ backgroundColor: "var(--syra-card)" }}
      >
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 safe-left safe-right">
          {/* Left section */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden min-touch flex-shrink-0"
              onClick={onMenuToggle}
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link to="/" className="flex items-center gap-2 group flex-shrink-0 min-w-0">
              <img
                src="/images/logo.jpg"
                alt="Syra"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover flex-shrink-0"
              />
              <span className="font-semibold text-base sm:text-lg tracking-tight truncate">Syra</span>
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted flex-shrink-0 hidden sm:inline-flex">
                docs
              </span>
            </Link>
          </div>

          {/* Center navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "inline-flex items-center justify-center min-h-9 px-3 py-2 text-sm font-medium leading-normal rounded-md transition-colors box-border",
                  location.pathname === item.href || location.pathname.startsWith(item.href + "/")
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground px-2 sm:px-3 min-touch"
              onClick={openSearch}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search...</span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
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
              className="text-muted-foreground hover:text-foreground min-touch"
              onClick={() => setTheme((theme ?? "dark") === "dark" ? "light" : "dark")}
              aria-label={(theme ?? "dark") === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {(theme ?? "dark") === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground min-touch hidden sm:flex" asChild>
              <a href="https://syraa.fun" target="_blank" rel="noopener noreferrer" aria-label="Visit website">
                <ExternalLink className="h-5 w-5" />
              </a>
            </Button>

            <Button variant="primary" size="sm" className="hidden sm:flex min-touch" asChild>
              <a href="https://agent.syraa.fun" target="_blank" rel="noopener noreferrer">
                Try Agent
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
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
          <CommandGroup heading="Pages">
            {results.map((entry) => (
              <CommandItem
                key={`${entry.href}-${entry.title}`}
                value={`${entry.title} ${entry.href} ${entry.category}`}
                onSelect={() => handleSelect(entry.href)}
                className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
              >
                <span className="font-medium">{entry.title}</span>
                <span className="text-xs text-muted-foreground">{entry.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
