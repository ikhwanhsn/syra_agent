import { Connection, PublicKey } from "@solana/web3.js";

/**
 * Largest SPL holders + supply for concentration / "whale" skew (pump.fun compatible mints).
 * @param {string} mintStr
 * @param {string} rpcUrl
 * @returns {Promise<{
 *   ok: boolean;
 *   top10Pct: number | null;
 *   top1Pct: number | null;
 *   supplyUi: number | null;
 *   error?: string;
 * }>}
 */
export async function fetchSolanaHolderSkew(mintStr, rpcUrl) {
  try {
    const mint = new PublicKey(mintStr.trim());
    const connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 25_000,
    });
    const [largest, supplyInfo] = await Promise.all([
      connection.getTokenLargestAccounts(mint),
      connection.getTokenSupply(mint),
    ]);
    const supplyUi = supplyInfo.value.uiAmount;
    if (supplyUi == null || !Number.isFinite(supplyUi) || supplyUi <= 0) {
      return { ok: true, top10Pct: null, top1Pct: null, supplyUi: null };
    }
    const rows = largest.value;
    if (!rows?.length) {
      return { ok: true, top10Pct: null, top1Pct: null, supplyUi };
    }
    let sum10 = 0;
    const n = Math.min(10, rows.length);
    for (let i = 0; i < n; i++) {
      const ui = rows[i].uiAmount;
      if (typeof ui === "number" && Number.isFinite(ui)) sum10 += ui;
    }
    const top1Ui = typeof rows[0].uiAmount === "number" ? rows[0].uiAmount : 0;
    return {
      ok: true,
      top10Pct: sum10 / supplyUi,
      top1Pct: top1Ui / supplyUi,
      supplyUi,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      top10Pct: null,
      top1Pct: null,
      supplyUi: null,
      error: msg,
    };
  }
}
