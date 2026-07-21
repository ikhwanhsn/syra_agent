/**
 * Shared RISE market row normalizer for Syra /rise scout.
 */

const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function getIpfsGatewayBase() {
  const raw = typeof process.env.IPFS_GATEWAY === "string" ? process.env.IPFS_GATEWAY.trim() : "";
  if (raw) return raw.replace(/\/$/, "");
  return "https://ipfs.io";
}

/**
 * Return an https (or data:) URL browsers and canvas Image can load.
 * RISE commonly returns ipfs://; we previously dropped those (only http*), so logos were missing.
 */
export function normalizeTokenImageUrl(raw) {
  const t = toStr(raw);
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) return t;
  if (lower.startsWith("data:image/")) return t;
  if (t.startsWith("//")) return `https:${t}`;
  const gateway = getIpfsGatewayBase();
  if (lower.startsWith("ipfs://")) {
    const path = t.slice(7).replace(/^\/+/, "");
    return `${gateway}/ipfs/${path}`;
  }
  if (t.startsWith("/ipfs/")) {
    return `${gateway}${t}`;
  }
  if (lower.startsWith("ar://")) {
    const id = t.slice(5).replace(/^\/+/, "").split("/")[0];
    if (id) return `https://arweave.net/${id}`;
  }
  return null;
}

/**
 * Normalize a single RISE market row to the lightweight shape the screener uses.
 * Tolerant to missing fields — returns nulls instead of throwing.
 */
export function normalizeRiseMarketRow(m) {
  if (!m || typeof m !== "object") return null;
  const mint = toStr(m.mint_token);
  if (!mint) return null;
  const mintMain = toStr(m.mint_main) || "";
  const isUsdcQuote = mintMain === USDC_MAINNET;
  const priceInCollateral = toNum(m.price);
  const floorInCollateral = toNum(m.mayflower_floor);
  const directPriceUsd = toNum(m.price_usd) ?? toNum(m.token_price_usd) ?? toNum(m.spot_price_usd);
  const directFloorUsd = toNum(m.mayflower_floor_usd) ?? toNum(m.floor_price_usd);
  const priceUsd =
    directPriceUsd != null
      ? directPriceUsd
      : isUsdcQuote
        ? priceInCollateral
        : priceInCollateral;
  const floorPriceUsd =
    directFloorUsd != null
      ? directFloorUsd
      : isUsdcQuote
        ? floorInCollateral
        : floorInCollateral;
  const marketCapUsd = toNum(m.market_cap_usd) ?? toNum(m.marketCapUsd);
  const floorMarketCapUsd = toNum(m.floor_market_cap_usd);
  const volume24hUsd = toNum(m.volume_h24_usd) ?? toNum(m.volumeH24Usd);
  const volumeAllTimeUsd = toNum(m.volume_all_time_usd);
  const holdersRaw = toNum(m.holders_count);
  const holders = holdersRaw != null ? Math.max(0, Math.round(holdersRaw)) : null;
  const creatorFeePct = toNum(m.creator_fee_percent);
  const startingPriceUsd = toNum(m.starting_price);
  const priceChange24hPct = toNum(m.price_variation_percentage_24h);
  const floorDeltaPct = toNum(m.delta_to_floor_percentage);
  const lockedSupplyPct = toNum(m.locked_supply_percentage);
  const level = toNum(m.level);
  const isVerified = Boolean(m.is_verified);
  const disableSell = Boolean(m.disableSell);
  const createdAt = toStr(m.created_at);
  const updatedAt = toStr(m.updated_at);
  const ageHours = createdAt ? Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3_600_000) : null;
  const tokenImage = toStr(m.token_image);
  const imageUrl = normalizeTokenImageUrl(tokenImage);
  const tokenUri = toStr(m.token_uri);
  const tokenDecimalsRaw = toNum(m.token_decimals);
  const tokenDecimals =
    tokenDecimalsRaw != null && Number.isFinite(tokenDecimalsRaw)
      ? Math.max(0, Math.min(18, Math.round(tokenDecimalsRaw)))
      : null;

  return {
    mint,
    marketAddress: toStr(m.rise_market_address),
    name: toStr(m.token_name) || "",
    symbol: toStr(m.token_symbol) || "",
    imageUrl,
    tokenUri: tokenUri && tokenUri.startsWith("http") ? tokenUri : null,
    twitterUrl: toStr(m.twitter),
    telegramUrl: toStr(m.telegram),
    discordUrl: toStr(m.discord),
    priceUsd,
    floorPriceUsd,
    marketCapUsd,
    floorMarketCapUsd,
    volume24hUsd,
    volumeAllTimeUsd,
    holders,
    creatorFeePct,
    startingPriceUsd,
    priceChange24hPct,
    floorDeltaPct,
    lockedSupplyPct,
    level,
    isVerified,
    disableSell,
    createdAt,
    updatedAt,
    ageHours,
    creator: toStr(m.creator),
    tokenDecimals,
    mintMain: mintMain || null,
  };
}
