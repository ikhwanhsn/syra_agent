import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { WalletContextProvider } from "@/contexts/WalletContext";
import { ConnectModalProvider } from "@/contexts/ConnectModalContext";
import { AgentWalletProvider } from "@/contexts/AgentWalletContext";
import Index from "./pages/Index";
import MarketplacePrompts from "./pages/MarketplacePrompts";
import MarketplaceAgents from "./pages/MarketplaceAgents";
import ShareableChatRoute from "./pages/ShareableChatRoute";
import DashboardLayout from "./pages/DashboardLayout";
import Leaderboard from "./pages/Leaderboard";
import TradingAgentExperiment from "./pages/TradingAgentExperiment";
import TradingAgentExperimentAgentProfile from "./pages/TradingAgentExperimentAgentProfile";
import ArbitrageExperiment from "./pages/ArbitrageExperiment";
import DashboardOverview from "./pages/DashboardOverview";
import {
  LegacyMarketplaceRedirect,
  LegacyTradingExperimentAgentRedirect,
  LegacyTradingExperimentPageRedirect,
} from "./pages/LegacyDashboardRedirects";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletContextProvider>
      <ConnectModalProvider>
        <AgentWalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace/*" element={<LegacyMarketplaceRedirect />} />
                <Route path="/c/:shareId" element={<ShareableChatRoute />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<DashboardOverview embedded />} />
                  <Route path="marketplace" element={<Outlet />}>
                    <Route index element={<Navigate to="prompts" replace />} />
                    <Route path="prompts" element={<MarketplacePrompts />} />
                    <Route path="agents" element={<MarketplaceAgents />} />
                    <Route path="tools" element={<Navigate to="/dashboard/marketplace/prompts" replace />} />
                    <Route path="more" element={<Navigate to="/dashboard/marketplace/prompts" replace />} />
                  </Route>
                  <Route path="leaderboard" element={<Leaderboard embedded />} />
                  <Route path="trading-experiment" element={<TradingAgentExperiment embedded />} />
                  <Route
                    path="trading-experiment/agent/:agentId"
                    element={<TradingAgentExperimentAgentProfile embedded />}
                  />
                  <Route path="arbitrage-experiment" element={<ArbitrageExperiment embedded />} />
                </Route>
                <Route path="/leaderboard" element={<Navigate to="/dashboard/leaderboard" replace />} />
                <Route path="/experiment/trading-agent" element={<LegacyTradingExperimentPageRedirect />} />
                <Route
                  path="/experiment/trading-agent/agent/:agentId"
                  element={<LegacyTradingExperimentAgentRedirect />}
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AgentWalletProvider>
      </ConnectModalProvider>
    </WalletContextProvider>
  </QueryClientProvider>
);

export default App;
