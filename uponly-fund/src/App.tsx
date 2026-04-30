import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TerminalPage from "@/pages/dashboard/Terminal";
import MarketsPage from "@/pages/dashboard/Markets";
import WalletPage from "@/pages/dashboard/Wallet";
import SimulatorPage from "@/pages/dashboard/Simulator";
import InsightsPage from "@/pages/dashboard/Insights";
import TokenDetailPage from "@/pages/token/TokenDetail";
import { getRiseAggregate, getRiseMarkets } from "@/lib/riseDashboardApi";
import { LanguageProvider } from "@/lib/LanguageContext";

const queryClient = new QueryClient();

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

function DashboardDataWarmup() {
  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ["rise-aggregate"],
      queryFn: ({ signal }) => getRiseAggregate(signal),
      staleTime: 60_000,
    });
    void queryClient.prefetchQuery({
      queryKey: ["rise-markets", 1, 10, false, false, 0],
      queryFn: ({ signal }) => getRiseMarkets({ page: 1, limit: 10 }, signal),
      staleTime: 60_000,
    });
  }, []);
  return null;
}

const App = () => (
  <LanguageProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DashboardDataWarmup />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
            <Route path="/" element={<Navigate to="/terminal" replace />} />
            <Route path="/landing" element={<Index />} />
            <Route element={<DashboardLayout />}>
              <Route path="/terminal" element={<TerminalPage />} />
              <Route path="/market" element={<MarketsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
              <Route path="/insights" element={<InsightsPage />} />
            </Route>
            <Route path="/dashboard" element={<Navigate to="/terminal" replace />} />
            <Route path="/dashboard/overview" element={<Navigate to="/terminal" replace />} />
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
            <Route path="/token/:address" element={<TokenDetailPage />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            <ScrollToTopButton />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </LanguageProvider>
);

export default App;
