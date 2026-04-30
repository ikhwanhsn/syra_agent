import { useEffect, useMemo, useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calculator,
  Menu,
  MessageCircle,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Terminal,
  Wallet,
  XIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { RiseDashboardProvider } from "@/lib/RiseDashboardContext";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SidebarNavLink } from "./SidebarPrimitives";
import { WalletProvider } from "@/lib/WalletContext";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY, getPageTitle } from "@/lib/dashboardI18n";
import type { DashboardDictionary } from "@/lib/dashboardI18n";
import { UP_ONLY_FUND } from "@/data/upOnlyFund";
import { FUND_STATS } from "@/data/fundStats";
import { buildRiseTradeUrl } from "@/lib/riseDashboardApi";
import { RISE_UPONLY_MINT } from "@/components/rise/RiseShared";

function SidebarContent({
  dictionary,
  sidebarItems,
  currentSection,
  onNavigate,
  onCollapse,
  compact = false,
}: {
  dictionary: DashboardDictionary;
  sidebarItems: ReadonlyArray<{ to: string; label: string; icon: typeof Terminal; end?: boolean }>;
  currentSection: string;
  onNavigate?: () => void;
  onCollapse?: () => void;
  compact?: boolean;
}) {
  const riseTradeUrl = useMemo(() => buildRiseTradeUrl(RISE_UPONLY_MINT), []);
  const xUrl = UP_ONLY_FUND.twitterUrl ?? "https://x.com/uponly_fund";
  const telegramUrl = FUND_STATS.telegramUrl;

  return (
    <>
      <div className={cn("flex items-center gap-2 border-b border-sidebar-border/90 px-3 py-3", compact && "justify-center px-2 py-2.5")}>
        <div className={cn("min-w-0 flex-1", compact && "flex flex-1 justify-center")}>
          <Link to="/terminal" className={cn("block rounded-lg p-1 hover:bg-muted/30", compact && "inline-flex")} onClick={onNavigate}>
            <BrandMark compact className={cn("max-w-full", compact && "max-w-[2.25rem]")} />
          </Link>
          {!compact ? (
            <p className="px-2 pt-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {dictionary.sidebar}
            </p>
          ) : null}
        </div>
        {onCollapse ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/40", compact && "h-8 w-8")}
            onClick={onCollapse}
            title={compact ? dictionary.showSidebar : dictionary.hideSidebar}
            aria-label={compact ? dictionary.showSidebar : dictionary.hideSidebar}
          >
            {compact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3" onClick={onNavigate}>
        <div className={cn("space-y-1 px-1", compact && "px-0")}>
          {sidebarItems.map((item) => (
            <SidebarNavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              end={item.end}
              compact={compact}
            >
              {item.label}
            </SidebarNavLink>
          ))}
        </div>
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-sidebar-border/60 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/90 px-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] pt-3",
          compact && "px-1.5 pt-2.5",
        )}
      >
        {!compact ? (
          <p className="mb-2 px-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
            {dictionary.sidebarFooter.sectionLabel}
          </p>
        ) : (
          <p className="sr-only">{dictionary.sidebarFooter.sectionLabel}</p>
        )}
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-border/40 bg-background/[0.35] p-1 shadow-[0_1px_0_0_hsl(0_0%_100%_/0.04)_inset] backdrop-blur-md dark:border-border/25 dark:bg-background/[0.08] dark:shadow-[0_1px_0_0_hsl(0_0%_100%_/0.06)_inset]",
            compact ? "flex flex-col gap-0.5" : "flex flex-row gap-0.5",
          )}
        >
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <a
                href={xUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={dictionary.sidebarFooter.xAria}
                className={cn(
                  "group flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[color,transform,background-color] duration-150",
                  "hover:bg-muted/55 hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  compact && "min-h-12",
                )}
              >
                <XIcon className="h-[18px] w-[18px] shrink-0 opacity-90 transition-transform duration-150 group-hover:scale-[1.06] group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
              </a>
            </TooltipTrigger>
            <TooltipContent side={compact ? "right" : "top"} sideOffset={8} className="max-w-[14rem] rounded-lg border border-border/60 bg-popover px-2.5 py-1.5 text-xs font-medium shadow-lg">
              {dictionary.sidebarFooter.xAria}
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={dictionary.sidebarFooter.telegramAria}
                className={cn(
                  "group flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[color,transform,background-color] duration-150",
                  "hover:bg-muted/55 hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  compact && "min-h-12",
                )}
              >
                <MessageCircle className="h-[18px] w-[18px] shrink-0 opacity-90 transition-transform duration-150 group-hover:scale-[1.06] group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
              </a>
            </TooltipTrigger>
            <TooltipContent side={compact ? "right" : "top"} sideOffset={8} className="max-w-[14rem] rounded-lg border border-border/60 bg-popover px-2.5 py-1.5 text-xs font-medium shadow-lg">
              {dictionary.sidebarFooter.telegramAria}
            </TooltipContent>
          </Tooltip>
          {riseTradeUrl ? (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <a
                  href={riseTradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={dictionary.sidebarFooter.riseTradeAria}
                  className={cn(
                    "group flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[color,transform,background-color] duration-150",
                    "hover:bg-muted/55 hover:text-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    compact && "min-h-12",
                  )}
                >
                  <ArrowUpRight className="h-[18px] w-[18px] shrink-0 opacity-90 transition-transform duration-150 group-hover:scale-[1.06] group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                </a>
              </TooltipTrigger>
              <TooltipContent side={compact ? "right" : "top"} sideOffset={8} className="max-w-[14rem] rounded-lg border border-border/60 bg-popover px-2.5 py-1.5 text-xs font-medium shadow-lg">
                {dictionary.sidebarFooter.riseTradeAria}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const dictionary = useMemo(() => DASHBOARD_COPY[language], [language]);
  const sidebarItems = useMemo(
    () => [
      { to: "/terminal", label: dictionary.nav.terminal, icon: Terminal, end: true },
      { to: "/market", label: dictionary.nav.market, icon: BarChart3 },
      { to: "/simulator", label: dictionary.nav.simulator, icon: Calculator },
      { to: "/insights", label: dictionary.nav.insights, icon: Activity },
      { to: "/wallet", label: dictionary.nav.wallet, icon: Wallet },
    ],
    [dictionary],
  );
  const pageTitle = useMemo(() => getPageTitle(pathname, dictionary.pages), [pathname, dictionary.pages]);
  const isDark = resolvedTheme !== "light";
  const contentShell = "mx-auto w-full min-w-0 max-w-[1800px] px-3.5 min-[400px]:px-4 sm:px-5 lg:px-7 xl:px-8";

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <WalletProvider>
      <RiseDashboardProvider>
        <div className="h-dvh min-h-dvh max-h-dvh overflow-hidden bg-background">
          <div className="flex h-full min-h-0 min-w-0">
          {sidebarOpen ? (
            <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
          ) : null}
          <aside
            className={cn(
              "fixed left-0 top-0 z-40 flex h-dvh w-[min(290px,calc(100vw-1rem))] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:hidden",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <SidebarContent dictionary={dictionary} sidebarItems={sidebarItems} currentSection={pageTitle} onNavigate={() => setSidebarOpen(false)} />
          </aside>

          <div className="hidden min-h-0 flex-1 lg:flex">
            <ResizablePanelGroup direction="horizontal" autoSaveId="uof-dashboard-sidebar-v1">
              <ResizablePanel
                ref={sidebarPanelRef}
                defaultSize={22}
                minSize={16}
                maxSize={32}
                collapsible
                collapsedSize={6}
                onCollapse={() => setSidebarCollapsed(true)}
                onExpand={() => setSidebarCollapsed(false)}
                className={cn(sidebarCollapsed && "min-w-0")}
              >
                <aside className="flex h-full min-w-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
                  <SidebarContent
                    dictionary={dictionary}
                    sidebarItems={sidebarItems}
                    currentSection={pageTitle}
                    onCollapse={() => (sidebarCollapsed ? sidebarPanelRef.current?.expand() : sidebarPanelRef.current?.collapse())}
                    compact={sidebarCollapsed}
                  />
                </aside>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-border" />
              <ResizablePanel defaultSize={78} minSize={68} className="min-w-0">
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-border/80 bg-background/85 px-3 py-2 backdrop-blur-xl sm:px-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground sm:text-base">{pageTitle}</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div
                        className="inline-flex h-9 items-center rounded-md border border-border/60 bg-background/70 p-0.5"
                        role="group"
                        aria-label="Language switcher"
                      >
                        <Button
                          type="button"
                          variant={language === "en" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 px-2 text-[11px] font-semibold"
                          onClick={() => setLanguage("en")}
                          aria-pressed={language === "en"}
                        >
                          EN
                        </Button>
                        <Button
                          type="button"
                          variant={language === "zh" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 px-2 text-[11px] font-semibold"
                          onClick={() => setLanguage("zh")}
                          aria-pressed={language === "zh"}
                        >
                          中文
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        title={isDark ? dictionary.lightMode : dictionary.darkMode}
                        aria-label={isDark ? dictionary.switchToLightMode : dictionary.switchToDarkMode}
                      >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                      <ConnectWalletButton />
                    </div>
                  </header>
                  <div className="min-h-0 flex-1 overflow-auto overflow-x-hidden">
                    <div className={cn(contentShell, "py-4 sm:py-5 lg:py-6")}>
                      <Outlet />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:hidden">
            <header className="flex min-h-12 items-center justify-between gap-2 border-b border-border/80 bg-background/85 px-2 py-2 backdrop-blur-xl">
              <div className="flex min-w-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSidebarOpen(true)}
                  title={dictionary.openMenu}
                  aria-label={dictionary.openMenu}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <p className="truncate text-sm font-semibold text-foreground">{pageTitle}</p>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="inline-flex h-9 items-center rounded-md border border-border/60 bg-background/70 p-0.5"
                  role="group"
                  aria-label="Language switcher"
                >
                  <Button
                    type="button"
                    variant={language === "en" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-[11px] font-semibold"
                    onClick={() => setLanguage("en")}
                    aria-pressed={language === "en"}
                  >
                    EN
                  </Button>
                  <Button
                    type="button"
                    variant={language === "zh" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-[11px] font-semibold"
                    onClick={() => setLanguage("zh")}
                    aria-pressed={language === "zh"}
                  >
                    中文
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  title={isDark ? dictionary.lightMode : dictionary.darkMode}
                  aria-label={isDark ? dictionary.switchToLightMode : dictionary.switchToDarkMode}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <ConnectWalletButton />
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-auto overflow-x-hidden">
              <div className={cn(contentShell, "py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]")}>
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
      </RiseDashboardProvider>
    </WalletProvider>
  );
}
