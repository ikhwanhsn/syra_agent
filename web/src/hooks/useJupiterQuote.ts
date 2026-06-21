import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  baseUnitsToHuman,
  formatSwapAmount,
  getJupiterQuote,
  routeLabelsFromQuote,
  type JupiterQuote,
  type JupiterQuoteResponse,
} from "@/lib/jupiterSwapApi";
import { humanToBaseUnits } from "@/lib/swapPresets";

export interface UseJupiterQuoteParams {
  inputMint: string | null;
  outputMint: string | null;
  amountHuman: string;
  inputDecimals: number;
  outputDecimals: number;
  slippageBps: number;
  enabled?: boolean;
}

export interface JupiterQuoteDisplay {
  quote: JupiterQuote;
  referral: JupiterQuoteResponse["referral"];
  outAmountHuman: number;
  minReceivedHuman: number;
  rate: number | null;
  priceImpactPct: number | null;
  platformFeeBps: number;
  routeLabels: string[];
  outFormatted: string;
  minReceivedFormatted: string;
  rateFormatted: string | null;
}

const DEBOUNCE_MS = 350;
const REFRESH_MS = 15_000;

export function useJupiterQuote({
  inputMint,
  outputMint,
  amountHuman,
  inputDecimals,
  outputDecimals,
  slippageBps,
  enabled = true,
}: UseJupiterQuoteParams) {
  const [debouncedAmount, setDebouncedAmount] = useState(amountHuman);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedAmount(amountHuman), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [amountHuman]);

  const baseAmount = useMemo(() => {
    if (!inputMint || !outputMint || inputMint === outputMint) return null;
    return humanToBaseUnits(debouncedAmount, inputDecimals);
  }, [debouncedAmount, inputDecimals, inputMint, outputMint]);

  const queryKey = [
    "jupiter-quote",
    inputMint,
    outputMint,
    baseAmount,
    slippageBps,
  ] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!inputMint || !outputMint || !baseAmount) {
        throw new Error("Missing swap params");
      }
      const res = await getJupiterQuote({
        inputMint,
        outputMint,
        amount: baseAmount,
        slippageBps,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: enabled && Boolean(inputMint && outputMint && baseAmount),
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    retry: 1,
  });

  const display = useMemo((): JupiterQuoteDisplay | null => {
    if (!query.data?.quote) return null;
    return buildQuoteDisplay(query.data, outputDecimals, debouncedAmount);
  }, [query.data, outputDecimals, debouncedAmount]);

  return {
    ...query,
    display,
    isDebouncing: amountHuman !== debouncedAmount,
    hasValidAmount: Boolean(baseAmount),
  };
}

/** Recompute display with known output decimals. */
export function buildQuoteDisplay(
  data: JupiterQuoteResponse,
  outputDecimals: number,
  amountHuman: string,
): JupiterQuoteDisplay {
  const { quote, referral } = data;
  const outAmountHuman = baseUnitsToHuman(quote.outAmount, outputDecimals);
  const minReceivedHuman = baseUnitsToHuman(quote.otherAmountThreshold, outputDecimals);
  const inHuman = Number(amountHuman.replace(/,/g, ""));
  const rate =
    Number.isFinite(inHuman) && inHuman > 0 && outAmountHuman > 0
      ? outAmountHuman / inHuman
      : null;
  const priceImpactRaw = Number(quote.priceImpactPct);
  return {
    quote,
    referral,
    outAmountHuman,
    minReceivedHuman,
    rate,
    priceImpactPct: Number.isFinite(priceImpactRaw) ? priceImpactRaw : null,
    platformFeeBps: referral.platformFeeBps,
    routeLabels: routeLabelsFromQuote(quote),
    outFormatted: formatSwapAmount(outAmountHuman),
    minReceivedFormatted: formatSwapAmount(minReceivedHuman),
    rateFormatted: rate != null ? formatSwapAmount(rate, 8) : null,
  };
}
