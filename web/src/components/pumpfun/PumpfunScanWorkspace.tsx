import {
  Activity,
  Crosshair,
  LayoutDashboard,
  Megaphone,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PumpfunChartPanel } from "@/components/pumpfun/PumpfunChartPanel";
import { PumpfunClusterPanel } from "@/components/pumpfun/PumpfunClusterPanel";
import { PumpfunDevPanel } from "@/components/pumpfun/PumpfunDevPanel";
import { PumpfunFreshWalletPanel } from "@/components/pumpfun/PumpfunFreshWalletPanel";
import { PumpfunHolderOverlapPanel } from "@/components/pumpfun/PumpfunHolderOverlapPanel";
import { PumpfunHoldersPanel } from "@/components/pumpfun/PumpfunHoldersPanel";
import { PumpfunKolPanel } from "@/components/pumpfun/PumpfunKolPanel";
import { PumpfunLiquidityPanel } from "@/components/pumpfun/PumpfunLiquidityPanel";
import { PumpfunRiskPanel } from "@/components/pumpfun/PumpfunRiskPanel";
import { PumpfunSafetyChecklist } from "@/components/pumpfun/PumpfunSafetyChecklist";
import { PumpfunScanShareBar } from "@/components/pumpfun/PumpfunScanShareBar";
import { PumpfunSnipersPanel } from "@/components/pumpfun/PumpfunSnipersPanel";
import { PumpfunSocialMomentumPanel } from "@/components/pumpfun/PumpfunSocialMomentumPanel";
import { PumpfunStatGrid } from "@/components/pumpfun/PumpfunStatGrid";
import { PumpfunTradeTapePanel } from "@/components/pumpfun/PumpfunTradeTapePanel";
import { PumpfunVerdictCard } from "@/components/pumpfun/PumpfunVerdictCard";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import type { PumpfunScanRecord } from "@/lib/pumpfunScanHistoryApi";
import { cn } from "@/lib/utils";

export type PumpfunScanSubTab =
  | "overview"
  | "security"
  | "holders"
  | "bundles"
  | "dev"
  | "social"
  | "trades";

export const PUMPFUN_SCAN_SUB_TABS: PumpfunScanSubTab[] = [
  "overview",
  "security",
  "holders",
  "bundles",
  "dev",
  "social",
  "trades",
];

export function parsePumpfunScanSubTab(raw: string | null): PumpfunScanSubTab {
  if (raw && PUMPFUN_SCAN_SUB_TABS.includes(raw as PumpfunScanSubTab)) {
    return raw as PumpfunScanSubTab;
  }
  return "overview";
}

const SUB_TAB_META: Record<
  PumpfunScanSubTab,
  { label: string; icon: typeof LayoutDashboard }
> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  security: { label: "Security", icon: Shield },
  holders: { label: "Holders", icon: Users },
  bundles: { label: "Bundles", icon: Crosshair },
  dev: { label: "Dev", icon: UserCog },
  social: { label: "Social", icon: Megaphone },
  trades: { label: "Trades", icon: Activity },
};

export interface PumpfunScanWorkspaceProps {
  data: MemecoinAnalysisPayload;
  scanRecord: PumpfunScanRecord | null;
  subTab: PumpfunScanSubTab;
  onSubTabChange: (sub: PumpfunScanSubTab) => void;
  onShare: () => void;
  toolsEnabled?: boolean;
  className?: string;
}

export function PumpfunScanWorkspace({
  data,
  scanRecord,
  subTab,
  onSubTabChange,
  onShare,
  toolsEnabled = true,
  className,
}: PumpfunScanWorkspaceProps) {
  const baseSymbol =
    data.pumpfun.data?.symbol ?? data.dossier.data?.asset?.symbol ?? "Token";

  return (
    <div className={cn("space-y-4", className)}>
      <PumpfunScanShareBar scanRecord={scanRecord} onShare={onShare} />

      <Tabs
        value={subTab}
        onValueChange={(value) => onSubTabChange(parsePumpfunScanSubTab(value))}
      >
        <div className="sticky top-0 z-10 -mx-1 px-1 pb-2 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <TabsList className="inline-flex h-auto w-full min-w-0 justify-start gap-1 overflow-x-auto rounded-xl bg-muted/80 p-1 scrollbar-none">
            {PUMPFUN_SCAN_SUB_TABS.map((tab) => {
              const meta = SUB_TAB_META[tab];
              const Icon = meta.icon;
              return (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="shrink-0 gap-1.5 px-3 py-2 text-xs sm:text-sm"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {meta.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 space-y-6 animate-in fade-in duration-300">
          <PumpfunSafetyChecklist data={data} />
          <PumpfunVerdictCard data={data} />
          <PumpfunStatGrid data={data} />
          <PumpfunChartPanel data={data} />
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-6 animate-in fade-in duration-300">
          <PumpfunRiskPanel data={data} />
          <PumpfunLiquidityPanel data={data} />
        </TabsContent>

        <TabsContent value="holders" className="mt-4 space-y-6 animate-in fade-in duration-300">
          <PumpfunHoldersPanel data={data} />
          <PumpfunFreshWalletPanel data={data} />
        </TabsContent>

        <TabsContent value="bundles" className="mt-4 space-y-6 animate-in fade-in duration-300">
          <PumpfunClusterPanel data={data} />
          <PumpfunSnipersPanel mint={data.mint} enabled={toolsEnabled && subTab === "bundles"} />
          <PumpfunHolderOverlapPanel baseMint={data.mint} baseSymbol={baseSymbol} />
        </TabsContent>

        <TabsContent value="dev" className="mt-4 space-y-6 animate-in fade-in duration-300">
          <PumpfunDevPanel mint={data.mint} enabled={toolsEnabled && subTab === "dev"} />
        </TabsContent>

        <TabsContent value="social" className="mt-4 space-y-6 animate-in fade-in duration-300">
          <PumpfunSocialMomentumPanel data={data} />
          <PumpfunKolPanel data={data} />
        </TabsContent>

        <TabsContent value="trades" className="mt-4 space-y-6 animate-in fade-in duration-300">
          <PumpfunTradeTapePanel mint={data.mint} enabled={toolsEnabled && subTab === "trades"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
