/**
 * Read-only largest SPL token accounts for a mint (Solana mainnet RPC).
 * Uses multi-RPC fallback via solanaServerRpc (Helius → env URLs → public fallbacks).
 */
import { PublicKey } from '@solana/web3.js';
import { getMint, unpackAccount } from '@solana/spl-token';
import { withSolanaRpcFallback } from './solanaServerRpc.js';
import { resolveSplTokenProgramId } from './solanaMintProgram.js';

const MULTI_ACCOUNT_CHUNK = 100;

function rawToHuman(amountRaw, decimals) {
  const n = typeof amountRaw === 'bigint' ? Number(amountRaw) : Number(amountRaw);
  if (!Number.isFinite(n)) return null;
  return n / 10 ** decimals;
}

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {import('@solana/web3.js').PublicKey[]} addresses
 */
async function decodeTokenAccounts(connection, addresses, tokenProgramId) {
  const out = [];
  for (let i = 0; i < addresses.length; i += MULTI_ACCOUNT_CHUNK) {
    const slice = addresses.slice(i, i + MULTI_ACCOUNT_CHUNK);
    const infos = await connection.getMultipleAccountsInfo(slice, 'confirmed');
    for (let j = 0; j < slice.length; j += 1) {
      try {
        out.push(unpackAccount(slice[j], infos[j], tokenProgramId));
      } catch {
        out.push(null);
      }
    }
  }
  return out;
}

/**
 * @param {string} mintBase58
 * @param {{ limit?: number }} [opts]
 */
export async function fetchSplTokenTopHolders(mintBase58, opts = {}) {
  const limit = Math.min(50, Math.max(5, Number(opts.limit) || 20));
  const mintPk = new PublicKey(mintBase58);

  return withSolanaRpcFallback(async (connection) => {
    const tokenProgramId = await resolveSplTokenProgramId(connection, mintPk);
    const [mintInfo, largest] = await Promise.all([
      getMint(connection, mintPk, undefined, tokenProgramId),
      connection.getTokenLargestAccounts(mintPk),
    ]);

    const decimals = mintInfo.decimals;
    const supplyHuman = rawToHuman(mintInfo.supply, decimals);
    if (supplyHuman == null || supplyHuman <= 0) {
      return {
        mint: mintBase58,
        decimals,
        supplyHuman: 0,
        holders: [],
        top10ConcentrationPct: null,
      };
    }

    const pairs = largest.value.slice(0, limit);
    const tokenAccountKeys = pairs.map((p) => p.address);
    const decoded = await decodeTokenAccounts(connection, tokenAccountKeys, tokenProgramId);

    const holders = pairs.map((pair, idx) => {
      const acc = decoded[idx];
      const wallet = acc?.owner ? acc.owner.toBase58() : null;

      const uiFromRpc =
        pair.uiAmount != null && Number.isFinite(pair.uiAmount) ? pair.uiAmount : null;
      const balanceHuman =
        uiFromRpc != null
          ? uiFromRpc
          : acc?.amount != null
            ? rawToHuman(acc.amount, decimals)
            : pair.amount != null
              ? rawToHuman(pair.amount, decimals)
              : null;

      const sharePct =
        balanceHuman != null && supplyHuman > 0 ? (balanceHuman / supplyHuman) * 100 : null;

      return {
        rank: idx + 1,
        wallet,
        tokenAccount: pair.address.toBase58(),
        balanceHuman,
        sharePct,
      };
    });

    const top10 = holders.slice(0, 10);
    const top10ConcentrationPct = top10.length
      ? top10.reduce((s, h) => s + (h.sharePct ?? 0), 0)
      : null;

    return {
      mint: mintBase58,
      decimals,
      supplyHuman,
      holders,
      top10ConcentrationPct,
    };
  }, 'getTokenLargestAccounts');
}
