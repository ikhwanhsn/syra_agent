"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useState } from "react";
import { AnimateIcon } from "../animate-ui/icons/icon";
import { Button } from "../ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createX402Client } from "x402-solana/client";

export function CreateSignalButton({
  onClose,
  formData,
  setFormData,
}: {
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
}) {
  const queryClient = useQueryClient();
  const { connection } = useConnection();
  const wallet: any = useWallet();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const { isError: isErrorProfile } = useQuery({
    queryKey: ["profileDataSignal", publicKey?.toBase58()],
    queryFn: async () => {
      const res = await fetch(
        `/api/profile/read?wallet=${publicKey?.toBase58()}`
      );
      if (!res.ok) {
        // Get error text or JSON
        const message = await res.text();
        throw new Error(`HTTP ${res.status}: ${message}`);
      }
      return res.json();
    },
    enabled: !!publicKey, // prevent running before wallet connects
  });

  const { data } = useQuery({
    queryKey: ["tokenData", formData.ticker],
    queryFn: () =>
      fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${formData.ticker}USDT`
      ).then((res) => res.json()),
  });

  async function verifySignal() {
    if (isErrorProfile) {
      toast.error("Please setting up your profile on profile page first!");
      return;
    }
    if (
      !formData.signal ||
      !formData.token ||
      !formData.ticker ||
      !formData.entryPrice ||
      !formData.stopLoss ||
      !formData.takeProfit
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first!");
      return;
    }

    // Signal validation
    if (formData.entryPrice < 0) {
      toast.error("Entry price must be positive");
      return;
    } else if (formData.stopLoss < 0) {
      toast.error("Stop loss must be positive");
      return;
    } else if (formData.takeProfit < 0) {
      toast.error("Take profit must be positive");
      return;
    }
    // Check if entry price is within 20% of current market price
    const currentPrice = Number(data?.price);
    const priceUpperBound = currentPrice * 1.2;
    const priceLowerBound = currentPrice * 0.8;
    const minimalBuyStopLoss = formData.entryPrice * 0.99;
    const minimalBuyTakeProfit = formData.entryPrice * 1.01;
    const minimalSellStopLoss = formData.entryPrice * 0.99;
    const minimalSellTakeProfit = formData.entryPrice * 1.01;

    if (formData.entryPrice > priceUpperBound) {
      toast.error(`Entry price too high (max: ${priceUpperBound.toFixed(2)})`);
      return;
    }
    if (formData.entryPrice < priceLowerBound) {
      toast.error(`Entry price too low (min: ${priceLowerBound.toFixed(2)})`);
      return;
    }

    if (formData.signal === "Buy") {
      // Entry price must be below current market price
      if (formData.entryPrice >= currentPrice) {
        toast.error(
          `Entry price must be below current market price (current: $${currentPrice.toFixed(
            2
          )})`
        );
        return;
      }

      // Stop loss must be at least 1% below entry
      const minStopLoss = formData.entryPrice * 0.99;
      if (formData.stopLoss > minStopLoss) {
        toast.error(
          `Stop loss must be at least 1% below entry price (min: $${minimalBuyStopLoss.toFixed(
            2
          )})`
        );
        return;
      }

      // Take profit must be at least 1% above entry
      const minTakeProfit = formData.entryPrice * 1.01;
      if (formData.takeProfit < minTakeProfit) {
        toast.error(
          `Take profit must be at least 1% above entry price (min: $${minimalBuyTakeProfit.toFixed(
            2
          )})`
        );
        return;
      }
    }

    if (formData.signal === "Sell") {
      // Entry price must be above current market price
      if (formData.entryPrice <= currentPrice) {
        toast.error(
          `Entry price must be above current market price (current: $${currentPrice.toFixed(
            2
          )})`
        );
        return;
      }

      // Stop loss must be at least 1% above entry
      const minStopLoss = formData.entryPrice * 1.01;
      if (formData.stopLoss < minStopLoss) {
        toast.error(
          `Stop loss must be at least 1% above entry price (min: $${minimalSellStopLoss.toFixed(
            2
          )})`
        );
        return;
      }

      // Take profit must be at least 1% below entry
      const maxTakeProfit = formData.entryPrice * 0.99;
      if (formData.takeProfit > maxTakeProfit) {
        toast.error(
          `Take profit must be at least 1% below entry price (min: $${minimalSellTakeProfit.toFixed(
            2
          )})`
        );
        return;
      }
    }

    const click = document.getElementById("my_modal_2") as HTMLDialogElement;
    click.showModal();
  }

  const paymentWithPayAI = async () => {
    if (!verifySignal()) return;

    setLoading(true);
    try {
      const client = createX402Client({
        wallet,
        network: "solana-devnet",
        maxPaymentAmount: BigInt(10_000_000),
      });

      const response = await client.fetch("/api/signal/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facilitator: "payai",
          wallet: publicKey?.toBase58(),
          signal: formData.signal,
          token: formData.token,
          ticker: formData.ticker,
          entryPrice: formData.entryPrice,
          stopLoss: formData.stopLoss,
          takeProfit: formData.takeProfit,
        }),
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayAI request failed: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Signal created successfully!");
        queryClient.invalidateQueries({ queryKey: ["repoDataSignal"] });
        onClose();
        setFormData({
          wallet: "",
          signal: "",
          token: "",
          ticker: "",
          entryPrice: "",
          stopLoss: "",
          takeProfit: "",
        });
      }
    } catch (error) {
      console.error("PayAI error:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  async function paymentWithSyraAI() {
    if (!verifySignal()) return;
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first!");
      return;
    }

    setLoading(true);

    try {
      // STEP 1: Ask server "how much to pay?"
      console.log("1️⃣ Requesting payment info from server...");
      const quoteRes = await fetch("/api/signal/create", {
        method: "GET",
      });
      const quote = await quoteRes.json();

      if (quoteRes.status !== 402) {
        throw new Error("Expected 402 payment required");
      }

      console.log("💳 Payment required:", quote.accepts[0]);

      // STEP 2: Check and setup token accounts
      console.log("2️⃣ Checking token accounts...");
      const mint = new PublicKey(quote.accepts[0].asset);
      // const recipientWallet = new PublicKey(
      //   quote.accepts[0].extra.recipientWallet
      // );
      const recipientWallet = new PublicKey(
        "Cp5yFGYx88EEuUjhDAaQzXHrgxvVeYEWixtRnLFE81K4"
      );

      // Get associated token accounts
      const senderTokenAccount = await getAssociatedTokenAddress(
        mint,
        publicKey
      );

      const recipientTokenAccount = await getAssociatedTokenAddress(
        mint,
        recipientWallet
      );

      console.log("📍 Sender token account:", senderTokenAccount.toBase58());
      console.log(
        "📍 Recipient token account:",
        recipientTokenAccount.toBase58()
      );

      // Create transaction
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      const tx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      });

      // Check if sender's token account exists
      let senderAccountExists = false;
      try {
        await getAccount(connection, senderTokenAccount);
        senderAccountExists = true;
        console.log("✅ Sender USDC account exists");
      } catch (error) {
        console.log("⚠️ Sender USDC account doesn't exist - will create it");

        // Add instruction to create sender's token account
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            senderTokenAccount, // ata
            publicKey, // owner
            mint // mint
          )
        );
      }

      // Check if recipient's token account exists
      let recipientAccountExists = false;
      try {
        await getAccount(connection, recipientTokenAccount);
        recipientAccountExists = true;
        console.log("✅ Recipient USDC account exists");
      } catch (error) {
        console.log("⚠️ Recipient USDC account doesn't exist - will create it");

        // Add instruction to create recipient's token account
        // User pays for this (required for first-time recipients)
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer (you pay to create their account)
            recipientTokenAccount, // ata
            recipientWallet, // owner (server)
            mint // mint
          )
        );
      }

      if (senderAccountExists) {
        try {
          const accountInfo = await getAccount(connection, senderTokenAccount);
          const balance = Number(accountInfo.amount); // accountInfo.amount is already a bigint
          console.log(`💰 Your USDC balance: ${balance / 1000000} USDC`);

          const requiredAmount = Number(quote.accepts[0].maxAmountRequired);

          if (balance < requiredAmount) {
            throw new Error(
              `Insufficient USDC balance. You have ${
                balance / 1000000
              } USDC but need ${
                requiredAmount / 1000000
              } USDC.\n\nGet devnet USDC from: https://spl-token-faucet.com/`
            );
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("Insufficient")
          ) {
            throw error;
          }
          console.warn("Could not check balance:", error);
        }
      }

      const transferAmount = Number(quote.accepts[0].maxAmountRequired);
      tx.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      console.log(`💸 Transfer amount: ${transferAmount / 1000000} USDC`);

      // Get transaction size for debugging
      const txSize = tx.serialize({ requireAllSignatures: false }).length;
      console.log(`📦 Transaction size: ${txSize} bytes`);

      // STEP 3: Simulate transaction locally first
      console.log("3️⃣ Testing transaction locally...");
      try {
        const simulation = await connection.simulateTransaction(tx);

        if (simulation.value.err) {
          console.error("❌ Simulation failed:", simulation.value.err);
          console.error("Logs:", simulation.value.logs);

          throw new Error(
            `Transaction simulation failed: ${JSON.stringify(
              simulation.value.err
            )}\n\nLogs:\n${simulation.value.logs?.join("\n")}`
          );
        }

        console.log("✅ Simulation successful");
        console.log("Logs:", simulation.value.logs);
      } catch (error) {
        console.error("Simulation error:", error);
        throw new Error(
          `Transaction will fail: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // STEP 4: Ask user to sign
      console.log("4️⃣ Requesting wallet signature...");
      const signedTx = await signTransaction(tx);
      console.log("✅ Transaction signed");

      // STEP 5: Prepare signal data
      const signalData = {
        facilitator: "syraai",
        wallet: publicKey.toBase58(),
        signal: formData.signal,
        token: formData.token,
        ticker: formData.ticker,
        entryPrice: Number(formData.entryPrice),
        stopLoss: Number(formData.stopLoss),
        takeProfit: Number(formData.takeProfit),
      };

      // STEP 6: Send signed transaction to server
      console.log("5️⃣ Sending payment proof to server...");
      const serializedTx = signedTx.serialize().toString("base64");

      const paymentProof = {
        x402Version: 1,
        scheme: "exact",
        network: "solana-devnet",
        payer: publicKey.toBase58(), // ADD: Payer address
        payload: {
          serializedTransaction: serializedTx,
        },
      };

      const xPaymentHeader = Buffer.from(JSON.stringify(paymentProof)).toString(
        "base64"
      );

      // STEP 7: Server verifies and creates signal
      console.log("6️⃣ Server verifying payment and creating signal...");
      const response = await fetch("/api/signal/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": xPaymentHeader,
        },
        body: JSON.stringify(signalData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Success:", result);
        toast.success("Signal created successfully!");
        queryClient.invalidateQueries({ queryKey: ["repoDataSignal"] });
        queryClient.invalidateQueries({
          queryKey: ["repoDataSignalStatistic"],
        });
        onClose();
        setFormData({
          wallet: "",
          signal: "",
          token: "",
          ticker: "",
          entryPrice: "",
          stopLoss: "",
          takeProfit: "",
        });
      } else {
        console.error("❌ Server error:", result);

        let errorMsg = `Failed: ${result.error}`;
        if (result.details) {
          errorMsg += `\n\nDetails: ${result.details}`;
        }
        if (result.logs) {
          errorMsg += `\n\nLogs:\n${result.logs.join("\n")}`;
        }

        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimateIcon animateOnHover>
      <Button
        className="cursor-pointer w-full"
        onClick={verifySignal}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit"}
      </Button>
      <dialog id="my_modal_2" className="modal">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg text-center">Choose Your Payment</h3>
          <div className="flex items-center justify-center gap-3 mt-7">
            <Button
              className="cursor-pointer"
              onClick={() => {
                paymentWithSyraAI();
              }}
            >
              Pay with Syra AI
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => {
                paymentWithPayAI();
              }}
            >
              Pay with PayAI
            </Button>
          </div>
          {/* <p className="py-4">Press ESC key or click outside to close</p> */}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </AnimateIcon>
  );
}
