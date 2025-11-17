"use client";

import { Button } from "@/components/ui/button";
import "@payai/x402-solana-react/styles";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import dynamic from "next/dynamic";
import { createX402Client } from "x402-solana/client";

const WalletMultiButtonDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function Paywall() {
  const wallet: any = useWallet();

  const testingX402Paywall = async () => {
    // const wallet: any = wallets[0];

    // Create x402 client
    const client = createX402Client({
      wallet,
      network: "solana-devnet",
      maxPaymentAmount: BigInt(10_000_000), // Optional safety limit
    });

    // Make request - SDK handles everything
    const response = await client.fetch("/api/payai/test", {
      method: "POST",
      body: JSON.stringify({ your: "data" }),
    });
    const result = await response.json();
    console.log("Paid request response:", result);
  };

  return (
    <div className="min-h-screen">
      <div className="pt-4 border-t border-gray-800">
        <WalletModalProvider>
          <WalletMultiButtonDynamic />
        </WalletModalProvider>
      </div>
      <h1>Premium Content</h1>
      <Button onClick={testingX402Paywall}>Pay for Access</Button>
    </div>
  );
}
