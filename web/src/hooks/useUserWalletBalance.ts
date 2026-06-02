import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { fetchUserWalletBalancesResilient } from "@/lib/userWalletBalance";

const STALE_MS = 45_000;

export function useUserWalletBalance() {
  const { address, connected } = useWalletContext();

  const query = useQuery({
    queryKey: ["user-wallet-balance", address],
    queryFn: () => fetchUserWalletBalancesResilient(address!),
    enabled: connected && Boolean(address),
    staleTime: STALE_MS,
    retry: 1,
  });

  return {
    connected,
    address,
    userSolBalance: query.data?.solBalance ?? null,
    userUsdcBalance: query.data?.usdcBalance ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
