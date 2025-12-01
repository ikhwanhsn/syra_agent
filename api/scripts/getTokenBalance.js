import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");

/**
 * Get SPL token balance for a specific mint
 * @param {string} walletAddress - Solana wallet public key
 * @param {string} mintAddress - SPL Token mint address
 * @returns {Promise<number>} token balance (uiAmount)
 */
export async function getTokenBalance(walletAddress, mintAddress) {
  try {
    if (!walletAddress) throw new Error("Wallet address missing");

    const publicKey = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { mint }
    );

    if (tokenAccounts.value.length === 0) return 0;

    const balanceData =
      tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;

    return balanceData;
  } catch (error) {
    console.error("Error reading SPL token balance:", error);
    return 0;
  }
}
