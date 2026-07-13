import { useState } from "react";
import { FlaskConical, Loader2, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLabsX402 } from "@/hooks/useLabsX402";
import { WalletList } from "@/components/labs/x402/WalletList";
import { CreateWalletDialog } from "@/components/labs/x402/CreateWalletDialog";
import { DepositDialog } from "@/components/labs/x402/DepositDialog";
import { AutoCallSettingsPanel } from "@/components/labs/x402/AutoCallSettingsPanel";
import { SimulationPanel } from "@/components/labs/x402/SimulationPanel";
import { CallLogTable } from "@/components/labs/x402/CallLogTable";
import { EndpointsGridSkeleton } from "@/components/labs/LabsSkeleton";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import type { LabWallet } from "@/lib/labsX402Api";

export function X402LabTab() {
  const {
    walletsQ,
    settingsQ,
    callsQ,
    endpointsQ,
    createWalletM,
    updateSettingsM,
    runM,
  } = useLabsX402();

  const [createOpen, setCreateOpen] = useState(false);
  const [depositWallet, setDepositWallet] = useState<LabWallet | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<{
    intervalMin: number;
    jitterPct: number;
    refundEnabled: boolean;
    autoCallEnabled: boolean;
    maxDailyCallsMin: number;
    maxDailyCallsMax: number;
  } | null>(null);

  const wallets = walletsQ.data ?? [];
  const payerCount = wallets.filter((w) => w.role === "payer").length;
  const hasPayTo = wallets.some((w) => w.role === "payto");
  const showEndpointsSkeleton = useMinimumSkeleton(endpointsQ.isLoading);

  const handleCreate = (input: { label: string; role: "payer" | "payto" }) => {
    createWalletM.mutate(input, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FlaskConical className="h-5 w-5 text-primary" aria-hidden />
            x402 payment lab
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage lab wallets, fund them with SOL/USDC, and run paid calls against{" "}
            <code className="text-xs">/insights/*</code> endpoints. Settlements use the{" "}
            <a
              href="https://dexter.cash/facilitator"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Dexter
            </a>{" "}
            facilitator; PayTo wallet receives funds (buyback skipped) and refunds payers when
            enabled.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create wallet
          </Button>
          <Button
            className="gap-2"
            disabled={runM.isPending || !wallets.some((w) => w.role === "payer")}
            onClick={() => runM.mutate(undefined)}
          >
            {runM.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
            Run all payers
          </Button>
        </div>
      </div>

      {(createWalletM.isError || runM.isError || updateSettingsM.isError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {(createWalletM.error ?? runM.error ?? updateSettingsM.error)?.message}
          </AlertDescription>
        </Alert>
      )}

      {runM.isSuccess && (
        <Alert>
          <AlertDescription>x402 run completed. Check the call log for results.</AlertDescription>
        </Alert>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Wallets
        </h3>
        <WalletList
          wallets={wallets}
          isLoading={walletsQ.isLoading}
          onDeposit={(w) => setDepositWallet(w)}
          onRunPayer={(addr) => runM.mutate({ payerAddress: addr })}
          isRunning={runM.isPending}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Auto-call settings
        </h3>
        <AutoCallSettingsPanel
          settings={settingsQ.data}
          isLoading={settingsQ.isLoading}
          onSave={(patch) => updateSettingsM.mutate(patch)}
          isSaving={updateSettingsM.isPending}
          onDraftChange={setSettingsDraft}
        />
      </section>

      <section className="space-y-3">
        <SimulationPanel
          payerCount={payerCount}
          wallets={wallets}
          settings={settingsQ.data}
          endpoints={endpointsQ.data ?? []}
          draft={settingsDraft ?? undefined}
        />
      </section>

      {showEndpointsSkeleton || (endpointsQ.data && endpointsQ.data.length > 0) ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Available endpoints
          </h3>
          {showEndpointsSkeleton ? (
            <EndpointsGridSkeleton />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {endpointsQ.data!.map((ep) => (
                <div
                  key={ep.id}
                  className="rounded-lg border border-border/60 bg-card/50 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-medium">{ep.path}</code>
                    <span className="font-mono text-xs text-muted-foreground">
                      ${ep.priceUsd.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{ep.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Call log
        </h3>
        <CallLogTable calls={callsQ.data ?? []} isLoading={callsQ.isLoading} />
      </section>

      <CreateWalletDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createWalletM.isPending}
        hasPayTo={hasPayTo}
      />

      <DepositDialog
        wallet={depositWallet}
        open={depositWallet != null}
        onOpenChange={(open) => {
          if (!open) setDepositWallet(null);
        }}
      />
    </div>
  );
}
