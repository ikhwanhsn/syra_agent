/**
 * On-chain SPL mint security read (free — uses Syra Solana RPC with fallbacks).
 */
import { PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { withSolanaRpcFallback } from './solanaServerRpc.js';
import { resolveSplTokenProgramId } from './solanaMintProgram.js';

/**
 * @param {string} mintBase58
 */
export async function fetchOnChainMintSecurity(mintBase58) {
  const mintPk = new PublicKey(mintBase58);

  return withSolanaRpcFallback(async (connection) => {
    const tokenProgramId = await resolveSplTokenProgramId(connection, mintPk);
    const mintInfo = await getMint(connection, mintPk, undefined, tokenProgramId);

    const mintAuthority = mintInfo.mintAuthority?.toBase58() ?? null;
    const freezeAuthority = mintInfo.freezeAuthority?.toBase58() ?? null;

    return {
      mint: mintBase58,
      decimals: mintInfo.decimals,
      supplyRaw: mintInfo.supply.toString(),
      mintAuthorityRenounced: mintAuthority === null,
      freezeAuthorityRenounced: freezeAuthority === null,
      mintAuthority,
      freezeAuthority,
      isInitialized: mintInfo.isInitialized,
    };
  }, 'getMint');
}
