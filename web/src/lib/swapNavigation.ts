import type { SelectedSwapToken } from "@/components/swap/TokenSelectDialog";
import {
  decimalsForMint,
  isValidBase58Mint,
  normalizeCommonPresetMints,
  SWAP_PRESET_TOKENS,
  USDC_MINT,
  SYRA_MINT,
  WSOL_MINT,
} from "@/lib/swapPresets";

export const SWAP_DEFAULT_INPUT_MINT = WSOL_MINT;

export interface SwapTokenHints {
  symbol?: string;
  name?: string;
  icon?: string | null;
}

export interface ParsedSwapUrl {
  inputMint?: string;
  outputMint?: string;
  inputHints?: SwapTokenHints;
  outputHints?: SwapTokenHints;
}

function hintsFromParams(
  searchParams: URLSearchParams,
  prefix: "input" | "output",
): SwapTokenHints | undefined {
  const symbol = searchParams.get(`${prefix}Symbol`)?.trim();
  const name = searchParams.get(`${prefix}Name`)?.trim();
  const icon = searchParams.get(`${prefix}Icon`)?.trim();
  if (!symbol && !name && !icon) return undefined;
  return {
    ...(symbol ? { symbol } : {}),
    ...(name ? { name } : {}),
    ...(icon ? { icon } : {}),
  };
}

function parseMintParam(searchParams: URLSearchParams, key: string): string | undefined {
  const raw = searchParams.get(key)?.trim();
  if (!raw || !isValidBase58Mint(raw)) return undefined;
  return normalizeCommonPresetMints(raw);
}

export function parseSwapUrlParams(searchParams: URLSearchParams): ParsedSwapUrl {
  const inputMint = parseMintParam(searchParams, "inputMint");
  const outputMint = parseMintParam(searchParams, "outputMint");
  const inputHints = hintsFromParams(searchParams, "input");
  const outputHints = hintsFromParams(searchParams, "output");

  if (!inputMint && !outputMint) return {};

  return {
    ...(inputMint ? { inputMint } : {}),
    ...(outputMint ? { outputMint } : {}),
    ...(inputHints ? { inputHints } : {}),
    ...(outputHints ? { outputHints } : {}),
  };
}

export function buildSwapUrl(params: {
  inputMint?: string;
  outputMint?: string;
  inputHints?: SwapTokenHints;
  outputHints?: SwapTokenHints;
}): string {
  const sp = new URLSearchParams();

  if (params.inputMint && isValidBase58Mint(params.inputMint)) {
    sp.set("inputMint", normalizeCommonPresetMints(params.inputMint));
  }
  if (params.outputMint && isValidBase58Mint(params.outputMint)) {
    sp.set("outputMint", normalizeCommonPresetMints(params.outputMint));
  }
  if (params.inputHints?.symbol) sp.set("inputSymbol", params.inputHints.symbol);
  if (params.inputHints?.name) sp.set("inputName", params.inputHints.name);
  if (params.inputHints?.icon) sp.set("inputIcon", params.inputHints.icon);
  if (params.outputHints?.symbol) sp.set("outputSymbol", params.outputHints.symbol);
  if (params.outputHints?.name) sp.set("outputName", params.outputHints.name);
  if (params.outputHints?.icon) sp.set("outputIcon", params.outputHints.icon);

  const qs = sp.toString();
  return qs ? `/swap?${qs}` : "/swap";
}

/** Buy flow: pay with SOL (or USDC when buying SOL). */
export function buildBuySwapUrl(outputMint: string, hints?: SwapTokenHints): string {
  const normalized = normalizeCommonPresetMints(outputMint);
  const inputMint = normalized === WSOL_MINT ? USDC_MINT : SWAP_DEFAULT_INPUT_MINT;
  return buildSwapUrl({
    inputMint,
    outputMint: normalized,
    outputHints: hints,
  });
}

/** Canonical in-app link: swap SOL → $SYRA on /swap. */
export const SYRA_BUY_SWAP_URL = buildBuySwapUrl(SYRA_MINT, {
  symbol: "SYRA",
  name: "SYRA",
});

export function mintToSwapToken(mint: string, hints?: SwapTokenHints): SelectedSwapToken {
  const normalized = normalizeCommonPresetMints(mint);
  const preset = SWAP_PRESET_TOKENS.find((row) => row.mint === normalized);

  if (preset) {
    return {
      mint: preset.mint,
      symbol: hints?.symbol ?? preset.label,
      name: hints?.name ?? preset.label,
      decimals: preset.decimals,
      icon: hints?.icon ?? null,
      isVerified: true,
    };
  }

  return {
    mint: normalized,
    symbol: hints?.symbol ?? `${normalized.slice(0, 4)}…`,
    name: hints?.name ?? hints?.symbol ?? "Token",
    decimals: decimalsForMint(normalized) ?? 9,
    icon: hints?.icon ?? null,
    isVerified: false,
  };
}

export function isPresetMint(mint: string): boolean {
  return decimalsForMint(normalizeCommonPresetMints(mint)) != null;
}
