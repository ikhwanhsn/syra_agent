import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import {
  createLabWallet,
  createLabWalletsBulk,
  distributeLabDeposit,
  fetchLabDeposit,
  fetchLabTreasury,
  fetchLabWallets,
  fetchLabX402Calls,
  fetchLabX402Endpoints,
  fetchLabX402Settings,
  fetchLabX402Volume,
  resumeLabTreasury,
  runLabX402,
  updateLabX402Settings,
  type LabChain,
  type LabX402Settings,
} from "@/lib/labsX402Api";

const STALE_MS = 15_000;
const POLL_MS = 30_000;

export function useLabsX402(chain: LabChain = "solana") {
  const { connected, address } = useWalletContext();
  const { syraAuthReady, syraAuthenticated } = useSyraAuth();
  const allowed = isAdminWallet(connected, address);
  const adminWallet = address ?? "";
  const canFetch = allowed && Boolean(adminWallet) && syraAuthReady && syraAuthenticated;

  const walletsQ = useQuery({
    queryKey: ["labs-x402", "wallets", chain, adminWallet],
    queryFn: () => fetchLabWallets(adminWallet, chain),
    enabled: canFetch,
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const settingsQ = useQuery({
    queryKey: ["labs-x402", "settings", chain, adminWallet],
    queryFn: () => fetchLabX402Settings(adminWallet, chain),
    enabled: canFetch,
    staleTime: STALE_MS,
  });

  const callsQ = useQuery({
    queryKey: ["labs-x402", "calls", chain, adminWallet],
    queryFn: () => fetchLabX402Calls(adminWallet, 10, chain),
    enabled: canFetch,
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const volumeQ = useQuery({
    queryKey: ["labs-x402", "volume", chain, adminWallet],
    queryFn: () => fetchLabX402Volume(adminWallet, chain),
    enabled: canFetch,
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const endpointsQ = useQuery({
    queryKey: ["labs-x402", "endpoints", adminWallet],
    queryFn: () => fetchLabX402Endpoints(adminWallet),
    enabled: canFetch,
    staleTime: 60_000,
  });

  const depositQ = useQuery({
    queryKey: ["labs-x402", "deposit", chain, adminWallet],
    queryFn: () => fetchLabDeposit(adminWallet, chain),
    enabled: canFetch,
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const treasuryQ = useQuery({
    queryKey: ["labs-x402", "treasury", chain, adminWallet],
    queryFn: () => fetchLabTreasury(adminWallet, chain),
    enabled: canFetch,
    staleTime: STALE_MS,
    refetchInterval: POLL_MS,
  });

  const qc = useQueryClient();

  const createWalletM = useMutation({
    mutationFn: (input: { label: string; role: "payer" | "payto" }) =>
      createLabWallet(adminWallet, { ...input, chain }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "treasury", chain] });
    },
  });

  const createWalletsBulkM = useMutation({
    mutationFn: (input: { count: number; labelPrefix?: string }) =>
      createLabWalletsBulk(adminWallet, { ...input, chain }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "treasury", chain] });
    },
  });

  const updateSettingsM = useMutation({
    mutationFn: (patch: Partial<LabX402Settings>) =>
      updateLabX402Settings(adminWallet, patch, chain),
    onSuccess: (data) => {
      qc.setQueryData(["labs-x402", "settings", chain, adminWallet], data);
      void qc.invalidateQueries({ queryKey: ["labs-x402", "volume", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "treasury", chain] });
    },
  });

  const runM = useMutation({
    mutationFn: (input?: { payerAddress?: string; endpoint?: string }) =>
      runLabX402(adminWallet, { ...input, chain }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "calls", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "volume", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "treasury", chain] });
    },
  });

  const distributeDepositM = useMutation({
    mutationFn: () => distributeLabDeposit(adminWallet, chain),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "deposit", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "wallets", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "settings", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "treasury", chain] });
    },
  });

  const resumeTreasuryM = useMutation({
    mutationFn: () => resumeLabTreasury(adminWallet, chain),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["labs-x402", "treasury", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "settings", chain] });
      void qc.invalidateQueries({ queryKey: ["labs-x402", "calls", chain] });
    },
  });

  return {
    allowed,
    adminWallet,
    chain,
    walletsQ,
    settingsQ,
    callsQ,
    volumeQ,
    endpointsQ,
    depositQ,
    treasuryQ,
    createWalletM,
    createWalletsBulkM,
    updateSettingsM,
    runM,
    distributeDepositM,
    resumeTreasuryM,
  };
}
