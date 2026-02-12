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

const isProduction = process.env.NODE_ENV === "production";

/**
 * Buy back SYRA with 80% of revenue (USDC) via Jupiter swap, then burn the SYRA.
 * Only runs in production (NODE_ENV === 'production'). In other environments, returns null without error.
 * @param {number} revenueAmountUSD - Revenue in USD (e.g. price charged for the API call)
 * @returns {Promise<{ swapSignature: string, burnSignature: string, amountBurned: string } | null>}
 */
export async function buybackAndBurnSYRA(revenueAmountUSD) {
  if (!isProduction) {
    return null;
  }

  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL);
    const agentKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.AGENT_PRIVATE_KEY),
    );
    const syraMint = new PublicKey(process.env.SYRA_TOKEN_MINT);
    const usdcMint = new PublicKey(process.env.USDC_MINT);

    const revenue =
      typeof revenueAmountUSD === "string"
        ? parseFloat(revenueAmountUSD)
        : revenueAmountUSD;

    if (isNaN(revenue) || revenue <= 0) {
      throw new Error(`Invalid revenue amount: ${revenueAmountUSD}`);
    }

    // Calculate 80% of revenue for buyback
    const buybackAmountUSD = revenue * 0.8;
    // Convert to lamports (USDC has 6 decimals) - MUST be an integer
    const buybackAmountLamports = Math.floor(buybackAmountUSD * 1_000_000);

    if (
      !Number.isInteger(buybackAmountLamports) ||
      buybackAmountLamports <= 0
    ) {
      throw new Error(
        `Invalid buyback amount: ${buybackAmountLamports}. Must be a positive integer. Revenue was: ${revenue} USD`,
      );
    }

    console.log(
      `[buyback] Buying back $${buybackAmountUSD} worth of SYRA (${buybackAmountLamports} lamports)...`,
    );

    const JUPITER_API_BASE = "https://api.jup.ag";
    const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;
    const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1/swap`;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.JUPITER_API_KEY,
    };

    const quoteUrl = new URL(JUPITER_QUOTE_API);
    quoteUrl.searchParams.append("inputMint", usdcMint.toString());
    quoteUrl.searchParams.append("outputMint", syraMint.toString());
    quoteUrl.searchParams.append("amount", buybackAmountLamports.toString());
    quoteUrl.searchParams.append("slippageBps", "100");

    const quoteResponse = await axios.get(quoteUrl.toString(), { headers });

    const swapResponse = await axios.post(
      JUPITER_SWAP_API,
      {
        quoteResponse: quoteResponse.data,
        userPublicKey: agentKeypair.publicKey.toString(),
        wrapAndUnwrapSol: false,
        skipPreflight: true,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 100000,
            priorityLevel: "medium",
          },
        },
      },
      { headers },
    );

    const { swapTransaction } = swapResponse.data;

    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    transaction.sign([agentKeypair]);

    const swapSignature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    console.log(`[buyback] Swap transaction sent: ${swapSignature}`);

    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction(
      {
        signature: swapSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed",
    );

    console.log(`[buyback] Swap confirmed: https://solscan.io/tx/${swapSignature}`);

    const syraTokenAccount = await getAssociatedTokenAddress(
      syraMint,
      agentKeypair.publicKey,
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    let tokenBalance;
    let retries = 5;

    while (retries > 0) {
      try {
        tokenBalance =
          await connection.getTokenAccountBalance(syraTokenAccount);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(
            `Failed to get token balance after 5 attempts: ${error.message}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const burnAmount = BigInt(tokenBalance.value.amount);

    if (burnAmount === 0n) {
      throw new Error("No SYRA tokens to burn. Swap may have failed.");
    }

    console.log(`[buyback] Burning ${burnAmount} SYRA tokens...`);

    const burnIx = createBurnInstruction(
      syraTokenAccount,
      syraMint,
      agentKeypair.publicKey,
      burnAmount,
    );

    const { Transaction } = await import("@solana/web3.js");
    const burnTx = new Transaction().add(burnIx);
    const burnBhInfo = await connection.getLatestBlockhash("confirmed");
    burnTx.recentBlockhash = burnBhInfo.blockhash;
    burnTx.feePayer = agentKeypair.publicKey;

    const burnSignature = await connection.sendTransaction(burnTx, [
      agentKeypair,
    ]);
    await connection.confirmTransaction(
      {
        signature: burnSignature,
        blockhash: burnBhInfo.blockhash,
        lastValidBlockHeight: burnBhInfo.lastValidBlockHeight,
      },
      "confirmed",
    );

    console.log(
      `[buyback] Burned ${burnAmount} SYRA. https://solscan.io/tx/${burnSignature}`,
    );

    return {
      swapSignature,
      burnSignature,
      amountBurned: burnAmount.toString(),
    };
  } catch (error) {
    console.error("[buyback] Error in buyback and burn:", error);
    if (error.response) {
      console.error("[buyback] API Error:", error.response.data);
    }
    throw error;
  }
}
