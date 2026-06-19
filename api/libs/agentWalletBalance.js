import { PublicKey } from '@solana/web3.js';
import { pickSolanaConnectionForReads } from './solanaServerRpc.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const LAMPORTS_PER_SOL = 1e9;

/**
 * Fetch SOL + USDC balances for a Solana agent wallet address.
 * @param {string} agentAddress
 * @returns {Promise<{ agentAddress: string; solBalance: number; usdcBalance: number } | null>}
 */
export async function fetchAgentWalletBalances(agentAddress) {
  if (!agentAddress || typeof agentAddress !== 'string') return null;
  if (agentAddress.startsWith('0x')) return { agentAddress, solBalance: 0, usdcBalance: 0 };

  let agentPubkey;
  try {
    agentPubkey = new PublicKey(agentAddress);
  } catch {
    return null;
  }

  try {
    const picked = await pickSolanaConnectionForReads(agentPubkey);
    const solBalance = Number(picked.lamports) / LAMPORTS_PER_SOL;
    const tokenAccounts = await picked.connection.getParsedTokenAccountsByOwner(agentPubkey, {
      mint: USDC_MAINNET,
    });
    const accounts = tokenAccounts?.value ?? (Array.isArray(tokenAccounts) ? tokenAccounts : []);
    let usdcBalance = 0;
    for (const acc of accounts) {
      const parsed = acc?.account?.data?.parsed ?? acc?.account?.data;
      const info = parsed?.info ?? parsed;
      const tokenAmount = info?.tokenAmount ?? info;
      const ui = tokenAmount?.uiAmount ?? tokenAmount?.uiAmountString;
      usdcBalance += Number(ui) || 0;
    }
    return { agentAddress, solBalance, usdcBalance };
  } catch {
    return { agentAddress, solBalance: 0, usdcBalance: 0 };
  }
}
