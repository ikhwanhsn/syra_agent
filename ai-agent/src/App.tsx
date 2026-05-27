import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletContextProvider } from "@/contexts/WalletContext";
import { SyraAuthProvider } from "@/contexts/SyraAuthContext";
import { ConnectModalProvider } from "@/contexts/ConnectModalContext";
import { AgentWalletProvider } from "@/contexts/AgentWalletContext";
import Index from "./pages/Index";
import ShareableChatRoute from "./pages/ShareableChatRoute";
import DashboardLayout from "./pages/DashboardLayout";
import TradingAgentExperiment from "./pages/TradingAgentExperiment";
import TradingAgentExperimentAgentProfile from "./pages/TradingAgentExperimentAgentProfile";
import ArbitrageExperiment from "./pages/ArbitrageExperiment";
import Alpha from "./pages/Alpha";
import AlphaAccountDetail from "./pages/AlphaAccountDetail";
import DashboardOverview from "./pages/DashboardOverview";
import DashboardAgents from "./pages/DashboardAgents";
import DashboardAgentDetail from "./pages/DashboardAgentDetail";
import DashboardSettings from "./pages/DashboardSettings";
import InternalTeamAgentsMonitor from "./pages/InternalTeamAgentsMonitor";
import InternalAgentDetailPage from "./pages/InternalAgentDetailPage";
import LpAgentExperiment from "./pages/LpAgentExperiment";
import LpAgentExperimentAgentProfile from "./pages/LpAgentExperimentAgentProfile";
import PumpfunExperiment from "./pages/PumpfunExperiment";
import RiseExperiment from "./pages/RiseExperiment";
import MintDossier from "./pages/MintDossier";
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
      <SyraAuthProvider>
        <ConnectModalProvider>
          <AgentWalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/settings" element={<Index />} />
                <Route path="/marketplace/*" element={<LegacyMarketplaceRedirect />} />
                <Route path="/c/:shareId" element={<ShareableChatRoute />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<DashboardOverview embedded />} />
                  <Route path="agents" element={<DashboardAgents embedded />} />
                  <Route path="agents/:anonymousId" element={<DashboardAgentDetail embedded />} />
                  <Route path="settings" element={<DashboardSettings embedded />} />
                  <Route path="agent-setup" element={<Navigate to="/dashboard/settings" replace />} />
                  <Route path="marketplace/*" element={<Navigate to="/dashboard/overview" replace />} />
                  <Route path="trading-experiment" element={<TradingAgentExperiment embedded />} />
                  <Route
                    path="trading-experiment/agent/:agentId"
                    element={<TradingAgentExperimentAgentProfile embedded />}
                  />
                  <Route path="arbitrage-experiment" element={<ArbitrageExperiment embedded />} />
                  <Route path="lp-experiment/history/:experimentId" element={<Navigate to="/dashboard/lp-experiment" replace />} />
                  <Route path="lp-experiment/history" element={<Navigate to="/dashboard/lp-experiment" replace />} />
                  <Route path="lp-experiment" element={<LpAgentExperiment embedded />} />
                  <Route path="lp-experiment/agent/:agentId" element={<LpAgentExperimentAgentProfile embedded />} />
                  <Route path="alpha/x/:username" element={<AlphaAccountDetail />} />
                  <Route path="alpha" element={<Alpha />} />
                  <Route path="token-check" element={<MintDossier embedded />} />
                  <Route path="dossier" element={<Navigate to="/dashboard/token-check" replace />} />
                  <Route path="pumpfun-experiment" element={<PumpfunExperiment embedded />} />
                  <Route path="rise-experiment" element={<RiseExperiment embedded />} />
                  <Route path="internal-team-agents" element={<InternalTeamAgentsMonitor />} />
                  <Route path="internal-team-agents/:agentSlug" element={<InternalAgentDetailPage />} />
                  <Route
                    path="internal-hackathons"
                    element={<Navigate to="/dashboard/internal-team-agents#hackathon-board" replace />}
                  />
                </Route>
                <Route path="/leaderboard" element={<Navigate to="/dashboard/overview" replace />} />
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
      </SyraAuthProvider>
    </WalletContextProvider>
  </QueryClientProvider>
);

export default App;
