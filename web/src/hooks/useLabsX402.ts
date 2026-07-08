import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import {
  createLabWallet,
  fetchLabWallets,
  fetchLabX402Calls,
  fetchLabX402Endpoints,
  fetchLabX402Settings,
  runLabX402,
  updateLabX402Settings,
  type LabX402Settings,
} from "@/lib/labsX402Api";

const STALE_MS = 15_000;
const POLL_MS = 30_000;

export function useLabsX402() {
  const { connected, address } = useWalletContext();
  const allowed = isAdminWallet(connected, address);
  const adminWallet = address ?? "";

  const walletsQ = useQuery({
    queryKey: ["labs-x402", "wallets", adminWallet],
    queryFn: () => fetchLabWallets(adminWallet),
    enabled: allowed && Boolean(adminWallet),
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const settingsQ = useQuery({
    queryKey: ["labs-x402", "settings", adminWallet],
    queryFn: () => fetchLabX402Settings(adminWallet),
    enabled: allowed && Boolean(adminWallet),
    staleTime: STALE_MS,
  });

  const callsQ = useQuery({
    queryKey: ["labs-x402", "calls", adminWallet],
    queryFn: () => fetchLabX402Calls(adminWallet),
    enabled: allowed && Boolean(adminWallet),
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const endpointsQ = useQuery({
    queryKey: ["labs-x402", "endpoints", adminWallet],
    queryFn: () => fetchLabX402Endpoints(adminWallet),
    enabled: allowed && Boolean(adminWallet),
    staleTime: 60_000,
  });

  const qc = useQueryClient();

  const createWalletM = useMutation({
    mutationFn: (input: { label: string; role: "payer" | "payto" }) =>
      createLabWallet(adminWallet, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets"] });
    },
  });

  const updateSettingsM = useMutation({
    mutationFn: (patch: Partial<LabX402Settings>) => updateLabX402Settings(adminWallet, patch),
    onSuccess: (data) => {
      qc.setQueryData(["labs-x402", "settings", adminWallet], data);
    },
  });

  const runM = useMutation({
    mutationFn: (input?: { payerAddress?: string; endpoint?: string }) =>
      runLabX402(adminWallet, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "calls"] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets"] });
    },
  });

  return {
    allowed,
    adminWallet,
    walletsQ,
    settingsQ,
    callsQ,
    endpointsQ,
    createWalletM,
    updateSettingsM,
    runM,
  };
}
