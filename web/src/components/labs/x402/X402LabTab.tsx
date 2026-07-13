import { useMemo, useState } from "react";
import { FlaskConical, Loader2, Play, Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { LabChain, LabWallet } from "@/lib/labsX402Api";

const MAX_BULK = 20;

interface X402LabTabProps {
  chain: LabChain;
}

export function X402LabTab({ chain }: X402LabTabProps) {
  const {
    walletsQ,
    settingsQ,
    callsQ,
    endpointsQ,
    createWalletM,
    createWalletsBulkM,
    updateSettingsM,
    runM,
  } = useLabsX402(chain);

  const [createOpen, setCreateOpen] = useState(false);
  const [depositWallet, setDepositWallet] = useState<LabWallet | null>(null);
  const [bulkCount, setBulkCount] = useState(5);
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
  const remainingPayerSlots = Math.max(0, MAX_BULK - payerCount);
  const showEndpointsSkeleton = useMinimumSkeleton(endpointsQ.isLoading);

  const isBase = chain === "base";
  const chainLabel = isBase ? "Base" : "Solana";
  const nativeSymbol = isBase ? "ETH" : "SOL";

  const visibleEndpoints = useMemo(() => {
    const all = endpointsQ.data ?? [];
    if (!isBase) return all;
    // Base payers skip PayAI-only routes.
    return all.filter((ep) => ep.facilitator !== "payai");
  }, [endpointsQ.data, isBase]);

  const handleCreate = (input: { label: string; role: "payer" | "payto" }) => {
    createWalletM.mutate(input, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const handleBulkCreate = () => {
    const count = Math.min(Math.max(Math.round(bulkCount), 1), remainingPayerSlots || MAX_BULK);
    if (count < 1 || remainingPayerSlots < 1) return;
    createWalletsBulkM.mutate({ count, labelPrefix: "Payer" });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FlaskConical className="h-5 w-5 text-primary" aria-hidden />
            x402 payment lab — {chainLabel}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage {chainLabel} lab wallets, fund them with {nativeSymbol}/USDC, and run paid calls
            against <code className="text-xs">/insights/*</code> endpoints
            {isBase ? " settling on Base via Dexter" : ""}.{" "}
            {!isBase ? (
              <>
                Most routes settle via{" "}
                <a
                  href="https://dexter.cash/facilitator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Dexter
                </a>
                ; PayAI routes (e.g. ecosystem brief) use{" "}
                <a
                  href="https://facilitator.payai.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  PayAI
                </a>{" "}
                with a strict 5–10 calls/day cap.{" "}
              </>
            ) : (
              <>
                Settlement uses{" "}
                <a
                  href="https://dexter.cash/facilitator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Dexter
                </a>{" "}
                on Base (EIP-155:8453). PayAI routes are skipped on this tab.{" "}
              </>
            )}
            PayTo wallet receives funds (buyback skipped) and refunds payers when enabled.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
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
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={Math.max(1, remainingPayerSlots)}
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value) || 1)}
              className="h-9 w-20"
              aria-label="Number of wallets to create"
            />
            <Button
              variant="secondary"
              className="gap-2"
              disabled={
                createWalletsBulkM.isPending || remainingPayerSlots < 1 || bulkCount < 1
              }
              onClick={handleBulkCreate}
              title={
                remainingPayerSlots < 1
                  ? `Maximum of ${MAX_BULK} payer wallets reached`
                  : `Create ${bulkCount} payer wallets`
              }
            >
              {createWalletsBulkM.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Layers className="h-4 w-4" aria-hidden />
              )}
              Create {Math.min(bulkCount, remainingPayerSlots || bulkCount)} wallets
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {remainingPayerSlots} payer slot{remainingPayerSlots === 1 ? "" : "s"} remaining
          </p>
        </div>
      </div>

      {(createWalletM.isError ||
        createWalletsBulkM.isError ||
        runM.isError ||
        updateSettingsM.isError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {(
              createWalletM.error ??
              createWalletsBulkM.error ??
              runM.error ??
              updateSettingsM.error
            )?.message}
          </AlertDescription>
        </Alert>
      )}

      {createWalletsBulkM.isSuccess && (
        <Alert>
          <AlertDescription>
            Created {createWalletsBulkM.data?.length ?? 0} payer wallet
            {(createWalletsBulkM.data?.length ?? 0) === 1 ? "" : "s"}.
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
          chain={chain}
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
          endpoints={visibleEndpoints}
          draft={settingsDraft ?? undefined}
          chain={chain}
        />
      </section>

      {showEndpointsSkeleton || visibleEndpoints.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Available endpoints
          </h3>
          {showEndpointsSkeleton ? (
            <EndpointsGridSkeleton />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEndpoints.map((ep) => (
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
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        ep.facilitator === "payai"
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                          : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {ep.facilitator === "payai" ? "PayAI" : "Dexter"}
                    </span>
                    {ep.facilitator === "payai" && ep.dailyQuota && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          ep.dailyQuota.allowed
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {ep.dailyQuota.count}/{ep.dailyQuota.max} today
                      </span>
                    )}
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
        chain={chain}
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
