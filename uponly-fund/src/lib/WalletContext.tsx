import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { VersionedTransaction } from "@solana/web3.js";
import { toast } from "@/components/ui/sonner";

type WalletStatus = "idle" | "connecting" | "connected" | "no-provider";

type PhantomPublicKey = { toString(): string };

type ConnectOptions = { onlyIfTrusted?: boolean };

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey: PhantomPublicKey | null;
  connect(options?: ConnectOptions): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  signTransaction?(transaction: VersionedTransaction): Promise<VersionedTransaction>;
  signAllTransactions?(transactions: VersionedTransaction[]): Promise<VersionedTransaction[]>;
  on(event: "disconnect" | "accountChanged", handler: (next: PhantomPublicKey | null) => void): void;
  off(event: "disconnect" | "accountChanged", handler: (next: PhantomPublicKey | null) => void): void;
};

type WalletContextValue = {
  status: WalletStatus;
  hasProvider: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  signAllTransactions: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const provider = window.solana;
  if (!provider || !provider.isPhantom) return null;
  return provider;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const suppressDisconnectToastRef = useRef(false);

  const syncFromProvider = useCallback((provider: PhantomProvider | null) => {
    if (!provider) {
      setPublicKey(null);
      setStatus("no-provider");
      return;
    }
    // Do not hydrate from provider.publicKey — user must call connect() so Phantom shows its popup.
    setStatus("idle");
  }, []);

  useEffect(() => {
    const provider = getPhantomProvider();
    syncFromProvider(provider);

    if (!provider) return;

    const onDisconnect = () => {
      setPublicKey(null);
      setStatus("idle");
      if (!suppressDisconnectToastRef.current) {
        toast.info("Wallet disconnected");
      }
    };

    const onAccountChanged = (next: PhantomPublicKey | null) => {
      const nextKey = next?.toString() ?? null;
      setPublicKey(nextKey);
      setStatus(nextKey ? "connected" : "idle");
    };

    provider.on("disconnect", onDisconnect);
    provider.on("accountChanged", onAccountChanged);

    return () => {
      provider.off("disconnect", onDisconnect);
      provider.off("accountChanged", onAccountChanged);
    };
  }, [syncFromProvider]);

  const connect = useCallback(async () => {
    const provider = getPhantomProvider();
    if (!provider) {
      setStatus("no-provider");
      toast.error("Phantom wallet is not installed");
      return;
    }
    setStatus("connecting");
    suppressDisconnectToastRef.current = true;
    try {
      // Clear any lingering Phantom session so connect() always opens the wallet approval popup.
      if (provider.publicKey) {
        await provider.disconnect();
      }
      const { publicKey: key } = await provider.connect({ onlyIfTrusted: false });
      const wallet = key.toString();
      setPublicKey(wallet);
      setStatus("connected");
      toast.success("Wallet connected");
    } catch (error) {
      setStatus("idle");
      const message = error instanceof Error ? error.message : "Connection failed";
      toast.error(message);
    } finally {
      suppressDisconnectToastRef.current = false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    const provider = getPhantomProvider();
    if (!provider) {
      setStatus("no-provider");
      return;
    }
    try {
      await provider.disconnect();
      setPublicKey(null);
      setStatus("idle");
      toast.info("Wallet disconnected");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Disconnect failed";
      toast.error(message);
    }
  }, []);

  const signTransaction = useCallback(async (tx: VersionedTransaction) => {
    const provider = getPhantomProvider();
    if (!provider?.signTransaction) {
      throw new Error("Phantom signTransaction is not available");
    }
    return provider.signTransaction(tx);
  }, []);

  const signAllTransactions = useCallback(async (txs: VersionedTransaction[]) => {
    const provider = getPhantomProvider();
    if (!provider?.signAllTransactions) {
      throw new Error("Phantom signAllTransactions is not available");
    }
    return provider.signAllTransactions(txs);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      hasProvider: status !== "no-provider",
      publicKey,
      connect,
      disconnect,
      signTransaction,
      signAllTransactions,
    }),
    [connect, disconnect, publicKey, signAllTransactions, signTransaction, status],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}
