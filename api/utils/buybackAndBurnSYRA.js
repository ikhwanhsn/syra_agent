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
import { payer } from "@faremeter/rides";

// export async function buybackAndBurnSYRA(revenueAmountUSD) {
//   try {
//     const connection = new Connection(process.env.SOLANA_RPC_URL);
//     const agentKeypair = Keypair.fromSecretKey(
//       bs58.decode(process.env.AGENT_PRIVATE_KEY)
//     );
//     const syraMint = new PublicKey(process.env.SYRA_TOKEN_MINT);
//     const usdcMint = new PublicKey(process.env.USDC_MINT);

//     // Ensure revenueAmountUSD is a number
//     const revenue =
//       typeof revenueAmountUSD === "string"
//         ? parseFloat(revenueAmountUSD)
//         : revenueAmountUSD;

//     if (isNaN(revenue) || revenue <= 0) {
//       throw new Error(`Invalid revenue amount: ${revenueAmountUSD}`);
//     }

//     // Calculate 80% of revenue for buyback
//     const buybackAmountUSD = revenue * 0.8;
//     // Convert to lamports (USDC has 6 decimals) - MUST be an integer
//     const buybackAmountLamports = Math.floor(buybackAmountUSD * 1_000_000);

//     // Validate amount is a positive integer
//     if (
//       !Number.isInteger(buybackAmountLamports) ||
//       buybackAmountLamports <= 0
//     ) {
//       throw new Error(
//         `Invalid buyback amount: ${buybackAmountLamports}. Must be a positive integer. Revenue was: ${revenue} USD`
//       );
//     }

//     console.log(
//       `Buying back $${buybackAmountUSD} worth of SYRA (${buybackAmountLamports} lamports)...`
//     );

//     // NEW API endpoints (migrated from lite-api.jup.ag)
//     const JUPITER_API_BASE = "https://api.jup.ag";
//     const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;
//     const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1/swap`;

//     // API key from environment
//     const headers = {
//       "Content-Type": "application/json",
//       "x-api-key": process.env.JUPITER_API_KEY,
//     };

//     // Step 1: Get quote from Jupiter for USDC -> SYRA swap
//     const quoteUrl = new URL(JUPITER_QUOTE_API);
//     quoteUrl.searchParams.append("inputMint", usdcMint.toString());
//     quoteUrl.searchParams.append("outputMint", syraMint.toString());
//     quoteUrl.searchParams.append("amount", buybackAmountLamports.toString());
//     quoteUrl.searchParams.append("slippageBps", "100");

//     console.log("Requesting quote:", quoteUrl.toString());

//     const quoteResponse = await axios.get(quoteUrl.toString(), { headers });

//     console.log("Jupiter quote received");

//     // Step 2: Get swap transaction from Jupiter
//     const swapResponse = await axios.post(
//       JUPITER_SWAP_API,
//       {
//         quoteResponse: quoteResponse.data,
//         userPublicKey: agentKeypair.publicKey.toString(),
//         wrapAndUnwrapSol: true,
//         dynamicComputeUnitLimit: true,
//         dynamicSlippage: true,
//         prioritizationFeeLamports: {
//           priorityLevelWithMaxLamports: {
//             maxLamports: 1000000,
//             priorityLevel: "veryHigh",
//           },
//         },
//       },
//       { headers }
//     );

//     const { swapTransaction } = swapResponse.data;

//     // Step 3: Deserialize the transaction
//     const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
//     let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

//     // Step 4: Sign the transaction
//     transaction.sign([agentKeypair]);

//     // Step 5: Send swap transaction
//     const swapSignature = await connection.sendTransaction(transaction, {
//       skipPreflight: false,
//       preflightCommitment: "confirmed",
//     });

//     console.log(`Swap transaction sent: ${swapSignature}`);

//     // Wait for confirmation
//     const latestBlockhash = await connection.getLatestBlockhash("confirmed");
//     await connection.confirmTransaction(
//       {
//         signature: swapSignature,
//         blockhash: latestBlockhash.blockhash,
//         lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
//       },
//       "confirmed"
//     );

//     console.log(`Swap confirmed: https://solscan.io/tx/${swapSignature}`);

//     // Step 6: Get SYRA token account and burn the tokens
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
//     const burnBhInfo = await connection.getLatestBlockhash("confirmed");
//     burnTx.recentBlockhash = burnBhInfo.blockhash;
//     burnTx.feePayer = agentKeypair.publicKey;

//     const burnSignature = await connection.sendTransaction(burnTx, [
//       agentKeypair,
//     ]);
//     await connection.confirmTransaction(
//       {
//         signature: burnSignature,
//         blockhash: burnBhInfo.blockhash,
//         lastValidBlockHeight: burnBhInfo.lastValidBlockHeight,
//       },
//       "confirmed"
//     );

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
//     if (error.response) {
//       console.error("API Error:", error.response.data);
//     }
//     throw error;
//   }
// }

export async function buybackAndBurnSYRA(revenueAmountUSD) {
  // try {
  //   const connection = new Connection(process.env.SOLANA_RPC_URL);
  //   const agentKeypair = Keypair.fromSecretKey(
  //     bs58.decode(process.env.AGENT_PRIVATE_KEY)
  //   );
  //   const syraMint = new PublicKey(process.env.SYRA_TOKEN_MINT);
  //   const usdcMint = new PublicKey(process.env.USDC_MINT);

  //   // Ensure revenueAmountUSD is a number
  //   const revenue =
  //     typeof revenueAmountUSD === "string"
  //       ? parseFloat(revenueAmountUSD)
  //       : revenueAmountUSD;

  //   if (isNaN(revenue) || revenue <= 0) {
  //     throw new Error(`Invalid revenue amount: ${revenueAmountUSD}`);
  //   }

  //   // Calculate 80% of revenue for buyback
  //   const buybackAmountUSD = revenue * 0.8;
  //   // Convert to lamports (USDC has 6 decimals) - MUST be an integer
  //   const buybackAmountLamports = Math.floor(buybackAmountUSD * 1_000_000);

  //   // Validate amount is a positive integer
  //   if (
  //     !Number.isInteger(buybackAmountLamports) ||
  //     buybackAmountLamports <= 0
  //   ) {
  //     throw new Error(
  //       `Invalid buyback amount: ${buybackAmountLamports}. Must be a positive integer. Revenue was: ${revenue} USD`
  //     );
  //   }

  //   console.log(
  //     `Buying back $${buybackAmountUSD} worth of SYRA (${buybackAmountLamports} lamports)...`
  //   );

  //   // NEW API endpoints (migrated from lite-api.jup.ag)
  //   const JUPITER_API_BASE = "https://api.jup.ag";
  //   const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;
  //   const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1/swap`;

  //   // API key from environment
  //   const headers = {
  //     "Content-Type": "application/json",
  //     "x-api-key": process.env.JUPITER_API_KEY,
  //   };

  //   // Step 1: Get quote from Jupiter for USDC -> SYRA swap
  //   const quoteUrl = new URL(JUPITER_QUOTE_API);
  //   quoteUrl.searchParams.append("inputMint", usdcMint.toString());
  //   quoteUrl.searchParams.append("outputMint", syraMint.toString());
  //   quoteUrl.searchParams.append("amount", buybackAmountLamports.toString());
  //   quoteUrl.searchParams.append("slippageBps", "100");

  //   console.log("Requesting quote:", quoteUrl.toString());

  //   const quoteResponse = await axios.get(quoteUrl.toString(), { headers });

  //   console.log("Jupiter quote received");

  //   // Step 2: Get swap transaction from Jupiter
  //   const swapResponse = await axios.post(
  //     JUPITER_SWAP_API,
  //     {
  //       quoteResponse: quoteResponse.data,
  //       userPublicKey: agentKeypair.publicKey.toString(),
  //       // wrapAndUnwrapSol: true,
  //       wrapAndUnwrapSol: false,
  //       // computeUnitPriceMicroLamports: "auto",
  //       skipPreflight: true,
  //       // test
  //       dynamicComputeUnitLimit: true,
  //       dynamicSlippage: true,
  //       prioritizationFeeLamports: {
  //         priorityLevelWithMaxLamports: {
  //           // maxLamports: 1000000,
  //           // priorityLevel: "veryHigh",
  //           maxLamports: 100000,
  //           priorityLevel: "medium",
  //         },
  //       },
  //     },
  //     { headers }
  //   );

  //   const { swapTransaction } = swapResponse.data;

  //   // Step 3: Deserialize the transaction
  //   const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  //   let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  //   // Step 4: Sign the transaction
  //   transaction.sign([agentKeypair]);

  //   // Step 5: Send swap transaction
  //   const swapSignature = await connection.sendTransaction(transaction, {
  //     skipPreflight: false,
  //     preflightCommitment: "confirmed",
  //   });

  //   console.log(`Swap transaction sent: ${swapSignature}`);

  //   // Wait for confirmation
  //   const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  //   await connection.confirmTransaction(
  //     {
  //       signature: swapSignature,
  //       blockhash: latestBlockhash.blockhash,
  //       lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  //     },
  //     "confirmed"
  //   );

  //   console.log(`Swap confirmed: https://solscan.io/tx/${swapSignature}`);

  //   // Step 6: Get SYRA token account address
  //   const syraTokenAccount = await getAssociatedTokenAddress(
  //     syraMint,
  //     agentKeypair.publicKey
  //   );

  //   console.log(`SYRA token account: ${syraTokenAccount.toString()}`);

  //   // Wait a bit for the account to be indexed
  //   await new Promise((resolve) => setTimeout(resolve, 2000));

  //   // Step 7: Get the balance of SYRA tokens with retries
  //   let tokenBalance;
  //   let retries = 5;

  //   while (retries > 0) {
  //     try {
  //       tokenBalance = await connection.getTokenAccountBalance(
  //         syraTokenAccount
  //       );
  //       console.log(`SYRA balance: ${tokenBalance.value.amount}`);
  //       break;
  //     } catch (error) {
  //       retries--;
  //       if (retries === 0) {
  //         throw new Error(
  //           `Failed to get token balance after 5 attempts: ${error.message}`
  //         );
  //       }
  //       console.log(`Retrying to get token balance... (${5 - retries}/5)`);
  //       await new Promise((resolve) => setTimeout(resolve, 2000));
  //     }
  //   }

  //   const burnAmount = BigInt(tokenBalance.value.amount);

  //   if (burnAmount === 0n) {
  //     throw new Error("No SYRA tokens to burn. Swap may have failed.");
  //   }

  //   console.log(`Burning ${burnAmount} SYRA tokens...`);

  //   // Step 8: Create burn instruction
  //   const burnIx = createBurnInstruction(
  //     syraTokenAccount,
  //     syraMint,
  //     agentKeypair.publicKey,
  //     burnAmount
  //   );

  //   // Create and send burn transaction
  //   const { Transaction } = await import("@solana/web3.js");
  //   const burnTx = new Transaction().add(burnIx);
  //   const burnBhInfo = await connection.getLatestBlockhash("confirmed");
  //   burnTx.recentBlockhash = burnBhInfo.blockhash;
  //   burnTx.feePayer = agentKeypair.publicKey;

  //   const burnSignature = await connection.sendTransaction(burnTx, [
  //     agentKeypair,
  //   ]);
  //   await connection.confirmTransaction(
  //     {
  //       signature: burnSignature,
  //       blockhash: burnBhInfo.blockhash,
  //       lastValidBlockHeight: burnBhInfo.lastValidBlockHeight,
  //     },
  //     "confirmed"
  //   );

  //   console.log(
  //     `Burned ${burnAmount} SYRA tokens. Signature: ${burnSignature}`
  //   );
  //   console.log(`Burn transaction: https://solscan.io/tx/${burnSignature}`);

  //   return {
  //     swapSignature,
  //     burnSignature,
  //     amountBurned: burnAmount.toString(),
  //   };
  // } catch (error) {
  //   console.error("Error in buyback and burn:", error);
  //   if (error.response) {
  //     console.error("API Error:", error.response.data);
  //   }
  //   throw error;
  // }
  return true;
}
