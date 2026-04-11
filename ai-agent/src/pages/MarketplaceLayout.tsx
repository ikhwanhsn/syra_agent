import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { FileText, Bot, ArrowLeft, Moon, Sun, PanelLeftClose, PanelLeft, Menu, Twitter, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { SIDEBAR_PANEL, MAIN_PANEL, SIDEBAR_AUTO_SAVE_ID } from "@/lib/layoutConstants";
import { SidebarNavLink, SidebarSectionLabel } from "@/components/dashboard/SidebarPrimitives";

const SIDEBAR_SECTIONS = [
  { path: "prompts", label: "Prompts", icon: FileText },
  { path: "agents", label: "Agents", icon: Bot },
] as const;

const PAGE_TITLES: Record<string, string> = {
  prompts: "Prompts",
  agents: "Agents",
};

const CONNECT_LINKS = [
  { href: "https://x.com/syra_agent", icon: Twitter, label: "X" },
  // { href: "https://t.me/syra_ai", icon: Send, label: "Telegram" }, // hidden: focus on website
  { href: "https://docs.syraa.fun", icon: BookOpen, label: "Docs" },
  { href: "https://syraa.fun", icon: ExternalLink, label: "Website" },
];

interface MarketplaceSidebarContentProps {
  onNavigate?: () => void;
  showHeader?: boolean;
  currentSection?: string;
  onCollapse?: () => void;
}

function MarketplaceSidebarContent({ onNavigate, showHeader = true, currentSection = "Prompts", onCollapse }: MarketplaceSidebarContentProps) {
  return (
    <>
      {showHeader && (
        <div className="flex shrink-0 items-center gap-3 border-b border-sidebar-border/90 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/98 px-4 py-4">
          <Link
            to="/"
            className="group/brand flex min-w-0 flex-1 items-center gap-3 no-underline text-inherit rounded-xl p-1 -m-1 transition-colors hover:bg-muted/25"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-card to-muted/30 shadow-sm ring-1 ring-white/[0.04] transition-all duration-200 group-hover/brand:border-accent/35 group-hover/brand:shadow-md">
              <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">Marketplace</h1>
              <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground/85">{currentSection}</p>
            </div>
          </Link>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              onClick={onCollapse}
              title="Hide sidebar"
              aria-label="Hide sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 scrollbar-thin" onClick={onNavigate}>
        <div className="space-y-0.5 px-1 py-3 sm:px-1.5 sm:py-4">
          <Link
            to="/"
            className={cn(
              "group/back flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-[13px] font-medium tracking-tight text-muted-foreground transition-all duration-200",
              "hover:border-border/50 hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent bg-muted/35 transition-colors group-hover/back:border-border/40 group-hover/back:bg-muted/55">
              <ArrowLeft className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            </span>
            <span className="truncate">Back to agent</span>
          </Link>

          <SidebarSectionLabel>Sections</SidebarSectionLabel>
          <div className="space-y-1">
            {SIDEBAR_SECTIONS.map(({ path, label, icon: Icon }) => (
              <SidebarNavLink key={path} to={`/dashboard/marketplace/${path}`} icon={Icon}>
                {label}
              </SidebarNavLink>
            ))}
          </div>
        </div>
      </nav>
      <div className="shrink-0 border-t border-sidebar-border/90 bg-muted/[0.12] px-3 py-4 sm:px-4">
        <p className="px-1 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
          Connect
        </p>
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {CONNECT_LINKS.map(({ href, icon: Icon, label: ariaLabel }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent",
                "text-muted-foreground transition-all duration-200",
                "hover:border-border/60 hover:bg-background/80 hover:text-accent hover:shadow-sm",
              )}
              title={ariaLabel}
              aria-label={ariaLabel}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default function MarketplaceLayout() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => !document.documentElement.classList.contains("light"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  const pathSegment = location.pathname.split("/").filter(Boolean)[1] ?? "prompts";
  const pageTitle = PAGE_TITLES[pathSegment] ?? "Prompts";

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      sidebarPanelRef.current?.expand();
    } else {
      setSidebarOpen(true);
    }
  };

  const topbar = (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/85 px-2 py-2 backdrop-blur-xl backdrop-saturate-150 min-h-[52px] shadow-[0_1px_0_0_hsl(var(--border)/0.5)] sm:min-h-0 sm:gap-4 sm:px-4 sm:py-3">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 shrink-0 touch-manipulation"
          onClick={() => setSidebarOpen(true)}
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 shrink-0 hidden", sidebarCollapsed && "lg:flex")}
          onClick={handleToggleSidebar}
          title="Show sidebar"
          aria-label="Show sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
        <div className="hidden min-w-0 sm:block">
          <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">Marketplace</h1>
          <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground/90">{pageTitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Light mode" : "Dark mode"}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <WalletNav />
      </div>
    </header>
  );

  const scrollableContent = (
    <div className="flex-1 min-h-0 min-w-0 overflow-auto overflow-x-hidden scrollbar-thin">
      <Outlet />
    </div>
  );

  return (
    <div className="h-dvh min-h-dvh max-h-dvh flex flex-col overflow-hidden bg-background min-h-0 overscroll-none">
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={cn(
            "fixed left-0 top-0 z-40 w-[min(280px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] max-w-[min(320px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] h-dvh max-h-dvh flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/92 transition-transform duration-300 ease-out safe-area-top safe-area-bottom overflow-x-hidden overflow-y-auto lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <MarketplaceSidebarContent
            onNavigate={() => setSidebarOpen(false)}
            showHeader={true}
            currentSection={pageTitle}
          />
        </aside>

        <div className="hidden lg:flex flex-1 min-h-0 min-w-0">
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId={SIDEBAR_AUTO_SAVE_ID}
            className="h-full w-full"
          >
            <ResizablePanel
              ref={sidebarPanelRef}
              defaultSize={SIDEBAR_PANEL.defaultSize}
              minSize={SIDEBAR_PANEL.minSize}
              maxSize={SIDEBAR_PANEL.maxSize}
              collapsible
              collapsedSize={0}
              onCollapse={() => setSidebarCollapsed(true)}
              onExpand={() => setSidebarCollapsed(false)}
              className={cn(sidebarCollapsed && "min-w-0")}
            >
              <aside className="flex h-full min-w-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground supports-[backdrop-filter]:bg-sidebar/95">
                <MarketplaceSidebarContent
                  showHeader={true}
                  currentSection={pageTitle}
                  onCollapse={() => sidebarPanelRef.current?.collapse()}
                />
              </aside>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border" />
            <ResizablePanel defaultSize={MAIN_PANEL.defaultSize} minSize={MAIN_PANEL.minSize} className="min-w-0">
              <div className="h-full flex flex-col min-h-0 min-w-0">
                {topbar}
                {scrollableContent}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <div className="flex-1 flex flex-col min-h-0 min-w-0 lg:hidden">
          {topbar}
          {scrollableContent}
        </div>
      </div>
    </div>
  );
}
