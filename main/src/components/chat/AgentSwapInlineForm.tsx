import { useState, useCallback, useEffect } from "react";
import { AlertCircle, ArrowDownUp, X } from "lucide-react";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentInlineUiPayload } from "@/lib/chatApi";
import { fetchPumpfunCoinMetadata, type PumpfunCoinMetadata } from "@/lib/pumpfunCoinMetadata";
import {
  SWAP_PRESET_TOKENS,
  WSOL_MINT,
  type SwapPresetId,
  decimalsForMint,
  humanToBaseUnits,
  isValidBase58Mint,
  normalizeCommonPresetMints,
  normalizeWsolMint,
  presetLabelFromMint,
} from "@/lib/swapPresets";

type SwapInlineUi = Extract<AgentInlineUiPayload, { type: "jupiter-swap" } | { type: "pumpfun-swap" }>;

export type SwapInlineFormStatus = "cancelled" | "submitted";

function presetMint(label: SwapPresetId): string | null {
  if (label === "custom") return null;
  const row = SWAP_PRESET_TOKENS.find((t) => t.label === label);
  return row?.mint ?? null;
}

function resolveMint(kind: SwapPresetId, custom: string): string {
  if (kind !== "custom") return presetMint(kind) ?? "";
  return normalizeCommonPresetMints(normalizeWsolMint(custom));
}

function isWsolMint(mint: string): boolean {
  return normalizeWsolMint(mint) === WSOL_MINT;
}

function amountToBaseUnits(
  inputMint: string,
  amountRaw: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const amt = amountRaw.trim().replace(/,/g, "");
  if (!amt) return { ok: false, error: "Enter an amount." };
  const dec = decimalsForMint(inputMint);
  if (dec != null) {
    const n = Number(amt);
    if (!Number.isFinite(n) || n <= 0) return { ok: false, error: "Enter a valid positive amount." };
    const base = humanToBaseUnits(amt, dec);
    if (!base) return { ok: false, error: "Could not convert amount to token units." };
    return { ok: true, value: base };
  }
  if (!/^\d+$/.test(amt)) {
    return {
      ok: false,
      error: "For custom spend tokens, enter amount as a whole number of smallest units (raw integer).",
    };
  }
  return { ok: true, value: amt };
}

const PRESET_LOGO_CLASS = "h-9 w-9 min-h-9 min-w-9 shrink-0";

function PresetTokenGlyph({ id }: { id: Exclude<SwapPresetId, "custom"> }) {
  return <CoinLogo symbol={id} size="md" className={PRESET_LOGO_CLASS} fallbackSeed={id} />;
}

export interface AgentSwapInlineFormProps {
  mode: "jupiter" | "pumpfun";
  inlineUi: SwapInlineUi;
  assistantMessageId: string;
  readOnly?: boolean;
  /** After user taps Swap or Cancel: keep card, hide primary actions. */
  actionsHidden?: boolean;
  swapInlineStatus?: SwapInlineFormStatus;
  onSwap: (payload: { assistantMessageId: string; prompt: string }) => void;
  onCancel: (assistantMessageId: string) => void;
}

const selectTriggerClass =
  "h-11 gap-2 rounded-full border-0 bg-background/70 px-2.5 pl-2 shadow-none ring-1 ring-border/50 transition-[box-shadow,background-color] hover:bg-background/90 hover:ring-border focus:ring-2 focus:ring-ring/40 focus:ring-offset-0 data-[state=open]:ring-ring/50 [&>span]:flex [&>span]:min-w-0 [&>span]:items-center [&>span]:gap-2";

export function AgentSwapInlineForm({
  mode,
  inlineUi,
  assistantMessageId,
  readOnly = false,
  actionsHidden = false,
  swapInlineStatus,
  onSwap,
  onCancel,
}: AgentSwapInlineFormProps) {
  const [spendKind, setSpendKind] = useState<SwapPresetId>("SOL");
  const [spendCustom, setSpendCustom] = useState("");
  const [receiveKind, setReceiveKind] = useState<SwapPresetId>("custom");
  const [receiveCustom, setReceiveCustom] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [receiveMeta, setReceiveMeta] = useState<PumpfunCoinMetadata | null>(null);
  const [receiveMetaLoading, setReceiveMetaLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const mints = inlineUi.suggestedMints;
    const sug = inlineUi.suggestedAmount;
    if (mints?.length) {
      const outMint = mints[0].trim();
      const outPreset = presetLabelFromMint(outMint);
      if (outPreset) {
        setReceiveKind(outPreset);
        setReceiveCustom("");
      } else {
        setReceiveKind("custom");
        setReceiveCustom(outMint);
      }
    }
    if (mints && mints.length >= 2) {
      const inMint = mints[1].trim();
      const inPreset = presetLabelFromMint(inMint);
      if (inPreset) {
        setSpendKind(inPreset);
        setSpendCustom("");
      } else {
        setSpendKind("custom");
        setSpendCustom(inMint);
      }
    }
    if (sug) setAmount(sug);
  }, [inlineUi.suggestedAmount, inlineUi.suggestedMints]);

  useEffect(() => {
    if (spendKind !== "custom") return;
    const p = presetLabelFromMint(spendCustom);
    if (p) {
      setSpendKind(p);
      setSpendCustom("");
    }
  }, [spendKind, spendCustom]);

  useEffect(() => {
    if (receiveKind !== "custom") return;
    const p = presetLabelFromMint(receiveCustom);
    if (p) {
      setReceiveKind(p);
      setReceiveCustom("");
    }
  }, [receiveKind, receiveCustom]);

  useEffect(() => {
    const mint = receiveCustom.trim();
    if (receiveKind !== "custom" || !isValidBase58Mint(mint)) {
      setReceiveMeta(null);
      setReceiveMetaLoading(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setReceiveMetaLoading(true);
      void fetchPumpfunCoinMetadata(mint)
        .then((r) => {
          if (!cancelled) setReceiveMeta(r);
        })
        .catch(() => {
          if (!cancelled) setReceiveMeta(null);
        })
        .finally(() => {
          if (!cancelled) setReceiveMetaLoading(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [receiveKind, receiveCustom]);

  const handleSubmit = useCallback(async () => {
    if (actionsHidden) return;
    setError(null);
    const inputMint = resolveMint(spendKind, spendCustom);
    const outputMint = resolveMint(receiveKind, receiveCustom);
    if (!isValidBase58Mint(inputMint)) {
      setError("Enter a valid spend token mint (or pick a preset).");
      return;
    }
    if (!isValidBase58Mint(outputMint)) {
      setError("Enter a valid receive token mint (or pick a preset).");
      return;
    }
    if (inputMint === outputMint) {
      setError("Spend and receive tokens must be different.");
      return;
    }
    const conv = amountToBaseUnits(inputMint, amount);
    if (!conv.ok) {
      setError(conv.error);
      return;
    }

    let toolId: "jupiter-swap-order" | "pumpfun-agents-swap" =
      mode === "jupiter" ? "jupiter-swap-order" : "pumpfun-agents-swap";

    if (mode === "pumpfun") {
      setIsSubmitting(true);
      try {
        const candidates = [inputMint, outputMint].filter((m) => !isWsolMint(m));
        const seen = new Set<string>();
        for (const m of candidates) {
          if (seen.has(m)) continue;
          seen.add(m);
          const meta = await fetchPumpfunCoinMetadata(m);
          if (meta?.complete) {
            toolId = "jupiter-swap-order";
            break;
          }
        }
      } catch {
        setError("Could not verify token status. Try again or switch to Jupiter swap.");
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    const graduatedNote =
      mode === "pumpfun" && toolId === "jupiter-swap-order"
        ? "This swap involves a pump.fun token that has graduated (bonding curve complete, liquidity migrated). Use jupiter-swap-order only — not pumpfun-agents-swap — so the route matches the Raydium/DEX pool.\n\n"
        : "";

    const prompt = [
      graduatedNote,
      `Execute ${toolId} with these exact parameters (strings for mints and amount):`,
      `- inputMint: ${inputMint}`,
      `- outputMint: ${outputMint}`,
      `- amount: "${conv.value}"`,
      "Use the agent wallet as taker where applicable. Build and submit the swap; report signature, any error, or confirmation.",
    ].join("\n");
    onSwap({ assistantMessageId, prompt });
  }, [actionsHidden, amount, assistantMessageId, mode, onSwap, receiveCustom, receiveKind, spendCustom, spendKind]);

  if (readOnly) {
    return (
      <div className="mt-4 rounded-2xl border border-border/50 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
        An interactive swap form was available in the original chat.
      </div>
    );
  }

  const venueLabel = mode === "jupiter" ? "Jupiter" : "pump.fun";
  const outputMintResolved = resolveMint(receiveKind, receiveCustom);
  const receiveSelectCustomLabel = receiveMetaLoading ? "…" : receiveMeta?.symbol ?? "Other";
  const frozen = actionsHidden;

  return (
    <div className="mt-4 w-full min-w-0">
      <div
        role="group"
        aria-label={`Token swap (${venueLabel})`}
        className={cn(
          "overflow-hidden rounded-[22px] border border-border/45",
          "bg-gradient-to-b from-card via-card to-muted/[0.12]",
          "shadow-[0_1px_0_hsl(0_0%_100%/0.04)_inset,0_24px_48px_-28px_rgba(0,0,0,0.65)]",
          frozen && "opacity-[0.92]",
        )}
      >
        <div className={cn("relative px-3 pt-3 sm:px-4", frozen ? "pb-2" : "pb-1")}>
          <div
            className={cn(
              "relative rounded-2xl p-3.5 sm:p-4",
              "bg-muted/[0.22] ring-1 ring-inset ring-border/35",
              "rounded-b-md",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {spendKind !== "custom" ? (
                  <PresetTokenGlyph id={spendKind} />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-border/50">
                    ?
                  </span>
                )}
                <Select
                  value={spendKind}
                  onValueChange={(v) => setSpendKind(v as SwapPresetId)}
                  disabled={frozen}
                >
                  <SelectTrigger className={cn(selectTriggerClass, "min-w-0 flex-1 sm:max-w-[220px]")}>
                    <SelectValue placeholder="Token" className="truncate text-[15px] font-semibold tracking-tight" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    {SWAP_PRESET_TOKENS.map((t) => (
                      <SelectItem key={t.label} value={t.label} className="rounded-lg py-2.5">
                        <span className="font-medium">{t.label}</span>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="rounded-lg py-2.5">
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full shrink-0 flex-col items-end sm:w-auto sm:min-w-[9rem]">
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  readOnly={frozen}
                  placeholder="0.00"
                  className={cn(
                    "h-11 border-0 bg-transparent p-0 text-right font-mono text-2xl font-semibold tabular-nums tracking-tight",
                    "text-foreground placeholder:text-muted-foreground/35 shadow-none focus-visible:ring-0 sm:text-[1.65rem] sm:leading-none",
                    frozen && "cursor-default opacity-90",
                  )}
                  inputMode="decimal"
                  aria-label="Amount"
                />
              </div>
            </div>
            {spendKind === "custom" ? (
              <Input
                value={spendCustom}
                onChange={(e) => setSpendCustom(e.target.value)}
                readOnly={frozen}
                placeholder="Mint"
                className="mt-3 h-10 rounded-xl border-border/40 bg-background/40 font-mono text-xs shadow-none focus-visible:ring-1 focus-visible:ring-ring/30"
                spellCheck={false}
              />
            ) : null}
          </div>

          <div className="relative z-[1] -my-3 flex justify-center" aria-hidden>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border-4 border-card",
                "bg-muted/80 text-muted-foreground shadow-sm ring-1 ring-border/50",
              )}
            >
              <ArrowDownUp className="h-4 w-4 opacity-80" strokeWidth={2.25} />
            </div>
          </div>

          <div
            className={cn(
              "relative -mt-3 rounded-2xl p-3.5 sm:p-4",
              "bg-muted/[0.22] ring-1 ring-inset ring-border/35",
              "rounded-t-md pt-6 sm:pt-7",
            )}
          >
            <div className="flex flex-col gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  {receiveKind !== "custom" ? <PresetTokenGlyph id={receiveKind} /> : null}
                  {receiveKind === "custom" && receiveMetaLoading ? (
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted/50 ring-1 ring-border/40" />
                  ) : null}
                  {receiveKind === "custom" &&
                  !receiveMetaLoading &&
                  receiveMeta &&
                  isValidBase58Mint(outputMintResolved) ? (
                    receiveMeta.imageUri ? (
                      <img
                        src={receiveMeta.imageUri}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border/50"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/25">
                        {receiveMeta.symbol.slice(0, 2)}
                      </div>
                    )
                  ) : null}
                  {receiveKind === "custom" &&
                  !receiveMetaLoading &&
                  !receiveMeta &&
                  isValidBase58Mint(outputMintResolved) ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/50 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/50">
                      —
                    </div>
                  ) : null}
                  <Select
                    value={receiveKind}
                    onValueChange={(v) => setReceiveKind(v as SwapPresetId)}
                    disabled={frozen}
                  >
                    <SelectTrigger className={cn(selectTriggerClass, "min-w-0 flex-1")}>
                      <SelectValue placeholder="Token" className="truncate text-left text-[15px] font-semibold tracking-tight" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                      {SWAP_PRESET_TOKENS.map((t) => (
                        <SelectItem key={t.label} value={t.label} className="rounded-lg py-2.5">
                          <span className="font-medium">{t.label}</span>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="rounded-lg py-2.5">
                        {receiveSelectCustomLabel}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {receiveKind === "custom" ? (
                  <Input
                    value={receiveCustom}
                    onChange={(e) => setReceiveCustom(e.target.value)}
                    readOnly={frozen}
                    placeholder="Mint"
                    title={receiveCustom.trim() || undefined}
                    className="h-10 truncate rounded-xl border-border/40 bg-background/40 font-mono text-xs shadow-none focus-visible:ring-1 focus-visible:ring-ring/30"
                    spellCheck={false}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className={cn("space-y-3 px-4", frozen ? "pb-3 pt-0" : "pb-4 pt-1")}>
          {mode === "pumpfun" && receiveMeta?.complete && !frozen ? (
            <Alert className="rounded-xl border-border/50 bg-muted/25 py-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-sm font-medium leading-snug text-muted-foreground">
                This coin has graduated from pump.fun. The agent will use Jupiter (not the bonding-curve tool) so the
                swap matches on-chain liquidity.
              </AlertDescription>
            </Alert>
          ) : null}
          {error && !frozen ? (
            <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10 py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium leading-snug">{error}</AlertDescription>
            </Alert>
          ) : null}

          {frozen ? (
            <div
              className="border-t border-border/40 pt-3 text-center"
              role="status"
              aria-live="polite"
            >
              <p className="text-xs font-medium leading-relaxed text-muted-foreground sm:text-[13px]">
                {swapInlineStatus === "cancelled"
                  ? "You cancelled this swap. Values above are what you had selected."
                  : "Swap request sent. Check the assistant reply below for signature, confirmation, or errors."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 min-h-12 w-full rounded-xl border-border/60 text-[15px] font-semibold tracking-tight text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                onClick={() => onCancel(assistantMessageId)}
              >
                <X className="mr-2 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                className={cn(
                  "h-12 min-h-12 w-full rounded-xl text-[15px] font-semibold tracking-tight",
                  "bg-foreground text-background shadow-[0_1px_0_hsl(0_0%_100%/0.12)_inset]",
                  "hover:bg-foreground/92 active:scale-[0.99]",
                )}
                onClick={() => void handleSubmit()}
              >
                {isSubmitting ? "Checking…" : "Swap"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
