import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isAdminWallet } from "@/constants/adminWallet";
import { useWalletContext } from "@/contexts/WalletContext";

const STORAGE_KEY = "syra.machine-money.preview-coming-soon";

type MachineMoneyPreviewContextValue = {
  /** Admin-only: when true, UI matches the public coming-soon experience. */
  previewComingSoon: boolean;
  togglePreviewComingSoon: () => void;
  setPreviewComingSoon: (value: boolean) => void;
  /** True when the connected wallet may access full Machine Money pages. */
  machineMoneyUnlocked: boolean;
};

const MachineMoneyPreviewContext = createContext<MachineMoneyPreviewContextValue | null>(null);

function readStoredPreview(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

export function MachineMoneyPreviewProvider({ children }: { children: ReactNode }) {
  const { address, connected } = useWalletContext();
  const isAdmin = isAdminWallet(connected, address);
  const [previewComingSoon, setPreviewComingSoonState] = useState(readStoredPreview);

  const setPreviewComingSoon = useCallback(
    (value: boolean) => {
      if (!isAdmin) return;
      setPreviewComingSoonState(value);
      sessionStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    },
    [isAdmin],
  );

  const togglePreviewComingSoon = useCallback(() => {
    setPreviewComingSoon(!previewComingSoon);
  }, [previewComingSoon, setPreviewComingSoon]);

  const machineMoneyUnlocked = isAdmin && !previewComingSoon;

  const value = useMemo(
    () => ({
      previewComingSoon: isAdmin ? previewComingSoon : false,
      togglePreviewComingSoon,
      setPreviewComingSoon,
      machineMoneyUnlocked,
    }),
    [isAdmin, previewComingSoon, togglePreviewComingSoon, setPreviewComingSoon, machineMoneyUnlocked],
  );

  return (
    <MachineMoneyPreviewContext.Provider value={value}>{children}</MachineMoneyPreviewContext.Provider>
  );
}

export function useMachineMoneyPreview(): MachineMoneyPreviewContextValue {
  const ctx = useContext(MachineMoneyPreviewContext);
  if (!ctx) {
    throw new Error("useMachineMoneyPreview must be used within MachineMoneyPreviewProvider");
  }
  return ctx;
}
