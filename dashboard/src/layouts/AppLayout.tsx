import { useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useWalletContext } from "../contexts/WalletContext";
import { ConnectWalletButton } from "../components/ConnectWalletButton";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";
import {
  SIDEBAR_AUTO_SAVE_ID,
  SIDEBAR_PANEL,
  MAIN_PANEL,
} from "../lib/layoutConstants";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: "📊" },
  { to: "/research", label: "Research", icon: "🔬" },
];

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PanelLeftCloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2v-4" />
    </svg>
  );
}

function MainContent({ wallet }: { wallet: ReturnType<typeof useWalletContext> }) {
  if (wallet.canViewDashboard) {
    return (
      <>
        {wallet.canViewDashboard && !wallet.canInteract && (
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
            View only — you need the admin wallet to make changes or interact.
          </div>
        )}
        <Outlet />
      </>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[280px] w-[280px] rounded-full bg-syra-primary/10 blur-[80px] animate-gate-glow" />
        <div className="absolute right-1/4 top-1/2 h-[180px] w-[180px] rounded-full bg-syra-accent/8 blur-[60px] animate-gate-glow" style={{ animationDelay: "1s" }} />
      </div>
      <div className="relative w-full max-w-md animate-gate-scale-in rounded-2xl border border-gray-800/80 bg-syra-card/90 p-8 shadow-xl backdrop-blur-sm sm:p-10">
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-syra-primary/50 to-transparent" />
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-syra-primary/20 to-syra-accent/20 ring-1 ring-white/10 animate-wallet-float"
          style={{ animationDelay: "0.2s" }}
        >
          <svg className="h-10 w-10 text-syra-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        </div>
        {!wallet.connected ? (
          <>
            <h2 className="animate-gate-fade-in text-2xl font-bold text-white sm:text-3xl" style={{ animationDelay: "0.25s", animationFillMode: "both" }}>
              Connect your wallet
            </h2>
            <p className="mt-3 animate-gate-fade-in text-gray-400 leading-relaxed" style={{ animationDelay: "0.35s", animationFillMode: "both" }}>
              To access this dashboard you need to hold at least <span className="font-semibold text-white">1,000,000 SYRA</span>. Connect your Solana wallet to check your balance.
            </p>
          </>
        ) : (
          <>
            <h2 className="animate-gate-fade-in text-2xl font-bold text-white sm:text-3xl" style={{ animationDelay: "0.25s", animationFillMode: "both" }}>
              Hold SYRA to access
            </h2>
            <p className="mt-3 animate-gate-fade-in text-gray-400 leading-relaxed" style={{ animationDelay: "0.35s", animationFillMode: "both" }}>
              To access this dashboard you need to hold at least <span className="font-semibold text-white">1,000,000 SYRA</span> in your wallet.
            </p>
            {wallet.syraBalance === null ? (
              <p className="mt-4 animate-gate-fade-in text-sm text-gray-500" style={{ animationDelay: "0.45s", animationFillMode: "both" }}>Checking SYRA balance…</p>
            ) : (
              <p className="mt-4 animate-gate-fade-in text-sm text-gray-500" style={{ animationDelay: "0.45s", animationFillMode: "both" }}>
                Your balance: <span className="font-mono font-medium text-gray-300">{wallet.syraBalance.toLocaleString()} SYRA</span>
              </p>
            )}
          </>
        )}
        <div className="mt-8 animate-gate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
          <div className="inline-block rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] animate-pulse-soft">
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const location = useLocation();
  const wallet = useWalletContext();

  const closeSidebar = () => setSidebarOpen(false);

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      sidebarPanelRef.current?.expand();
    } else {
      setSidebarOpen(true);
    }
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-800 px-4 pt-[env(safe-area-inset-top)] lg:pt-0">
        <div className="flex items-center gap-2">
          <img src="/images/logo.jpg" alt="Syra" className="h-8 w-auto object-contain" />
          <span className="rounded bg-syra-primary/20 px-1.5 py-0.5 text-xs font-medium text-syra-primary">
            Internal
          </span>
        </div>
        <button
          type="button"
          onClick={closeSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 lg:hidden"
          aria-label="Close menu"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={closeSidebar}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-syra-primary/15 text-syra-primary" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
              )
            }
          >
            <span className="text-base opacity-90" aria-hidden>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-800 p-3 shrink-0 space-y-2">
        <p className="text-xs text-gray-500">Dashboard & tools</p>
        <a
          href="https://t.me/ikhwanhsn"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeSidebar}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-syra-primary/50 hover:bg-gray-800 hover:text-white"
        >
          <span aria-hidden>✉️</span>
          Contact
        </a>
      </div>
    </>
  );

  return (
    <div className="flex h-screen h-[100dvh] max-h-screen overflow-hidden bg-syra-bg flex-col">
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 max-w-[min(320px,85vw)] flex-col border-r border-gray-800 bg-syra-card transition-transform duration-300 ease-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-gray-800 bg-syra-card px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="truncate text-base font-semibold text-white">
            {location.pathname === "/research" ? "Research" : "Overview"}
          </span>
        </div>
        <ConnectWalletButton />
      </header>

      {/* Desktop: resizable layout (sidebar + handle + main); only main content scrolls */}
      <div className="hidden lg:flex flex-1 min-h-0 min-w-0 overflow-hidden">
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
            <aside className="flex h-full flex-col border-r border-gray-800 bg-syra-card min-w-0">
              <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-800 px-4">
                <div className="flex items-center gap-2">
                  <img src="/images/logo.jpg" alt="Syra" className="h-8 w-auto object-contain" />
                  <span className="rounded bg-syra-primary/20 px-1.5 py-0.5 text-xs font-medium text-syra-primary">Internal</span>
                </div>
                <button
                  type="button"
                  onClick={() => sidebarPanelRef.current?.collapse()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                  aria-label="Hide sidebar"
                  title="Hide sidebar"
                >
                  <PanelLeftCloseIcon className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 min-h-0">
                {navItems.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive ? "bg-syra-primary/15 text-syra-primary" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                      )
                    }
                  >
                    <span className="text-base opacity-90" aria-hidden>{icon}</span>
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-gray-800 p-3 shrink-0 space-y-2">
                <p className="text-xs text-gray-500">Dashboard & tools</p>
                <a
                  href="https://t.me/ikhwanhsn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-syra-primary/50 hover:bg-gray-800 hover:text-white"
                >
                  <span aria-hidden>✉️</span>
                  Contact
                </a>
              </div>
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-gray-800" />
          <ResizablePanel defaultSize={MAIN_PANEL.defaultSize} minSize={MAIN_PANEL.minSize} className="min-w-0">
            <div className="flex h-full flex-col min-w-0">
              <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-800 bg-syra-card px-4">
                {sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => sidebarPanelRef.current?.expand()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                    aria-label="Show sidebar"
                    title="Show sidebar"
                  >
                    <MenuIcon className="h-5 w-5" />
                  </button>
                )}
                <div className="flex-1 min-w-0" />
                <ConnectWalletButton />
              </header>
              <main className="flex-1 min-h-0 overflow-auto">
                <MainContent wallet={wallet} />
              </main>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: main content (only this area scrolls; navbar is fixed above) */}
      <main className="min-h-0 min-w-0 flex-1 overflow-auto pt-14 pl-0 lg:hidden">
        <MainContent wallet={wallet} />
      </main>
    </div>
  );
}
