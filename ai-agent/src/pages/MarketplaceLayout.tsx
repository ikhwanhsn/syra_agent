import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, NavLink } from "react-router-dom";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { FileText, Bot, Wrench, Puzzle, ArrowLeft, Moon, Sun, PanelLeftClose, PanelLeft, Menu, Twitter, Send, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { SIDEBAR_PANEL, MAIN_PANEL, SIDEBAR_AUTO_SAVE_ID } from "@/lib/layoutConstants";

const SIDEBAR_SECTIONS = [
  { path: "prompts", label: "Prompts", icon: FileText },
  { path: "agents", label: "Agents", icon: Bot },
  { path: "tools", label: "Tools & integrations", icon: Wrench },
  { path: "more", label: "More", icon: Puzzle },
] as const;

const PAGE_TITLES: Record<string, string> = {
  prompts: "Prompts",
  agents: "Agents",
  tools: "Tools & integrations",
  more: "More",
};

const CONNECT_LINKS = [
  { href: "https://x.com/syra_agent", icon: Twitter, label: "X" },
  { href: "https://t.me/syra_ai", icon: Send, label: "Telegram" },
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
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border shrink-0">
          <Link to="/" className="flex items-center gap-2 flex-1 min-w-0 no-underline text-inherit hover:opacity-90 transition-opacity">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-card shrink-0 border border-border">
              <img src="/logo.jpg" alt="Syra" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-foreground truncate">Marketplace</h1>
              <p className="text-xs text-muted-foreground truncate">{currentSection}</p>
            </div>
          </Link>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onCollapse}
              title="Hide sidebar"
              aria-label="Hide sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
      <nav className="flex-1 overflow-y-auto min-h-0 px-2" onClick={onNavigate}>
        <div className="p-2 sm:p-3 space-y-1">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            )}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to agent
          </Link>
          <div className="pt-3 pb-0.5">
            <p className="px-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sections</p>
          </div>
          <div className="space-y-0.5">
            {SIDEBAR_SECTIONS.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={`/marketplace/${path}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-left transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <div className="p-2 sm:p-3 border-t border-border shrink-0">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Connect</p>
        <div className="flex flex-wrap gap-1 px-1">
            {CONNECT_LINKS.map(({ href, icon: Icon, label: ariaLabel }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title={ariaLabel}
                aria-label={ariaLabel}
              >
                <Icon className="w-4 h-4" />
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
    <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] sm:min-h-0 shrink-0">
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
        <div className="min-w-0 hidden sm:block">
          <h1 className="text-sm font-semibold text-foreground truncate">Marketplace</h1>
          <p className="text-xs text-muted-foreground truncate">{pageTitle}</p>
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
    <div className="h-screen flex flex-col overflow-hidden bg-background min-h-0">
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
            "fixed left-0 top-0 z-40 w-[280px] max-w-[85vw] sm:max-w-[90vw] h-screen flex flex-col border-r border-border bg-card transition-transform duration-300 ease-out safe-area-top safe-area-bottom lg:hidden",
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
              <aside className="flex flex-col h-full min-w-0 bg-card border-r border-border">
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
