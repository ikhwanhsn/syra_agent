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
import DashboardOverview from "@/pages/dashboard/Overview";
import MarketsPage from "@/pages/dashboard/Markets";
import WalletPage from "@/pages/dashboard/Wallet";
import SimulatorPage from "@/pages/dashboard/Simulator";
import InsightsPage from "@/pages/dashboard/Insights";
import TokenDetailPage from "@/pages/token/TokenDetail";

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

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="markets" element={<MarketsPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="quote" element={<Navigate to="/dashboard/simulator" replace />} />
              <Route path="borrow" element={<Navigate to="/dashboard/simulator?tab=borrow" replace />} />
              <Route path="watchlist" element={<Navigate to="/dashboard/markets?tab=watchlist" replace />} />
              <Route path="compare" element={<Navigate to="/dashboard/markets?tab=compare" replace />} />
              <Route path="floor-scanner" element={<Navigate to="/dashboard/markets?tab=floor-scanner" replace />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="activity" element={<Navigate to="/dashboard/insights" replace />} />
              <Route path="whales" element={<Navigate to="/dashboard/insights?tab=whales" replace />} />
              <Route path="signals" element={<Navigate to="/dashboard/insights?tab=signals" replace />} />
              <Route path="dca" element={<Navigate to="/dashboard/simulator?tab=dca" replace />} />
              <Route path="news" element={<Navigate to="/dashboard/insights?tab=news" replace />} />
            </Route>
            <Route path="/uponly/overview" element={<Navigate to="/" replace />} />
            <Route path="/uponly/fund" element={<Navigate to="/" replace />} />
            <Route path="/uponly/rise" element={<Navigate to="/dashboard" replace />} />
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
);

export default App;
