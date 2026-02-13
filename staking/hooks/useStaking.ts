"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getConnection } from "@/lib/solana";
import {
  fetchGlobalPool,
  fetchUserStakeInfo,
  computePendingReward,
  computeApr,
  getCurrentTimeSeconds,
} from "@/lib/staking";
import {
  stake as stakeTx,
  unstake as unstakeTx,
  claim as claimTx,
  getUserStakingAta,
  getUserRewardAta,
} from "@/lib/stakingClient";
import { CONFIG } from "@/constants/config";
import { formatUnits, parseUnits } from "@/lib/format";
import type { GlobalPool, UserStakeInfo } from "@/lib/staking";
import { getAccount } from "@solana/spl-token";

export interface StakingState {
  pool: GlobalPool | null;
  userStakeInfo: UserStakeInfo | null;
  totalStakedFormatted: string;
  apr: number;
  rewardPerSecondFormatted: string;
  userStakedFormatted: string;
  pendingRewardRaw: bigint;
  pendingRewardFormatted: string;
  userStakingBalanceRaw: bigint;
  userStakingBalanceFormatted: string;
  userRewardBalanceFormatted: string;
  refetch: () => Promise<void>;
  stake: (amount: string) => Promise<void>;
  unstake: (amount: string) => Promise<void>;
  claim: () => Promise<void>;
  loading: boolean;
  stakeLoading: boolean;
  unstakeLoading: boolean;
  claimLoading: boolean;
  error: string | null;
}

export function useStaking(): StakingState {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [pool, setPool] = useState<GlobalPool | null>(null);
  const [userStakeInfo, setUserStakeInfo] = useState<UserStakeInfo | null>(null);
  const [userStakingBalanceRaw, setUserStakingBalanceRaw] = useState<bigint>(0n);
  const [userRewardBalanceRaw, setUserRewardBalanceRaw] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [stakeLoading, setStakeLoading] = useState(false);
  const [unstakeLoading, setUnstakeLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRewardRaw, setPendingRewardRaw] = useState<bigint>(0n);

  const fetchData = useCallback(async () => {
    if (!connection) return;
    setError(null);
    try {
      const [poolData, userInfo] = await Promise.all([
        fetchGlobalPool(connection, CONFIG.programId),
        wallet.publicKey
          ? fetchUserStakeInfo(connection, wallet.publicKey, CONFIG.programId)
          : Promise.resolve(null),
      ]);
      setPool(poolData);
      setUserStakeInfo(userInfo);

      if (wallet.publicKey) {
        try {
          const stakingAta = getUserStakingAta(wallet.publicKey);
          const rewardAta = getUserRewardAta(wallet.publicKey);
          const [stakingAcc, rewardAcc] = await Promise.all([
            getAccount(connection, stakingAta).catch(() => null),
            getAccount(connection, rewardAta).catch(() => null),
          ]);
          setUserStakingBalanceRaw(stakingAcc?.amount ?? 0n);
          setUserRewardBalanceRaw(rewardAcc?.amount ?? 0n);
        } catch {
          setUserStakingBalanceRaw(0n);
          setUserRewardBalanceRaw(0n);
        }
      } else {
        setUserStakingBalanceRaw(0n);
        setUserRewardBalanceRaw(0n);
      }

      const now = getCurrentTimeSeconds();
      if (poolData && userInfo) {
        const pending = computePendingReward(poolData, userInfo, now);
        setPendingRewardRaw(pending);
      } else {
        setPendingRewardRaw(0n);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setPool(null);
      setUserStakeInfo(null);
      setPendingRewardRaw(0n);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet.publicKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const t = setInterval(() => {
      if (pool && userStakeInfo) {
        const now = getCurrentTimeSeconds();
        setPendingRewardRaw(computePendingReward(pool, userStakeInfo, now));
      }
    }, 10_000);
    return () => clearInterval(t);
  }, [pool, userStakeInfo]);

  const stake = useCallback(
    async (amount: string) => {
      if (!wallet.publicKey || !wallet.adapter) return;
      setStakeLoading(true);
      setError(null);
      try {
        const amountRaw = parseUnits(amount, CONFIG.stakingDecimals);
        await stakeTx(getConnection(), wallet.adapter as any, amountRaw);
        await fetchData();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Stake failed");
        throw e;
      } finally {
        setStakeLoading(false);
      }
    },
    [wallet.publicKey, wallet.adapter, fetchData]
  );

  const unstake = useCallback(
    async (amount: string) => {
      if (!wallet.publicKey || !wallet.adapter) return;
      setUnstakeLoading(true);
      setError(null);
      try {
        const amountRaw = parseUnits(amount, CONFIG.stakingDecimals);
        await unstakeTx(getConnection(), wallet.adapter as any, amountRaw);
        await fetchData();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unstake failed");
        throw e;
      } finally {
        setUnstakeLoading(false);
      }
    },
    [wallet.publicKey, wallet.adapter, fetchData]
  );

  const claim = useCallback(async () => {
    if (!wallet.publicKey || !wallet.adapter) return;
    setClaimLoading(true);
    setError(null);
    try {
      await claimTx(getConnection(), wallet.adapter as any);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Claim failed");
      throw e;
    } finally {
      setClaimLoading(false);
    }
  }, [wallet.publicKey, wallet.adapter, fetchData]);

  const totalStakedFormatted = useMemo(() => {
    if (!pool) return "0";
    return formatUnits(pool.totalStaked, CONFIG.stakingDecimals);
  }, [pool]);

  const rewardPerSecondFormatted = useMemo(() => {
    return formatUnits(
      BigInt(CONFIG.rewardPerSecond),
      CONFIG.rewardDecimals,
      6
    );
  }, []);

  const apr = useMemo(() => {
    if (!pool || pool.totalStaked === 0n) return 0;
    return computeApr(
      pool.rewardPerSecond,
      pool.totalStaked,
      CONFIG.stakingDecimals,
      CONFIG.rewardDecimals,
      CONFIG.secondsPerYear,
      CONFIG.rewardTokenPriceUsd,
      CONFIG.stakingTokenPriceUsd
    );
  }, [pool]);

  const userStakedFormatted = useMemo(() => {
    if (!userStakeInfo) return "0";
    return formatUnits(userStakeInfo.amount, CONFIG.stakingDecimals);
  }, [userStakeInfo]);

  const pendingRewardFormatted = useMemo(() => {
    return formatUnits(pendingRewardRaw, CONFIG.rewardDecimals);
  }, [pendingRewardRaw]);

  const userStakingBalanceFormatted = useMemo(() => {
    return formatUnits(userStakingBalanceRaw, CONFIG.stakingDecimals);
  }, [userStakingBalanceRaw]);

  const userRewardBalanceFormatted = useMemo(() => {
    return formatUnits(userRewardBalanceRaw, CONFIG.rewardDecimals);
  }, [userRewardBalanceRaw]);

  return {
    pool,
    userStakeInfo,
    totalStakedFormatted,
    apr,
    rewardPerSecondFormatted,
    userStakedFormatted,
    pendingRewardRaw,
    pendingRewardFormatted,
    userStakingBalanceRaw,
    userStakingBalanceFormatted,
    userRewardBalanceFormatted,
    refetch: fetchData,
    stake,
    unstake,
    claim,
    loading,
    stakeLoading,
    unstakeLoading,
    claimLoading,
    error,
  };
}
