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
import { LandingRouteFallback, NotFoundRouteFallback } from "@/components/dashboard/DashboardOutletSkeleton";

/**
 * Route-level code splitting. Dashboard lazy routes suspend inside `DashboardLayout`
 * so sidebar/header stay mounted; fallbacks use `DashboardOutletSkeleton` per path.
 * `/landing` and `*` wrap their own `Suspense` boundaries.
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

const App = () => (
  <LanguageProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route
                path="/landing"
                element={
                  <Suspense fallback={<LandingRouteFallback />}>
                    <Index />
                  </Suspense>
                }
              />
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
              <Route
                path="*"
                element={
                  <Suspense fallback={<NotFoundRouteFallback />}>
                    <NotFound />
                  </Suspense>
                }
              />
            </Routes>
            <ScrollToTopButton />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </LanguageProvider>
);

export default App;
