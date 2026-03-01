import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { ConnectChainModal, type ConnectOption } from "@/components/chat/ConnectChainModal";

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
  const {
    requestConnect,
    isPrivyMounted,
    openLoginModal,
    connectForChain,
  } = useWalletContext();

  const openConnectModal = useCallback(() => setOpen(true), []);

  const handleClose = useCallback(() => setOpen(false), []);

  const handlePick = useCallback(
    (option: ConnectOption) => {
      if (!isPrivyMounted) {
        requestConnect(option);
      } else if (option === "email") {
        openLoginModal();
      } else {
        connectForChain(option);
      }
      setOpen(false);
    },
    [isPrivyMounted, requestConnect, openLoginModal, connectForChain]
  );

  return (
    <ConnectModalContext.Provider value={{ openConnectModal }}>
      {children}
      <ConnectChainModal
        isOpen={open}
        onClose={handleClose}
        onPick={handlePick}
      />
    </ConnectModalContext.Provider>
  );
}
