import axios from "axios";
import {
  Connection,
  PublicKey,
  Keypair,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createBurnInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";

// export async function buybackAndBurnSYRA(revenueAmountUSD) {
//   try {
//     const connection = new Connection(process.env.SOLANA_RPC_URL);
//     const agentKeypair = Keypair.fromSecretKey(
//       bs58.decode(process.env.AGENT_PRIVATE_KEY)
//     );
//     const syraMint = new PublicKey(process.env.SYRA_TOKEN_MINT);
//     const usdcMint = new PublicKey(process.env.USDC_MINT);

//     // Calculate 80% of revenue for buyback
//     const buybackAmountUSD = parseFloat(revenueAmountUSD) * 0.8;
//     // Convert to lamports (USDC has 6 decimals)
//     const buybackAmountLamports = Math.floor(buybackAmountUSD * 1_000_000);

//     console.log(`Buying back $${buybackAmountUSD} worth of SYRA...`);

//     // Step 1: Get quote from Jupiter for USDC -> SYRA swap
//     const quoteResponse = await axios.get("https://quote-api.jup.ag/v6/quote", {
//       params: {
//         inputMint: usdcMint.toString(),
//         outputMint: syraMint.toString(),
//         amount: buybackAmountLamports,
//         slippageBps: 100, // 1% slippage
//       },
//     });

//     console.log("Jupiter quote received:", quoteResponse.data);

//     // Step 2: Get swap transaction from Jupiter
//     const swapResponse = await axios.post(
//       "https://quote-api.jup.ag/v6/swap",
//       {
//         quoteResponse: quoteResponse.data,
//         userPublicKey: agentKeypair.publicKey.toString(),
//         wrapAndUnwrapSol: true,
//         prioritizationFeeLamports: 50000, // Priority fee
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const { swapTransaction } = swapResponse.data;

//     // Step 3: Deserialize and sign the swap transaction
//     const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
//     let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

//     // Get latest blockhash
//     const bhInfo = await connection.getLatestBlockhash("finalized");
//     transaction.message.recentBlockhash = bhInfo.blockhash;

//     // Sign the transaction
//     transaction.sign([agentKeypair]);

//     // Step 4: Send swap transaction
//     const swapSignature = await connection.sendTransaction(transaction, {
//       skipPreflight: false,
//       preflightCommitment: "confirmed",
//     });

//     console.log(`Swap transaction sent: ${swapSignature}`);

//     // Wait for confirmation
//     await connection.confirmTransaction(
//       {
//         signature: swapSignature,
//         blockhash: bhInfo.blockhash,
//         lastValidBlockHeight: bhInfo.lastValidBlockHeight,
//       },
//       "confirmed"
//     );

//     console.log(`Swap confirmed: https://solscan.io/tx/${swapSignature}`);

//     // Step 5: Get SYRA token account and burn the tokens
//     const syraTokenAccount = await getAssociatedTokenAddress(
//       syraMint,
//       agentKeypair.publicKey
//     );

//     // Get the balance of SYRA tokens just received
//     const tokenBalance = await connection.getTokenAccountBalance(
//       syraTokenAccount
//     );
//     const burnAmount = BigInt(tokenBalance.value.amount);

//     console.log(`Burning ${burnAmount} SYRA tokens...`);

//     // Create burn instruction
//     const burnIx = createBurnInstruction(
//       syraTokenAccount,
//       syraMint,
//       agentKeypair.publicKey,
//       burnAmount
//     );

//     // Create and send burn transaction
//     const { Transaction } = await import("@solana/web3.js");
//     const burnTx = new Transaction().add(burnIx);
//     burnTx.recentBlockhash = (
//       await connection.getLatestBlockhash("finalized")
//     ).blockhash;
//     burnTx.feePayer = agentKeypair.publicKey;

//     const burnSignature = await connection.sendTransaction(burnTx, [
//       agentKeypair,
//     ]);
//     await connection.confirmTransaction(burnSignature, "confirmed");

//     console.log(
//       `Burned ${burnAmount} SYRA tokens. Signature: ${burnSignature}`
//     );
//     console.log(`Burn transaction: https://solscan.io/tx/${burnSignature}`);

//     return {
//       swapSignature,
//       burnSignature,
//       amountBurned: burnAmount.toString(),
//     };
//   } catch (error) {
//     console.error("Error in buyback and burn:", error);
//     throw error;
//   }
// }

export async function buybackAndBurnSYRA(revenueAmountUSD) {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL);
    const agentKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.AGENT_PRIVATE_KEY)
    );
    const syraMint = new PublicKey(process.env.SYRA_TOKEN_MINT);
    const usdcMint = new PublicKey(process.env.USDC_MINT);

    // Calculate 80% of revenue for buyback
    const buybackAmountUSD = parseFloat(revenueAmountUSD) * 0.8;
    // Convert to lamports (USDC has 6 decimals)
    const buybackAmountLamports = Math.floor(buybackAmountUSD * 1_000_000);

    console.log(`Buying back $${buybackAmountUSD} worth of SYRA...`);

    // Use public Jupiter API endpoint
    const JUPITER_QUOTE_API = "https://public.jupiterapi.com/quote/v6/quote";
    const JUPITER_SWAP_API = "https://public.jupiterapi.com/quote/v6/swap";

    // Step 1: Get quote from Jupiter for USDC -> SYRA swap
    const quoteResponse = await axios.get(JUPITER_QUOTE_API, {
      params: {
        inputMint: usdcMint.toString(),
        outputMint: syraMint.toString(),
        amount: buybackAmountLamports,
        slippageBps: 100, // 1% slippage
      },
    });

    console.log("Jupiter quote received:", quoteResponse.data);

    // Step 2: Get swap transaction from Jupiter
    const swapResponse = await axios.post(
      JUPITER_SWAP_API,
      {
        quoteResponse: quoteResponse.data,
        userPublicKey: agentKeypair.publicKey.toString(),
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports: 50000,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { swapTransaction } = swapResponse.data;

    // Step 3: Deserialize and sign the swap transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // Get latest blockhash
    const bhInfo = await connection.getLatestBlockhash("finalized");
    transaction.message.recentBlockhash = bhInfo.blockhash;

    // Sign the transaction
    transaction.sign([agentKeypair]);

    // Step 4: Send swap transaction
    const swapSignature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    console.log(`Swap transaction sent: ${swapSignature}`);

    // Wait for confirmation
    await connection.confirmTransaction(
      {
        signature: swapSignature,
        blockhash: bhInfo.blockhash,
        lastValidBlockHeight: bhInfo.lastValidBlockHeight,
      },
      "confirmed"
    );

    console.log(`Swap confirmed: https://solscan.io/tx/${swapSignature}`);

    // Step 5: Get SYRA token account and burn the tokens
    const syraTokenAccount = await getAssociatedTokenAddress(
      syraMint,
      agentKeypair.publicKey
    );

    // Get the balance of SYRA tokens just received
    const tokenBalance = await connection.getTokenAccountBalance(
      syraTokenAccount
    );
    const burnAmount = BigInt(tokenBalance.value.amount);

    console.log(`Burning ${burnAmount} SYRA tokens...`);

    // Create burn instruction
    const burnIx = createBurnInstruction(
      syraTokenAccount,
      syraMint,
      agentKeypair.publicKey,
      burnAmount
    );

    // Create and send burn transaction
    const { Transaction } = await import("@solana/web3.js");
    const burnTx = new Transaction().add(burnIx);
    burnTx.recentBlockhash = (
      await connection.getLatestBlockhash("finalized")
    ).blockhash;
    burnTx.feePayer = agentKeypair.publicKey;

    const burnSignature = await connection.sendTransaction(burnTx, [
      agentKeypair,
    ]);
    await connection.confirmTransaction(burnSignature, "confirmed");

    console.log(
      `Burned ${burnAmount} SYRA tokens. Signature: ${burnSignature}`
    );
    console.log(`Burn transaction: https://solscan.io/tx/${burnSignature}`);

    return {
      swapSignature,
      burnSignature,
      amountBurned: burnAmount.toString(),
    };
  } catch (error) {
    console.error("Error in buyback and burn:", error);
    throw error;
  }
}
