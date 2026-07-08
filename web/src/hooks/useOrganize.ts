import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import {
  createOrganizeEntry,
  deleteOrganizeEntry,
  fetchOrganizeEntries,
  updateOrganizeEntry,
  type OrganizeEntryInput,
  type OrganizeEntryStatus,
  type OrganizeEntryType,
} from "@/lib/organizeApi";

const STALE_MS = 15_000;

export interface OrganizeFilters {
  type?: OrganizeEntryType;
  status?: OrganizeEntryStatus;
}

export function useOrganize(filters?: OrganizeFilters) {
  const { connected, address } = useWalletContext();
  const allowed = isAdminWallet(connected, address);
  const adminWallet = address ?? "";

  const entriesQ = useQuery({
    queryKey: ["organize", "entries", adminWallet, filters?.type, filters?.status],
    queryFn: () => fetchOrganizeEntries(adminWallet, filters),
    enabled: allowed && Boolean(adminWallet),
    staleTime: STALE_MS,
  });

  const qc = useQueryClient();

  const createM = useMutation({
    mutationFn: (input: OrganizeEntryInput) => createOrganizeEntry(adminWallet, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["organize", "entries"] });
    },
  });

  const updateM = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<OrganizeEntryInput> }) =>
      updateOrganizeEntry(adminWallet, id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["organize", "entries"] });
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteOrganizeEntry(adminWallet, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["organize", "entries"] });
    },
  });

  return {
    allowed,
    adminWallet,
    entriesQ,
    createM,
    updateM,
    deleteM,
  };
}
