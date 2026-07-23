import { EarnPaperLabPage } from "@/components/experiment/shared/EarnPaperLabPage";
import {
  fetchMomentumLabState,
  fetchMomentumRuns,
  fetchMomentumStats,
  fetchMomentumStrategies,
} from "@/lib/momentumRotatorApi";

export default function MomentumRotatorExperiment() {
  return (
    <EarnPaperLabPage
      title="Momentum Rotator"
      subtitle="Paper lab rotating USDC among SOL, cbBTC, and JLP via Jupiter-priced momentum signals. Graduates to capped invest-wallet real beta on the Earn Yield board."
      queryKey="momentum-rotator"
      walletQuery="invest"
      earnProductHint="Earn product: momentum_rotator"
      fetchState={fetchMomentumLabState}
      fetchStats={fetchMomentumStats}
      fetchRuns={fetchMomentumRuns}
      fetchStrategies={fetchMomentumStrategies}
    />
  );
}
