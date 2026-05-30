import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AppProviders } from "@/components/providers/AppProviders";
import Alpha from "@/pages/Alpha";
import ArbitrageExperiment from "@/pages/ArbitrageExperiment";
import AssetDetailPage from "@/pages/AssetDetailPage";
import AssetsPage from "@/pages/AssetsPage";
import DashboardAgentDetail from "@/pages/DashboardAgentDetail";
import DashboardAgents from "@/pages/DashboardAgents";
import DashboardLayout from "@/pages/DashboardLayout";
import DashboardOverview from "@/pages/DashboardOverview";
import DashboardSettings from "@/pages/DashboardSettings";
import AgentWalletPage from "@/pages/AgentWalletPage";
import Index from "@/pages/Index";
import InternalAgentDetailPage from "@/pages/InternalAgentDetailPage";
import InternalTeamAgentsMonitor from "@/pages/InternalTeamAgentsMonitor";
import {
  LegacyDashboardPrefixRedirect,
  LegacyAgentWalletRedirect,
  LegacyMarketplaceRedirect,
  LegacyTradingExperimentAgentRedirect,
  LegacyTradingExperimentPageRedirect,
} from "@/pages/LegacyDashboardRedirects";
import LpAgentExperiment from "@/pages/LpAgentExperiment";
import LpAgentExperimentAgentProfile from "@/pages/LpAgentExperimentAgentProfile";
import NotFound from "@/pages/NotFound";
import PumpfunExperiment from "@/pages/PumpfunExperiment";
import RiseExperiment from "@/pages/RiseExperiment";
import ShareableChatRoute from "@/pages/ShareableChatRoute";
import TradingAgentExperiment from "@/pages/TradingAgentExperiment";
import TradingAgentExperimentAgentProfile from "@/pages/TradingAgentExperimentAgentProfile";
import PlaygroundBatchTest from "@/pages/playground/BatchTest";
import PlaygroundExamples from "@/pages/playground/Examples";
import PlaygroundExamplesGroup, { ExamplesLegacyGroupRedirect } from "@/pages/playground/ExamplesGroup";
import PlaygroundExplorer from "@/pages/playground/Explorer";
import PlaygroundExplorerDetail from "@/pages/playground/ExplorerDetail";
import PlaygroundFormatValidator from "@/pages/playground/FormatValidator";
import PlaygroundIndex from "@/pages/playground/Index";
import StakingDashboardPage from "@/pages/staking/StakingDashboardPage";
import StakingDetailsPage from "@/pages/staking/StakingDetailsPage";
import StreamflowPage from "@/pages/staking/StreamflowPage";

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<Index />} />
          <Route path="/settings" element={<Index />} />
          <Route path="/wallet" element={<AgentWalletPage />} />
          <Route path="/agent-wallet" element={<LegacyAgentWalletRedirect />} />
          <Route path="/c/:shareId" element={<ShareableChatRoute />} />

          <Route element={<DashboardLayoutRoute />}>
            <Route path="/overview" element={<DashboardOverview />} />
            <Route path="/agent-setup" element={<DashboardSettings />} />
            <Route path="/agents" element={<DashboardAgents />} />
            <Route path="/agents/:anonymousId" element={<DashboardAgentDetail />} />
            <Route path="/alpha" element={<Alpha />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/assets/:assetKey" element={<AssetDetailPage />} />
            <Route path="/arbitrage-experiment" element={<ArbitrageExperiment />} />
            <Route path="/pumpfun-experiment" element={<PumpfunExperiment />} />
            <Route path="/rise-experiment" element={<RiseExperiment />} />
            <Route path="/lp-experiment" element={<LpAgentExperiment />} />
            <Route path="/lp-experiment/agent/:agentId" element={<LpAgentExperimentAgentProfile />} />
            <Route path="/trading-experiment" element={<TradingAgentExperiment />} />
            <Route path="/trading-experiment/agent/:agentId" element={<TradingAgentExperimentAgentProfile />} />
            <Route path="/internal-team-agents" element={<InternalTeamAgentsMonitor />} />
            <Route path="/internal-team-agents/:agentSlug" element={<InternalAgentDetailPage />} />
          </Route>

          <Route path="/playground" element={<PlaygroundIndex />} />
          <Route path="/playground/s/:slug" element={<PlaygroundIndex />} />
          <Route path="/playground/batch-test" element={<PlaygroundBatchTest />} />
          <Route path="/playground/examples" element={<PlaygroundExamples />} />
          <Route path="/playground/examples/:catalog/:groupSlug" element={<PlaygroundExamplesGroup />} />
          <Route path="/playground/examples/:groupSlug" element={<ExamplesLegacyGroupRedirect />} />
          <Route path="/playground/explorer" element={<PlaygroundExplorer />} />
          <Route path="/playground/explorer/:slug" element={<PlaygroundExplorerDetail />} />
          <Route path="/playground/format-test" element={<PlaygroundFormatValidator />} />

          <Route path="/staking" element={<StreamflowPage />} />
          <Route path="/staking/dashboard" element={<StakingDashboardPage />} />
          <Route path="/staking/details" element={<StakingDetailsPage />} />

          <Route path="/marketplace" element={<LegacyMarketplaceRedirect />} />
          <Route path="/marketplace/*" element={<LegacyMarketplaceRedirect />} />
          <Route path="/leaderboard" element={<Navigate to="/overview" replace />} />
          <Route path="/dashboard/*" element={<LegacyDashboardPrefixRedirect />} />
          <Route path="/experiment/trading-agent" element={<LegacyTradingExperimentPageRedirect />} />
          <Route path="/experiment/trading-agent/agent/:agentId" element={<LegacyTradingExperimentAgentRedirect />} />
          <Route path="/lp-experiment/history" element={<Navigate to="/lp-experiment" replace />} />
          <Route path="/lp-experiment/history/:id" element={<Navigate to="/lp-experiment" replace />} />
          <Route path="/alpha/x/:username" element={<Navigate to="/alpha" replace />} />
          <Route path="/token-check" element={<Navigate to="/assets" replace />} />
          <Route path="/dossier" element={<Navigate to="/assets" replace />} />
          <Route path="/internal-hackathons" element={<Navigate to="/internal-team-agents" replace />} />
          <Route path="/staking/dashboard/internal" element={<Navigate to="/staking/dashboard" replace />} />
          <Route path="/mpp" element={<Navigate to="/playground" replace />} />
          <Route path="/playground/mpp" element={<Navigate to="/playground" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </AppProviders>
);

export default App;
