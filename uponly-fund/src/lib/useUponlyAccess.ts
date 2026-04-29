import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRiseBorrowQuote } from "@/lib/RiseDashboardContext";
import { getRisePortfolioPositions } from "@/lib/riseDashboardApi";
import type { RisePortfolioPosition } from "@/lib/riseDashboardTypes";
import { RISE_UPONLY_MINT } from "@/components/rise/RiseShared";
import { useWallet } from "./WalletContext";

export type UponlyAccessStatus =
  | { state: "no-provider" }
  | { state: "no-wallet" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "no-uponly" }
  | {
      state: "granted";
      reason: "holds" | "deposited" | "borrows";
      position: RisePortfolioPosition;
    };

const POSITIONS_PAGE_LIMIT = 100;

function buildFallbackPosition(
  wallet: string,
  depositedTokens: number | null | undefined,
  debt: number | null | undefined,
): RisePortfolioPosition {
  return {
    mint: RISE_UPONLY_MINT,
    marketAddress: null,
    name: "UPONLY",
    symbol: "UPONLY",
    imageUrl: null,
    balance: 0,
    balanceUsd: null,
    avgEntryUsd: null,
    pnlUsd: null,
    pnlPct: null,
    depositedTokens: depositedTokens ?? null,
    debt: debt ?? null,
  };
}

export function useUponlyAccess(): UponlyAccessStatus {
  const { hasProvider, publicKey } = useWallet();
  const wallet = publicKey?.trim() ?? null;
  const uponlyPositionQuery = useQuery<RisePortfolioPosition | null, Error>({
    queryKey: ["rise-uponly-position", wallet ?? ""],
    enabled: Boolean(wallet),
    queryFn: async ({ signal }) => {
      if (!wallet) return null;
      const firstPage = await getRisePortfolioPositions(wallet, 1, POSITIONS_PAGE_LIMIT, signal);
      const firstMatch = firstPage.positions.find((position) => position.mint === RISE_UPONLY_MINT) ?? null;
      if (firstMatch) return firstMatch;

      const totalPages = Math.max(1, firstPage.totalPages ?? 1);
      for (let page = 2; page <= totalPages; page += 1) {
        const nextPage = await getRisePortfolioPositions(wallet, page, POSITIONS_PAGE_LIMIT, signal);
        const nextMatch = nextPage.positions.find((position) => position.mint === RISE_UPONLY_MINT) ?? null;
        if (nextMatch) return nextMatch;
      }
      return null;
    },
    staleTime: 30_000,
    retry: 1,
  });
  const borrowQuote = useRiseBorrowQuote({
    address: wallet ? RISE_UPONLY_MINT : null,
    wallet,
    amountToBorrow: 0,
  });

  return useMemo<UponlyAccessStatus>(() => {
    if (!hasProvider) return { state: "no-provider" };
    if (!wallet) return { state: "no-wallet" };
    if (uponlyPositionQuery.isPending || borrowQuote.isPending) return { state: "loading" };
    if (uponlyPositionQuery.isError) {
      return {
        state: "error",
        message: (uponlyPositionQuery.error as Error)?.message || "Failed to verify UPONLY access.",
      };
    }
    if (borrowQuote.isError) {
      return {
        state: "error",
        message: (borrowQuote.error as Error)?.message || "Failed to verify UPONLY borrow access.",
      };
    }

    const uponlyPosition = uponlyPositionQuery.data;
    const positionBalance = uponlyPosition?.balance ?? 0;
    if (positionBalance > 0 && uponlyPosition) {
      return { state: "granted", reason: "holds", position: uponlyPosition };
    }

    const positionDeposited = uponlyPosition?.depositedTokens ?? 0;
    if (positionDeposited > 0 && uponlyPosition) {
      return { state: "granted", reason: "deposited", position: uponlyPosition };
    }

    const positionDebt = uponlyPosition?.debt ?? 0;
    if (positionDebt > 0 && uponlyPosition) {
      return { state: "granted", reason: "borrows", position: uponlyPosition };
    }

    const borrowedDeposited = borrowQuote.data?.quote?.depositedTokens ?? 0;
    if (borrowedDeposited > 0) {
      return {
        state: "granted",
        reason: "deposited",
        position: buildFallbackPosition(wallet, borrowQuote.data?.quote?.depositedTokens, borrowQuote.data?.quote?.debt),
      };
    }

    const borrowedDebt = borrowQuote.data?.quote?.debt ?? 0;
    if (borrowedDebt > 0) {
      return {
        state: "granted",
        reason: "borrows",
        position: buildFallbackPosition(wallet, borrowQuote.data?.quote?.depositedTokens, borrowQuote.data?.quote?.debt),
      };
    }

    return { state: "no-uponly" };
  }, [
    borrowQuote.data?.quote?.debt,
    borrowQuote.data?.quote?.depositedTokens,
    borrowQuote.error,
    borrowQuote.isError,
    borrowQuote.isPending,
    hasProvider,
    uponlyPositionQuery.data,
    uponlyPositionQuery.error,
    uponlyPositionQuery.isError,
    uponlyPositionQuery.isPending,
    wallet,
  ]);
}
