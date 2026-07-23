import { EarnPaperLabPage } from "@/components/experiment/shared/EarnPaperLabPage";
import {
  fetchLstLoopLabState,
  fetchLstLoopRuns,
  fetchLstLoopStats,
  fetchLstLoopStrategies,
} from "@/lib/lstLoopApi";

export default function LstLoopExperiment() {
  return (
    <EarnPaperLabPage
      title="Leveraged LST Loop"
      subtitle="Paper lab simulating mSOL/JitoSOL loops vs Rise borrow cost with health-factor guardrails. Real graduation uses Marinade/Jito + Rise via walletBroker."
      queryKey="lst-loop"
      walletQuery="invest"
      earnProductHint="Earn product: lst_loop"
      fetchState={fetchLstLoopLabState}
      fetchStats={fetchLstLoopStats}
      fetchRuns={fetchLstLoopRuns}
      fetchStrategies={fetchLstLoopStrategies}
    />
  );
}
