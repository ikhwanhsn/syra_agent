import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import {
  createLabWallet,
  createLabWalletsBulk,
  distributeLabDeposit,
  fetchLabDeposit,
  fetchLabWallets,
  fetchLabX402Calls,
  fetchLabX402Endpoints,
  fetchLabX402Settings,
  runLabX402,
  updateLabX402Settings,
  type LabChain,
  type LabX402Settings,
} from "@/lib/labsX402Api";

const STALE_MS = 15_000;
const POLL_MS = 30_000;

export function useLabsX402(chain: LabChain = "solana") {
  const { connected, address } = useWalletContext();
  const allowed = isAdminWallet(connected, address);
  const adminWallet = address ?? "";

  const walletsQ = useQuery({
    queryKey: ["labs-x402", "wallets", chain, adminWallet],
    queryFn: () => fetchLabWallets(adminWallet, chain),
    enabled: allowed && Boolean(adminWallet),
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const settingsQ = useQuery({
    queryKey: ["labs-x402", "settings", chain, adminWallet],
    queryFn: () => fetchLabX402Settings(adminWallet, chain),
    enabled: allowed && Boolean(adminWallet),
    staleTime: STALE_MS,
  });

  const callsQ = useQuery({
    queryKey: ["labs-x402", "calls", chain, adminWallet],
    queryFn: () => fetchLabX402Calls(adminWallet, 10, chain),
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

  const depositQ = useQuery({
    queryKey: ["labs-x402", "deposit", chain, adminWallet],
    queryFn: () => fetchLabDeposit(adminWallet, chain),
    enabled: allowed && Boolean(adminWallet),
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const qc = useQueryClient();

  const createWalletM = useMutation({
    mutationFn: (input: { label: string; role: "payer" | "payto" }) =>
      createLabWallet(adminWallet, { ...input, chain }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets", chain] });
    },
  });

  const createWalletsBulkM = useMutation({
    mutationFn: (input: { count: number; labelPrefix?: string }) =>
      createLabWalletsBulk(adminWallet, { ...input, chain }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets", chain] });
    },
  });

  const updateSettingsM = useMutation({
    mutationFn: (patch: Partial<LabX402Settings>) =>
      updateLabX402Settings(adminWallet, patch, chain),
    onSuccess: (data) => {
      qc.setQueryData(["labs-x402", "settings", chain, adminWallet], data);
    },
  });

  const runM = useMutation({
    mutationFn: (input?: { payerAddress?: string; endpoint?: string }) =>
      runLabX402(adminWallet, { ...input, chain }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "calls", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets", chain] });
    },
  });

  const distributeDepositM = useMutation({
    mutationFn: () => distributeLabDeposit(adminWallet, chain),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "deposit", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "settings", chain] });
    },
  });

  return {
    allowed,
    adminWallet,
    chain,
    walletsQ,
    settingsQ,
    callsQ,
    endpointsQ,
    depositQ,
    createWalletM,
    createWalletsBulkM,
    updateSettingsM,
    runM,
    distributeDepositM,
  };
}
