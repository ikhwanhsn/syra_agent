import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import {
  fetchHackathonLatestRun,
  fetchHackathons,
  runHackathonScout,
  updateHackathon,
  type HackathonListParams,
  type HackathonStatus,
} from "@/lib/hackathonsApi";

const STALE_MS = 60_000;

export function useHackathons(params: HackathonListParams) {
  const { connected, address } = useWalletContext();
  const allowed = isAdminWallet(connected, address);

  return useQuery({
    queryKey: ["hackathons", params],
    queryFn: () => fetchHackathons(params),
    enabled: allowed,
    staleTime: STALE_MS,
    retry: 1,
  });
}

export function useHackathonLatestRun() {
  const { connected, address } = useWalletContext();
  const allowed = isAdminWallet(connected, address);

  return useQuery({
    queryKey: ["hackathons", "latest-run"],
    queryFn: fetchHackathonLatestRun,
    enabled: allowed,
    staleTime: STALE_MS,
    retry: 1,
  });
}

export function useUpdateHackathon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status?: HackathonStatus;
      notes?: string;
    }) => updateHackathon(id, { status, notes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
  });
}

export function useRunHackathonScout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runHackathonScout,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
  });
}
