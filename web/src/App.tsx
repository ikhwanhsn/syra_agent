import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AdminDashboardGate } from "@/components/dashboard/AdminDashboardGate";
import { MachineMoneyPageGate } from "@/components/dashboard/MachineMoneyPageGate";
import { getDashboardPillarNavItem } from "@/lib/dashboardPillarNav";
import { QwertiAgentIntegration } from "@/components/qwerti/QwertiAgentIntegration";
import { AppProviders } from "@/components/providers/AppProviders";
import ArbitrageExperiment from "@/pages/ArbitrageExperiment";
import AssetDetailPage from "@/pages/AssetDetailPage";
import AssetsPage from "@/pages/AssetsPage";
import DashboardLayout from "@/pages/DashboardLayout";
import DashboardOverview from "@/pages/DashboardOverview";
import DashboardSettings from "@/pages/DashboardSettings";
import AgentWalletPage from "@/pages/AgentWalletPage";
import Index from "@/pages/Index";
import InternalTeamAgentsMonitor from "@/pages/InternalTeamAgentsMonitor";
import InternalWalletsPage from "@/pages/InternalWalletsPage";
import InternalAgentDetailPage from "@/pages/InternalAgentDetailPage";
import { LegacyInternalTeamAgentsRedirect } from "@/pages/LegacyInternalRedirect";
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
import PumpfunAnalyzer from "@/pages/PumpfunAnalyzer";
import PumpfunCallPage from "@/pages/PumpfunCallPage";
import ShareableChatRoute from "@/pages/ShareableChatRoute";
import TradingAgentExperiment from "@/pages/TradingAgentExperiment";
import TradingAgentExperimentAgentProfile from "@/pages/TradingAgentExperimentAgentProfile";
import BtcPage from "@/pages/BtcPage";
import PlaygroundHub from "@/pages/playground/PlaygroundHub";
import PlaygroundShareRoute from "@/pages/playground/PlaygroundShareRoute";
import StreamflowPage from "@/pages/staking/StreamflowPage";
import StakingAdminDashboardPage from "@/pages/staking/StakingAdminDashboardPage";
import DeckPage from "@/pages/DeckPage";
import InfoPage from "@/pages/InfoPage";
import { PostStudioLayout } from "@/components/post/PostStudioLayout";
import PostPage from "@/pages/PostPage";
import PostVideoPage from "@/pages/PostVideoPage";
import PostPhotoPage from "@/pages/PostPhotoPage";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { RedirectToUponlyApp } from "@/components/marketing/RedirectToUponlyApp";
import MarketingHome from "@/pages/marketing/MarketingHome";
import MarketingBrand from "@/pages/marketing/Brand";
import MarketingIdentity from "@/pages/marketing/Identity";
import MarketingTeams from "@/pages/marketing/Teams";
import MarketingPartner from "@/pages/marketing/Partner";
import MarketingPartnerDetail from "@/pages/marketing/PartnerDetail";
import MarketingArticles from "@/pages/marketing/Articles";
import ArticlePage from "@/pages/marketing/ArticlePage";
import MarketingAnalytics from "@/pages/marketing/Analytics";
import MarketingLeaderboard from "@/pages/marketing/Leaderboard";
import MarketingPrivacyPolicy from "@/pages/marketing/PrivacyPolicy";
import MarketingTermsOfService from "@/pages/marketing/TermsOfService";
import MarketingCookiePolicy from "@/pages/marketing/CookiePolicy";
import EarnPage from "@/pages/EarnPage";
import GrowPage from "@/pages/GrowPage";
import InvestPage from "@/pages/InvestPage";
import SpendPage from "@/pages/SpendPage";
import TreasuryPage from "@/pages/TreasuryPage";
import SwapPage from "@/pages/SwapPage";
import { RedirectToS3Labs } from "@/components/marketing/RedirectToS3Labs";

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function AdminExperimentRoute({ children }: { children: ReactNode }) {
  return (
    <AdminDashboardGate featureLabel="Experiment desks">{children}</AdminDashboardGate>
  );
}

function AdminInternalRoute({ children }: { children: ReactNode }) {
  return (
    <AdminDashboardGate featureLabel="Internal hub">{children}</AdminDashboardGate>
  );
}

function MachineMoneyRoute({
  pillarId,
  children,
}: {
  pillarId: string;
  children: ReactNode;
}) {
  const pillar = getDashboardPillarNavItem(pillarId);
  return (
    <MachineMoneyPageGate
      pillarLabel={pillar?.label ?? pillarId}
      pillarTagline={pillar?.description ?? "Machine Money"}
    >
      {children}
    </MachineMoneyPageGate>
  );
}

function AppRoutes() {
  return (
    <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<Index />} />
          <Route path="/settings" element={<Index />} />
          <Route path="/wallet" element={<AgentWalletPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/earn" element={<Navigate to="/overview/earn" replace />} />
          <Route path="/treasury" element={<Navigate to="/overview/treasury" replace />} />
          <Route path="/invest" element={<Navigate to="/overview/invest" replace />} />
          <Route path="/spend" element={<Navigate to="/overview/spend" replace />} />
          <Route path="/grow" element={<Navigate to="/overview/grow" replace />} />
          <Route path="/agent-wallet" element={<LegacyAgentWalletRedirect />} />
          <Route path="/c/:shareId" element={<ShareableChatRoute />} />

          <Route element={<DashboardLayoutRoute />}>
            <Route path="/overview" element={<DashboardOverview />} />
            <Route
              path="/overview/earn"
              element={
                <MachineMoneyRoute pillarId="earn">
                  <EarnPage />
                </MachineMoneyRoute>
              }
            />
            <Route
              path="/overview/treasury"
              element={
                <MachineMoneyRoute pillarId="treasury">
                  <TreasuryPage />
                </MachineMoneyRoute>
              }
            />
            <Route
              path="/overview/invest"
              element={
                <MachineMoneyRoute pillarId="invest">
                  <InvestPage />
                </MachineMoneyRoute>
              }
            />
            <Route
              path="/overview/spend"
              element={
                <MachineMoneyRoute pillarId="spend">
                  <SpendPage />
                </MachineMoneyRoute>
              }
            />
            <Route
              path="/overview/grow"
              element={
                <MachineMoneyRoute pillarId="grow">
                  <GrowPage />
                </MachineMoneyRoute>
              }
            />
            <Route path="/agent-setup" element={<DashboardSettings />} />
            <Route path="/agents/*" element={<Navigate to="/overview" replace />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/assets/:assetKey" element={<AssetDetailPage />} />
            <Route path="/pumpfun" element={<PumpfunAnalyzer />} />
            <Route path="/pumpfun/call/:callId" element={<PumpfunCallPage />} />
            <Route
              path="/arbitrage-experiment"
              element={
                <AdminExperimentRoute>
                  <ArbitrageExperiment />
                </AdminExperimentRoute>
              }
            />
            <Route
              path="/lp-experiment"
              element={
                <AdminExperimentRoute>
                  <LpAgentExperiment />
                </AdminExperimentRoute>
              }
            />
            <Route
              path="/lp-experiment/agent/:agentId"
              element={
                <AdminExperimentRoute>
                  <LpAgentExperimentAgentProfile />
                </AdminExperimentRoute>
              }
            />
            <Route
              path="/trading-experiment"
              element={
                <AdminExperimentRoute>
                  <TradingAgentExperiment />
                </AdminExperimentRoute>
              }
            />
            <Route
              path="/trading-experiment/agent/:agentId"
              element={
                <AdminExperimentRoute>
                  <TradingAgentExperimentAgentProfile />
                </AdminExperimentRoute>
              }
            />
            <Route path="/vibe-trading" element={<Navigate to="/overview" replace />} />
            <Route path="/arena" element={<Navigate to="/overview" replace />} />
            <Route path="/spcx" element={<Navigate to="/playground" replace />} />
            <Route path="/btc" element={<BtcPage />} />
            <Route path="/hackathon" element={<RedirectToS3Labs />} />
            <Route path="/hackathon/*" element={<RedirectToS3Labs />} />
            <Route
              path="/internal"
              element={
                <AdminInternalRoute>
                  <InternalTeamAgentsMonitor />
                </AdminInternalRoute>
              }
            />
            <Route
              path="/internal/wallets"
              element={
                <AdminInternalRoute>
                  <InternalWalletsPage />
                </AdminInternalRoute>
              }
            />
            <Route
              path="/internal/:agentSlug"
              element={
                <AdminInternalRoute>
                  <InternalAgentDetailPage />
                </AdminInternalRoute>
              }
            />
            <Route path="/internal-team-agents/*" element={<LegacyInternalTeamAgentsRedirect />} />
          </Route>

          <Route path="/playground" element={<PlaygroundHub />} />
          <Route path="/playground/s/:slug" element={<PlaygroundShareRoute />} />
          <Route path="/playground/*" element={<Navigate to="/playground" replace />} />

          <Route path="/staking" element={<StreamflowPage />} />
          <Route path="/staking/admin" element={<StakingAdminDashboardPage />} />
          <Route path="/staking/dashboard" element={<Navigate to="/staking/admin" replace />} />
          <Route path="/staking/details" element={<Navigate to="/staking" replace />} />

          <Route path="/marketplace" element={<LegacyMarketplaceRedirect />} />
          <Route path="/marketplace/*" element={<LegacyMarketplaceRedirect />} />
          <Route path="/dashboard/*" element={<LegacyDashboardPrefixRedirect />} />
          <Route path="/experiment/trading-agent" element={<LegacyTradingExperimentPageRedirect />} />
          <Route path="/experiment/trading-agent/agent/:agentId" element={<LegacyTradingExperimentAgentRedirect />} />
          <Route path="/lp-experiment/history" element={<Navigate to="/lp-experiment" replace />} />
          <Route path="/lp-experiment/history/:id" element={<Navigate to="/lp-experiment" replace />} />
          <Route path="/token-check" element={<Navigate to="/assets" replace />} />
          <Route path="/dossier" element={<Navigate to="/assets" replace />} />
          <Route path="/internal-hackathons" element={<RedirectToS3Labs />} />
          <Route path="/staking/dashboard/internal" element={<Navigate to="/staking/admin" replace />} />
          <Route path="/mpp" element={<Navigate to="/playground" replace />} />
          <Route path="/playground/mpp" element={<Navigate to="/playground" replace />} />

          <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <Routes>
        <Route path="/deck" element={<DeckPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route element={<PostStudioLayout />}>
          <Route path="/post" element={<PostPage />} />
          <Route path="/post/video/:updateNumber?" element={<PostVideoPage />} />
          <Route path="/post/photo/:updateNumber?" element={<PostPhotoPage />} />
        </Route>

        <Route element={<MarketingLayout />}>
          <Route path="/home" element={<MarketingHome />} />
          <Route path="/brand" element={<MarketingBrand />} />
          <Route path="/identity" element={<MarketingIdentity />} />
          <Route path="/teams" element={<MarketingTeams />} />
          <Route path="/partner" element={<MarketingPartner />} />
          <Route path="/partner/:slug" element={<MarketingPartnerDetail />} />
          <Route path="/articles" element={<MarketingArticles />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/analytics" element={<MarketingAnalytics />} />
          <Route path="/leaderboard" element={<MarketingLeaderboard />} />
          <Route path="/privacy" element={<MarketingPrivacyPolicy />} />
          <Route path="/terms" element={<MarketingTermsOfService />} />
          <Route path="/cookies" element={<MarketingCookiePolicy />} />
          <Route path="/uponly" element={<RedirectToUponlyApp path="/" />} />
          <Route path="/uponly/overview" element={<RedirectToUponlyApp path="/uponly/overview" />} />
          <Route path="/uponly/fund" element={<RedirectToUponlyApp path="/" />} />
          <Route path="/uponly/rise" element={<RedirectToUponlyApp path="/uponly/rise" />} />
          <Route path="/rise" element={<RedirectToUponlyApp path="/" />} />
        </Route>

        <Route
          path="*"
          element={
            <AppShell>
              <QwertiAgentIntegration />
              <AppRoutes />
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  </AppProviders>
);

export default App;
