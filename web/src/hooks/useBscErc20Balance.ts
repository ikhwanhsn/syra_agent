import { useQuery } from '@tanstack/react-query';
import { createPublicClient, getAddress, http, type Address } from 'viem';
import { bsc } from 'viem/chains';
import { BSC_TOKEN_DECIMALS, formatPaymentAmount } from '@/lib/x402Client';

const erc20BalanceAbi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface BscErc20BalanceResult {
  atomic: bigint;
  formatted: string;
}

export function useBscErc20Balance(
  walletAddress: string | null | undefined,
  tokenAddress: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['bsc-erc20-balance', walletAddress, tokenAddress],
    enabled: enabled && Boolean(walletAddress && tokenAddress),
    staleTime: 15_000,
    queryFn: async (): Promise<BscErc20BalanceResult> => {
      const client = createPublicClient({ chain: bsc, transport: http() });
      const balance = await client.readContract({
        address: getAddress(tokenAddress as Address),
        abi: erc20BalanceAbi,
        functionName: 'balanceOf',
        args: [getAddress(walletAddress as Address)],
      });
      const atomic = BigInt(balance);
      return {
        atomic,
        formatted: formatPaymentAmount(String(atomic), BSC_TOKEN_DECIMALS),
      };
    },
  });
}
