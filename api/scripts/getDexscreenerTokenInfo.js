const DEX_TIMEOUT_MS = 8_000;

export async function getDexscreenerTokenInfo(tokenAddress) {
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
    {
      headers: { Accept: "application/json" },
      signal:
        typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(DEX_TIMEOUT_MS)
          : undefined,
    },
  );
  if (!response.ok) {
    throw new Error(`DexScreener ${response.status}`);
  }
  return response.json();
}
