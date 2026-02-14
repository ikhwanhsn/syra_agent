"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { CONFIG } from "@/constants/config";
import { WalletModalProviderFixed } from "@/components/WalletModalProviderFixed";
import { ThemeProvider } from "@/app/ThemeContext";
import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => CONFIG.rpcEndpoint, []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ThemeProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProviderFixed>{children}</WalletModalProviderFixed>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}
