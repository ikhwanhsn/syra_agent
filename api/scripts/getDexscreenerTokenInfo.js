export async function getDexscreenerTokenInfo(tokenAddress) {
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
  );
  const data = await response.json();
  return data;
}
