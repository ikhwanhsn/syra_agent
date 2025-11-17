// components/PaidAPICall.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { wrap as wrapFetch } from "@faremeter/fetch";
import { Button } from "../ui/button";

export default function PaidAPICall() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const makePayment = async () => {
    if (!publicKey || !signTransaction) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      // Get payment configuration from your API
      const configResponse = await fetch("/api/corbits/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPublicKey: publicKey.toString() }),
      });

      const config = await configResponse.json();

      const network = config.network;
      const connection = new Connection(clusterApiUrl(network));
      const mint = new PublicKey(config.mint);

      // Create wallet adapter compatible with faremeter
      const wallet: any = {
        publicKey,
        signTransaction: async (tx: Transaction | VersionedTransaction) => {
          if (!signTransaction)
            throw new Error("Wallet cannot sign transactions");
          return await signTransaction(tx);
        },
        signAllTransactions: async (
          txs: (Transaction | VersionedTransaction)[]
        ) => {
          if (!signAllTransactions)
            throw new Error("Wallet cannot sign transactions");
          return await signAllTransactions(txs);
        },
      };

      // Wrap fetch with payment handler
      const fetchWithPayer = wrapFetch(fetch, {
        handlers: [createPaymentHandler(wallet, mint, connection)],
      });

      // Make the paid API request
      const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getBlockHeight",
      };

      const response = await fetchWithPayer(config.apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Latest Block Height:", data.result);
      alert(`Success! Block height: ${data.result}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Payment failed. Check console for details.");
    }
  };

  return (
    <div>
      <Button onClick={makePayment} disabled={!publicKey}>
        Make Paid API Call
      </Button>
    </div>
  );
}
