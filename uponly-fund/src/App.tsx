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
import QuotePage from "@/pages/dashboard/Quote";
import BorrowPage from "@/pages/dashboard/Borrow";
import WatchlistPage from "@/pages/dashboard/Watchlist";
import ComparePage from "@/pages/dashboard/Compare";
import FloorScannerPage from "@/pages/dashboard/FloorScanner";
import ActivityPage from "@/pages/dashboard/Activity";
import WhalesPage from "@/pages/dashboard/Whales";
import SignalsPage from "@/pages/dashboard/Signals";
import DcaPage from "@/pages/dashboard/DCA";
import NewsPage from "@/pages/dashboard/News";

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
              <Route path="quote" element={<QuotePage />} />
              <Route path="borrow" element={<BorrowPage />} />
              <Route path="watchlist" element={<WatchlistPage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="floor-scanner" element={<FloorScannerPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="whales" element={<WhalesPage />} />
              <Route path="signals" element={<SignalsPage />} />
              <Route path="dca" element={<DcaPage />} />
              <Route path="news" element={<NewsPage />} />
            </Route>
            <Route path="/uponly/overview" element={<Navigate to="/" replace />} />
            <Route path="/uponly/fund" element={<Navigate to="/" replace />} />
            <Route path="/uponly/rise" element={<Navigate to="/dashboard" replace />} />
            <Route path="/tranche" element={<Navigate to="/" replace />} />
            <Route path="/treasury" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ScrollToTopButton />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
