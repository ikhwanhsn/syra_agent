import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  ConnectChainModal,
  type ConnectOption,
} from "@/components/chat/ConnectChainModal";

interface ConnectModalContextValue {
  openConnectModal: () => void;
}

const ConnectModalContext = createContext<ConnectModalContextValue | null>(
  null
);

export function useConnectModal(): ConnectModalContextValue {
  const ctx = useContext(ConnectModalContext);
  if (!ctx) {
    throw new Error("useConnectModal must be used within ConnectModalProvider");
  }
  return ctx;
}

export function ConnectModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [booting, setBooting] = useState(false);
  const {
    requestConnect,
    isPrivyMounted,
    privyBooting,
    openLoginModal,
    connectForChain,
  } = useWalletContext();

  const openConnectModal = useCallback(() => setOpen(true), []);

  const handleClose = useCallback(() => {
    if (booting || privyBooting) return;
    setOpen(false);
  }, [booting, privyBooting]);

  const handlePick = useCallback(
    (option: ConnectOption) => {
      if (!isPrivyMounted || privyBooting) {
        setBooting(true);
        requestConnect(option);
        return;
      }
      if (option === "email") {
        openLoginModal();
      } else {
        void connectForChain("solana");
      }
      setOpen(false);
    },
    [
      isPrivyMounted,
      privyBooting,
      requestConnect,
      openLoginModal,
      connectForChain,
    ]
  );

  useEffect(() => {
    if (!booting) return;
    if (isPrivyMounted && !privyBooting) {
      setBooting(false);
      setOpen(false);
    }
  }, [booting, isPrivyMounted, privyBooting]);

  return (
    <ConnectModalContext.Provider value={{ openConnectModal }}>
      {children}
      <ConnectChainModal
        isOpen={open}
        onClose={handleClose}
        onPick={handlePick}
        booting={booting || (open && privyBooting)}
      />
    </ConnectModalContext.Provider>
  );
}
