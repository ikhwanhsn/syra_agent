import { EarnPaperLabPage } from "@/components/experiment/shared/EarnPaperLabPage";
import {
  fetchSniperLabState,
  fetchSniperRuns,
  fetchSniperStats,
  fetchSniperStrategies,
} from "@/lib/sniperApi";

export default function SniperExperiment() {
  return (
    <EarnPaperLabPage
      title="New-Pair Alpha Sniper"
      subtitle="Paper lab sniping high-quality new pairs from pump.fun scout with RugCheck hard gates and adaptive TP/SL/trailing. Highest variance — paper first."
      queryKey="alpha-sniper"
      walletQuery="lp"
      earnProductHint="Earn product: alpha_sniper"
      fetchState={fetchSniperLabState}
      fetchStats={fetchSniperStats}
      fetchRuns={fetchSniperRuns}
      fetchStrategies={fetchSniperStrategies}
    />
  );
}
