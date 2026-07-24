import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AdminDashboardGate } from "@/components/dashboard/AdminDashboardGate";
import { MachineMoneyPageGate } from "@/components/dashboard/MachineMoneyPageGate";
import { getDashboardPillarNavItem } from "@/lib/dashboardPillarNav";
import { QwertiAgentIntegration } from "@/components/qwerti/QwertiAgentIntegration";
import { AppProviders } from "@/components/providers/AppProviders";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import GrowthHomePage from "@/pages/GrowthHomePage";
import { RouteFallback } from "@/components/RouteFallback";

const DashboardLayout = lazy(() => import("@/pages/DashboardLayout"));
const DashboardOverview = lazy(() => import("@/pages/DashboardOverview"));
const DashboardSettings = lazy(() => import("@/pages/DashboardSettings"));
const AgentWalletPage = lazy(() => import("@/pages/AgentWalletPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const TokenPage = lazy(() => import("@/pages/TokenPage"));
const RewardsPage = lazy(() => import("@/pages/RewardsPage"));
const AssetsPage = lazy(() => import("@/pages/AssetsPage"));
const AssetDetailPage = lazy(() => import("@/pages/AssetDetailPage"));
const ShareableChatRoute = lazy(() => import("@/pages/ShareableChatRoute"));
const PumpfunAnalyzer = lazy(() => import("@/pages/PumpfunAnalyzer"));
const PumpfunCallPage = lazy(() => import("@/pages/PumpfunCallPage"));
const BtcPage = lazy(() => import("@/pages/BtcPage"));
const PlaygroundHub = lazy(() => import("@/pages/playground/PlaygroundHub"));
const PlaygroundShareRoute = lazy(() => import("@/pages/playground/PlaygroundShareRoute"));
const MarketplaceApiDetailPage = lazy(() => import("@/pages/marketplace/MarketplaceApiDetailPage"));
const StreamflowPage = lazy(() => import("@/pages/staking/StreamflowPage"));
const StakingAdminDashboardPage = lazy(() => import("@/pages/staking/StakingAdminDashboardPage"));
const EarnPage = lazy(() => import("@/pages/EarnPage"));
const EarnTokenDetailPage = lazy(() => import("@/pages/EarnTokenDetailPage"));
const LpPoolsPage = lazy(() => import("@/pages/LpPoolsPage"));
const GrowPage = lazy(() => import("@/pages/GrowPage"));
const InvestPage = lazy(() => import("@/pages/InvestPage"));
const SpendPage = lazy(() => import("@/pages/SpendPage"));
const TreasuryPage = lazy(() => import("@/pages/TreasuryPage"));
const SwapPage = lazy(() => import("@/pages/SwapPage"));
const AnsemPage = lazy(() => import("@/pages/AnsemPage"));
const ReferenceScalperPage = lazy(() => import("@/pages/ReferenceScalperPage"));

const MarketingLayout = lazy(() =>
  import("@/components/marketing/MarketingLayout").then((m) => ({ default: m.MarketingLayout })),
);
const MarketingBrand = lazy(() => import("@/pages/marketing/Brand"));
const MarketingIdentity = lazy(() => import("@/pages/marketing/Identity"));
const MarketingTeams = lazy(() => import("@/pages/marketing/Teams"));
const MarketingPartner = lazy(() => import("@/pages/marketing/Partner"));
const MarketingPartnerDetail = lazy(() => import("@/pages/marketing/PartnerDetail"));
const MarketingArticles = lazy(() => import("@/pages/marketing/Articles"));
const ArticlePage = lazy(() => import("@/pages/marketing/ArticlePage"));
const MarketingAnalytics = lazy(() => import("@/pages/marketing/Analytics"));
const MarketingLeaderboard = lazy(() => import("@/pages/marketing/Leaderboard"));
const MarketingPrivacyPolicy = lazy(() => import("@/pages/marketing/PrivacyPolicy"));
const MarketingTermsOfService = lazy(() => import("@/pages/marketing/TermsOfService"));
const MarketingCookiePolicy = lazy(() => import("@/pages/marketing/CookiePolicy"));
const DeckPage = lazy(() => import("@/pages/DeckPage"));
const InfoPage = lazy(() => import("@/pages/InfoPage"));

const LpAgentExperiment = lazy(() => import("@/pages/LpAgentExperiment"));
const LpAgentExperimentAgentProfile = lazy(() => import("@/pages/LpAgentExperimentAgentProfile"));
const BtcQuantExperiment = lazy(() => import("@/pages/BtcQuantExperiment"));
const Btc2QuantAgentExperiment = lazy(() => import("@/pages/Btc2QuantAgentExperiment"));
const Btc3MacroAgentExperiment = lazy(() => import("@/pages/Btc3MacroAgentExperiment"));
const StocksNewsExperiment = lazy(() => import("@/pages/StocksNewsExperiment"));
const MomentumRotatorExperiment = lazy(() => import("@/pages/MomentumRotatorExperiment"));
const LstLoopExperiment = lazy(() => import("@/pages/LstLoopExperiment"));
const SniperExperiment = lazy(() => import("@/pages/SniperExperiment"));
const ScalperExperiment = lazy(() => import("@/pages/ScalperExperiment"));
const MmExperiment = lazy(() => import("@/pages/MmExperiment"));
const LabsPage = lazy(() => import("@/pages/labs/LabsPage"));
const LlmPage = lazy(() => import("@/pages/llm/LlmPage"));
const OrganizePage = lazy(() => import("@/pages/organize/OrganizePage"));
const InternalTeamAgentsMonitor = lazy(() => import("@/pages/InternalTeamAgentsMonitor"));
const InternalWalletsPage = lazy(() => import("@/pages/InternalWalletsPage"));
const InternalAgentDetailPage = lazy(() => import("@/pages/InternalAgentDetailPage"));
const MultiWalletRecoverPage = lazy(() => import("@/pages/MultiWalletRecoverPage"));
const LegacyInternalTeamAgentsRedirect = lazy(() =>
  import("@/pages/LegacyInternalRedirect").then((m) => ({
    default: m.LegacyInternalTeamAgentsRedirect,
  })),
);
const LegacyDashboardPrefixRedirect = lazy(() =>
  import("@/pages/LegacyDashboardRedirects").then((m) => ({
    default: m.LegacyDashboardPrefixRedirect,
  })),
);
const LegacyAgentWalletRedirect = lazy(() =>
  import("@/pages/LegacyDashboardRedirects").then((m) => ({
    default: m.LegacyAgentWalletRedirect,
  })),
);

const PostStudioLayout = lazy(() =>
  import("@/components/post/PostStudioLayout").then((m) => ({ default: m.PostStudioLayout })),
);
const PostPage = lazy(() => import("@/pages/PostPage"));
const PostVideoPage = lazy(() => import("@/pages/PostVideoPage"));
const PostPhotoPage = lazy(() => import("@/pages/PostPhotoPage"));

function LegacyPumpfunPageRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/analyzer${search}`} replace />;
}

function LegacyPumpfunCallRedirect() {
  const { callId } = useParams<{ callId: string }>();
  return <Navigate to={`/analyzer/call/${callId ?? ""}`} replace />;
}

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
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
      pillarId={pillarId}
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
      <Route path="/" element={<GrowthHomePage />} />
      <Route path="/agent" element={<Index />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/token" element={<TokenPage />} />
      <Route path="/rewards" element={<RewardsPage />} />
      <Route path="/privacy" element={<MarketingPrivacyPolicy />} />
      <Route path="/terms" element={<MarketingTermsOfService />} />
      <Route path="/cookies" element={<MarketingCookiePolicy />} />
      <Route path="/articles" element={<MarketingArticles />} />
      <Route path="/articles/:slug" element={<ArticlePage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/metrics" element={<Navigate to="/" replace />} />
      <Route path="/ansem" element={<AnsemPage />} />
      <Route path="/reference/scalper" element={<ReferenceScalperPage />} />
      <Route path="/settings" element={<Index />} />
      <Route path="/wallet" element={<AgentWalletPage />} />
      <Route path="/swap" element={<SwapPage />} />
      <Route path="/lp" element={<LpPoolsPage />} />
      <Route path="/overview/earn" element={<Navigate to="/earn" replace />} />
      <Route path="/overview/treasury" element={<Navigate to="/treasury" replace />} />
      <Route path="/overview/invest" element={<Navigate to="/invest" replace />} />
      <Route path="/overview/spend" element={<Navigate to="/spend" replace />} />
      <Route path="/overview/grow" element={<Navigate to="/grow" replace />} />
      <Route path="/agent-wallet" element={<LegacyAgentWalletRedirect />} />
      <Route path="/c/:shareId" element={<ShareableChatRoute />} />

      <Route element={<DashboardLayoutRoute />}>
        <Route path="/overview" element={<DashboardOverview />} />
        <Route
          path="/multiwallet/recover"
          element={
            <AdminDashboardGate featureLabel="Multiwallet recovery">
              <MultiWalletRecoverPage />
            </AdminDashboardGate>
          }
        />
        <Route
          path="/earn"
          element={
            <MachineMoneyRoute pillarId="earn">
              <EarnPage />
            </MachineMoneyRoute>
          }
        />
        <Route
          path="/earn/token/:mint"
          element={
            <MachineMoneyRoute pillarId="earn">
              <EarnTokenDetailPage />
            </MachineMoneyRoute>
          }
        />
        <Route
          path="/treasury"
          element={
            <MachineMoneyRoute pillarId="treasury">
              <TreasuryPage />
            </MachineMoneyRoute>
          }
        />
        <Route
          path="/invest"
          element={
            <MachineMoneyRoute pillarId="invest">
              <InvestPage />
            </MachineMoneyRoute>
          }
        />
        <Route
          path="/spend"
          element={
            <MachineMoneyRoute pillarId="spend">
              <SpendPage />
            </MachineMoneyRoute>
          }
        />
        <Route
          path="/grow"
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
        <Route path="/analyzer" element={<PumpfunAnalyzer />} />
        <Route path="/analyzer/call/:callId" element={<PumpfunCallPage />} />
        <Route path="/pumpfun" element={<LegacyPumpfunPageRedirect />} />
        <Route path="/pumpfun/call/:callId" element={<LegacyPumpfunCallRedirect />} />
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
          path="/btc-experiment"
          element={
            <AdminExperimentRoute>
              <BtcQuantExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route
          path="/btc2-experiment"
          element={
            <AdminExperimentRoute>
              <Btc2QuantAgentExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route
          path="/btc3-experiment"
          element={
            <AdminExperimentRoute>
              <Btc3MacroAgentExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route
          path="/stocks"
          element={
            <AdminExperimentRoute>
              <StocksNewsExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route
          path="/momentum-rotator"
          element={
            <AdminExperimentRoute>
              <MomentumRotatorExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route
          path="/lst-loop"
          element={
            <AdminExperimentRoute>
              <LstLoopExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route
          path="/alpha-sniper"
          element={
            <AdminExperimentRoute>
              <SniperExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route
          path="/scalper"
          element={
            <AdminExperimentRoute>
              <ScalperExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route
          path="/mm"
          element={
            <AdminExperimentRoute>
              <MmExperiment />
            </AdminExperimentRoute>
          }
        />
        <Route path="/spcx" element={<Navigate to="/marketplace" replace />} />
        <Route path="/btc" element={<BtcPage />} />
        <Route
          path="/labs"
          element={
            <AdminDashboardGate featureLabel="Labs">
              <LabsPage />
            </AdminDashboardGate>
          }
        />
        <Route
          path="/llm"
          element={
            <AdminDashboardGate featureLabel="LLM">
              <LlmPage />
            </AdminDashboardGate>
          }
        />
        <Route
          path="/organize"
          element={
            <AdminDashboardGate featureLabel="Organize">
              <OrganizePage />
            </AdminDashboardGate>
          }
        />
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

      <Route path="/marketplace" element={<PlaygroundHub />} />
      <Route path="/marketplace/api/:flowId" element={<MarketplaceApiDetailPage />} />
      <Route path="/marketplace/s/:slug" element={<PlaygroundShareRoute />} />
      <Route path="/marketplace/*" element={<Navigate to="/marketplace" replace />} />
      <Route path="/playground" element={<Navigate to="/marketplace" replace />} />
      <Route path="/playground/s/:slug" element={<Navigate to="/marketplace/s/:slug" replace />} />
      <Route path="/playground/*" element={<Navigate to="/marketplace" replace />} />

      <Route path="/staking" element={<StreamflowPage />} />
      <Route path="/staking/admin" element={<StakingAdminDashboardPage />} />
      <Route path="/staking/dashboard" element={<Navigate to="/staking/admin" replace />} />
      <Route path="/staking/details" element={<Navigate to="/staking" replace />} />

      <Route path="/dashboard/*" element={<LegacyDashboardPrefixRedirect />} />
      <Route path="/experiment/trading-agent/*" element={<Navigate to="/overview" replace />} />
      <Route path="/trading-experiment/*" element={<Navigate to="/overview" replace />} />
      <Route path="/arbitrage-experiment/*" element={<Navigate to="/overview" replace />} />
      <Route path="/lp-experiment/history" element={<Navigate to="/lp-experiment" replace />} />
      <Route path="/lp-experiment/history/:id" element={<Navigate to="/lp-experiment" replace />} />
      <Route path="/token-check" element={<Navigate to="/assets" replace />} />
      <Route path="/dossier" element={<Navigate to="/assets" replace />} />
      <Route path="/staking/dashboard/internal" element={<Navigate to="/staking/admin" replace />} />
      <Route path="/mpp" element={<Navigate to="/marketplace" replace />} />
      <Route path="/playground/mpp" element={<Navigate to="/marketplace" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function SuspenseOutlet() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  );
}

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <Routes>
        <Route
          path="/deck"
          element={
            <Suspense fallback={<RouteFallback />}>
              <DeckPage />
            </Suspense>
          }
        />
        <Route
          path="/info"
          element={
            <Suspense fallback={<RouteFallback />}>
              <InfoPage />
            </Suspense>
          }
        />
        <Route
          element={
            <Suspense fallback={<RouteFallback />}>
              <PostStudioLayout />
            </Suspense>
          }
        >
          <Route element={<SuspenseOutlet />}>
            <Route path="/post" element={<PostPage />} />
            <Route path="/post/video/:updateNumber?" element={<PostVideoPage />} />
            <Route path="/post/photo/:updateNumber?" element={<PostPhotoPage />} />
          </Route>
        </Route>

        <Route
          element={
            <Suspense fallback={<RouteFallback />}>
              <MarketingLayout />
            </Suspense>
          }
        >
          <Route element={<SuspenseOutlet />}>
            <Route path="/brand" element={<MarketingBrand />} />
            <Route path="/identity" element={<MarketingIdentity />} />
            <Route path="/teams" element={<MarketingTeams />} />
            <Route path="/partner" element={<MarketingPartner />} />
            <Route path="/partner/:slug" element={<MarketingPartnerDetail />} />
            <Route path="/analytics" element={<MarketingAnalytics />} />
            <Route path="/leaderboard" element={<MarketingLeaderboard />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <AppShell>
              <QwertiAgentIntegration />
              <Suspense fallback={<RouteFallback />}>
                <AppRoutes />
              </Suspense>
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  </AppProviders>
);

export default App;
