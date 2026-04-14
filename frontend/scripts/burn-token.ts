import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createBurnInstruction,
  getOrCreateAssociatedTokenAccount,
  burn,
} from "@solana/spl-token";
import fs from "fs";

type BurnTokenParams = {
  wallet: any;
  mintAddress: string;
  decimals: number;
  amountToBurn: number;
};

export const burnToken = async ({
  wallet,
  mintAddress,
  decimals,
  amountToBurn,
}: BurnTokenParams) => {
  try {
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    const mint = new PublicKey(mintAddress);
    const owner = wallet.publicKey;

    // 1️⃣ Get user's token account
    const tokenAccount = await getAssociatedTokenAddress(mint, owner);
    const accountInfo = await getAccount(connection, tokenAccount);

    // 2️⃣ Convert balance from smallest unit
    const userBalance = Number(accountInfo.amount) / 10 ** decimals;

    // 3️⃣ Check if user holds minimum 100 tokens
    if (userBalance < 100) {
      alert("❌ You must hold at least 100 tokens to burn.");
      return;
    }

    // 4️⃣ Create burn instruction
    const burnIx = createBurnInstruction(
      tokenAccount,
      mint,
      owner,
      amountToBurn // in smallest unit
    );

    // 5️⃣ Build and send transaction (wallet approval)
    const tx = new Transaction().add(burnIx);
    await wallet.sendTransaction(tx, connection);

    alert("🔥 Token burned successfully!");
  } catch (err) {
    console.error("❌ Burn failed:", err instanceof Error ? err.message : "Unknown error");
    alert("Failed to burn token. Check console for details.");
  }
};

// await burnToken(
//   window.solana,                      // user's wallet (Phantom, Backpack, etc.)
//   "YourTokenMintAddressHere",         // your token mint
//   9,                                  // token decimals
//   1_000_000_000                       // burn 1 token (if decimals = 9)
// );

type BurnTokenByAgentParams = {
  mintAddress: string;
  decimals: number;
  amountToBurn: number;
};

// 🔹 AI Agent Burn Function
export const burnTokenByAgent = async ({
  mintAddress,
  decimals,
  amountToBurn,
}: BurnTokenByAgentParams) => {
  try {
    // 1️⃣ Connect to Solana
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // 2️⃣ Load agent wallet (private key stored securely on server)
    const secretKey = Uint8Array.from(
      JSON.parse(fs.readFileSync("agent-wallet.json", "utf-8"))
    );
    const agentWallet = Keypair.fromSecretKey(secretKey);

    // 3️⃣ Token mint and account
    const mint = new PublicKey(mintAddress);

    // 4️⃣ Get or create token account owned by agent
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      agentWallet, // payer
      mint, // mint
      agentWallet.publicKey // owner
    );

    // 5️⃣ Get balance
    const accountInfo = await getAccount(connection, tokenAccount.address);
    const balance = Number(accountInfo.amount) / 10 ** decimals;

    // 6️⃣ Check if agent holds at least 100 tokens
    if (balance < 100) {
      return;
    }

    // 7️⃣ Burn token
    const txSig = await burn(
      connection,
      agentWallet, // payer
      tokenAccount.address, // token account
      mint,
      agentWallet, // authority
      amountToBurn // in smallest unit
    );

    return txSig;
  } catch (err) {
    console.error("❌ Burn failed:", err instanceof Error ? err.message : "Unknown error");
    throw err;
  }
};

// await burnTokenByAgent(
//   "YourTokenMintAddressHere", // token mint
//   9,                          // decimals
//   1_000_000_000               // burn 1 token
// );
