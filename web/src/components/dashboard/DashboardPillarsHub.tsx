import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";
import { PillarCard } from "@/components/pillars/PillarCard";
import { OverviewGroupLabel } from "@/components/dashboard/overview/OverviewGroupLabel";
import { MachineMoneyPreviewToggle } from "@/components/dashboard/MachineMoneyPreviewToggle";
import { fetchPillarsDiscovery, PILLAR_COPY, type PillarId } from "@/lib/pillarsApi";
import { useMachineMoneyPreview } from "@/contexts/MachineMoneyPreviewContext";
import { isAdminWallet } from "@/constants/adminWallet";
import { useWalletContext } from "@/contexts/WalletContext";
import { Coins } from "lucide-react";

const PILLAR_ORDER: PillarId[] = ["earn", "treasury", "invest", "spend", "grow"];

export function DashboardPillarsHub() {
  const { address, connected } = useWalletContext();
  const { machineMoneyUnlocked, previewComingSoon } = useMachineMoneyPreview();
  const isAdmin = isAdminWallet(connected, address);

  const discoveryQ = useQuery({
    queryKey: ["pillars", "discovery"],
    queryFn: fetchPillarsDiscovery,
    staleTime: 300_000,
  });

  const pillarsById = new Map(
    (discoveryQ.data?.pillars ?? []).map((p) => [p.id as PillarId, p]),
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <OverviewGroupLabel icon={Coins}>Machine Money</OverviewGroupLabel>
        {isAdmin ? <MachineMoneyPreviewToggle compact /> : null}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {previewComingSoon
          ? "Previewing the public coming-soon experience — toggle the eye to return to full pages."
          : "Wealth is the narrative — Earn, Treasury, Invest, Spend (x402), and Grow."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PILLAR_ORDER.map((id) => {
          const copy = PILLAR_COPY[id];
          const meta = pillarsById.get(id);
          return (
            <PillarCard
              key={id}
              id={id}
              label={copy.headline}
              tagline={meta?.tagline ?? copy.description.split("—")[0]?.trim() ?? copy.headline}
              description={copy.description}
              href={copy.href}
              comingSoon={!machineMoneyUnlocked}
              stats={
                meta
                  ? { routeCount: meta.routeCount, toolCount: meta.toolCount }
                  : undefined
              }
            />
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {machineMoneyUnlocked ? (
          <>
            <Link to="/overview/spend" className="text-primary hover:underline">
              Spend
            </Link>{" "}
            is the x402 module — payments are one feature, not the whole product.
          </>
        ) : (
          "Machine Money pillars are coming soon — Earn, Treasury, Invest, Spend, and Grow."
        )}
      </p>
    </section>
  );
}
