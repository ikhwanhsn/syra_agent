import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { LanguageProvider } from "@/lib/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level code splitting. Each page is a separate chunk so the initial
 * dashboard JS payload only contains shell + the landing page's first route.
 * Subsequent navigations stream in their chunk on demand (~30-80kb each).
 */
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TerminalPage = lazy(() => import("./pages/dashboard/Terminal"));
const TrendingPage = lazy(() => import("./pages/dashboard/Trending"));
const MarketsPage = lazy(() => import("./pages/dashboard/Markets"));
const WalletPage = lazy(() => import("./pages/dashboard/Wallet"));
const SimulatorPage = lazy(() => import("./pages/dashboard/Simulator"));
const InsightsPage = lazy(() => import("./pages/dashboard/Insights"));
const TokenDetailPage = lazy(() => import("./pages/token/TokenDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      // Dashboard hits RISE via Syra API; focus toggles were causing bursty duplicate refetches.
      refetchOnWindowFocus: false,
      // Suspend polling when the tab is in the background so users don't get
      // billed for traffic they aren't consuming.
      refetchIntervalInBackground: false,
    },
  },
});

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/** Layout-matched skeleton for the lazy route boundary. Avoids flashing white. */
function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-7 w-72 max-w-full rounded" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-[28rem] rounded-2xl" />
    </div>
  );
}

const App = () => (
  <LanguageProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/landing" element={<Index />} />
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<TrendingPage />} />
                  <Route path="/terminal" element={<TerminalPage />} />
                  <Route path="/market" element={<MarketsPage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/simulator" element={<SimulatorPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/token/:address" element={<TokenDetailPage />} />
                </Route>
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/dashboard/overview" element={<Navigate to="/" replace />} />
                <Route path="/dashboard/markets" element={<Navigate to="/market" replace />} />
                <Route path="/dashboard/wallet" element={<Navigate to="/wallet" replace />} />
                <Route path="/dashboard/simulator" element={<Navigate to="/simulator" replace />} />
                <Route path="/dashboard/insights" element={<Navigate to="/insights" replace />} />
                <Route path="/dashboard/quote" element={<Navigate to="/simulator" replace />} />
                <Route path="/dashboard/borrow" element={<Navigate to="/simulator?tab=borrow" replace />} />
                <Route path="/dashboard/watchlist" element={<Navigate to="/market?tab=watchlist" replace />} />
                <Route path="/dashboard/compare" element={<Navigate to="/market?tab=compare" replace />} />
                <Route path="/dashboard/floor-scanner" element={<Navigate to="/market?tab=floor-scanner" replace />} />
                <Route path="/dashboard/activity" element={<Navigate to="/insights" replace />} />
                <Route path="/dashboard/whales" element={<Navigate to="/insights?tab=whales" replace />} />
                <Route path="/dashboard/signals" element={<Navigate to="/insights?tab=signals" replace />} />
                <Route path="/dashboard/dca" element={<Navigate to="/simulator?tab=dca" replace />} />
                <Route path="/dashboard/news" element={<Navigate to="/insights?tab=news" replace />} />
                <Route path="/uponly/overview" element={<Navigate to="/" replace />} />
                <Route path="/uponly/fund" element={<Navigate to="/" replace />} />
                <Route path="/uponly/rise" element={<Navigate to="/terminal" replace />} />
                <Route path="/tranche" element={<Navigate to="/" replace />} />
                <Route path="/treasury" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ScrollToTopButton />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </LanguageProvider>
);

export default App;
