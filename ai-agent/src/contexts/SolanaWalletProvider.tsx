import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProviderFixed } from "@/components/chat/WalletModalProviderFixed";

import "@solana/wallet-adapter-react-ui/styles.css";

const RPC_ENDPOINT =
  typeof import.meta.env?.VITE_SOLANA_RPC_URL === "string" && import.meta.env.VITE_SOLANA_RPC_URL.trim()
    ? import.meta.env.VITE_SOLANA_RPC_URL.trim()
    : "https://rpc.ankr.com/solana";

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProviderFixed>{children}</WalletModalProviderFixed>
      </WalletProvider>
    </ConnectionProvider>
  );
}
