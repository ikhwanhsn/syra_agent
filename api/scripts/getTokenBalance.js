import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

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

// export async function getTokenBalance(walletAddress, tokenMintAddress) {
//   try {
//     const connection = new Connection(
//       process.env.SOLANA_RPC_ENDPOINT || clusterApiUrl("mainnet-beta"),
//       "confirmed"
//     );

//     const walletTokenAccounts = await connection.getParsedTokenAccountsByOwner(
//       new PublicKey(walletAddress),
//       { mint: new PublicKey(tokenMintAddress) }
//     );

//     if (walletTokenAccounts?.value?.length > 0) {
//       const amount =
//         walletTokenAccounts.value[0].account.data.parsed.info.tokenAmount
//           .uiAmount;
//       console.log(`Token balance: ${amount}`);
//       return amount || 0;
//     }

//     return 0;
//   } catch (error) {
//     console.error("Error getting token balance:", error);
//     return 0;
//   }
// }
