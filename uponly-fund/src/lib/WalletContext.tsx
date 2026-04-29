import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "@/components/ui/sonner";

const AUTOCONNECT_KEY = "uof.wallet.autoconnect";

type WalletStatus = "idle" | "connecting" | "connected" | "no-provider";

type PhantomPublicKey = { toString(): string };

type ConnectOptions = { onlyIfTrusted?: boolean };

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey: PhantomPublicKey | null;
  connect(options?: ConnectOptions): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  on(event: "disconnect" | "accountChanged", handler: (next: PhantomPublicKey | null) => void): void;
  off(event: "disconnect" | "accountChanged", handler: (next: PhantomPublicKey | null) => void): void;
};

type WalletContextValue = {
  status: WalletStatus;
  hasProvider: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
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

  const syncFromProvider = useCallback((provider: PhantomProvider | null) => {
    const key = provider?.publicKey?.toString() ?? null;
    setPublicKey(key);
    if (!provider) {
      setStatus("no-provider");
      return;
    }
    setStatus(key ? "connected" : "idle");
  }, []);

  useEffect(() => {
    const provider = getPhantomProvider();
    syncFromProvider(provider);

    if (!provider) return;

    const onDisconnect = () => {
      setPublicKey(null);
      setStatus("idle");
      localStorage.removeItem(AUTOCONNECT_KEY);
      toast.info("Wallet disconnected");
    };

    const onAccountChanged = (next: PhantomPublicKey | null) => {
      const nextKey = next?.toString() ?? null;
      setPublicKey(nextKey);
      setStatus(nextKey ? "connected" : "idle");
    };

    provider.on("disconnect", onDisconnect);
    provider.on("accountChanged", onAccountChanged);

    const shouldAutoConnect = localStorage.getItem(AUTOCONNECT_KEY) === "1";
    if (shouldAutoConnect) {
      provider
        .connect({ onlyIfTrusted: true })
        .then(({ publicKey: key }) => {
          const wallet = key.toString();
          setPublicKey(wallet);
          setStatus("connected");
        })
        .catch(() => {
          setStatus("idle");
        });
    }

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
    try {
      const { publicKey: key } = await provider.connect();
      const wallet = key.toString();
      setPublicKey(wallet);
      setStatus("connected");
      localStorage.setItem(AUTOCONNECT_KEY, "1");
      toast.success("Wallet connected");
    } catch (error) {
      setStatus("idle");
      const message = error instanceof Error ? error.message : "Connection failed";
      toast.error(message);
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
      localStorage.removeItem(AUTOCONNECT_KEY);
      toast.info("Wallet disconnected");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Disconnect failed";
      toast.error(message);
    }
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      hasProvider: status !== "no-provider",
      publicKey,
      connect,
      disconnect,
    }),
    [connect, disconnect, publicKey, status],
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
