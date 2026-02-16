"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchGlobalPool,
  fetchAllUserStakeInfos,
  computePendingReward,
  computeApr,
  getCurrentTimeSeconds,
} from "@/lib/staking";
import {
  stake as stakeTx,
  unstake as unstakeTx,
  claim as claimTx,
  toAnchorWallet,
  getUserStakingAta,
  getUserRewardAta,
} from "@/lib/stakingClient";
import { CONFIG } from "@/constants/config";
import { formatUnits, parseUnits } from "@/lib/format";
import type { GlobalPool, UserStakeInfo, StakingPeriod } from "@/lib/staking";
import { getAccount } from "@solana/spl-token";

export interface PeriodStakeInfo {
  amount: bigint;
  amountFormatted: string;
  unlockAt: number;
  isLocked: boolean;
  pendingRewardRaw: bigint;
}

export interface StakingState {
  pool: GlobalPool | null;
  userStakeInfos: [UserStakeInfo | null, UserStakeInfo | null, UserStakeInfo | null];
  periodStakes: [PeriodStakeInfo, PeriodStakeInfo, PeriodStakeInfo];
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
  stake: (amount: string, period: StakingPeriod) => Promise<void>;
  unstake: (amount: string, period: StakingPeriod) => Promise<void>;
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
  const [userStakeInfos, setUserStakeInfos] = useState<
    [UserStakeInfo | null, UserStakeInfo | null, UserStakeInfo | null]
  >([null, null, null]);
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
      const [poolData, infos] = await Promise.all([
        fetchGlobalPool(connection, CONFIG.programId),
        wallet.publicKey
          ? fetchAllUserStakeInfos(connection, wallet.publicKey, CONFIG.programId)
          : Promise.resolve<[UserStakeInfo | null, UserStakeInfo | null, UserStakeInfo | null]>([null, null, null]),
      ]);
      setPool(poolData);
      setUserStakeInfos(infos);

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
      if (poolData) {
        let total = 0n;
        for (const info of infos) {
          if (info && info.amount > 0n) {
            total += computePendingReward(poolData, info, now);
          }
        }
        setPendingRewardRaw(total);
      } else {
        setPendingRewardRaw(0n);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setPool(null);
      setUserStakeInfos([null, null, null]);
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
      if (pool && userStakeInfos) {
        const now = getCurrentTimeSeconds();
        let total = 0n;
        for (const info of userStakeInfos) {
          if (info && info.amount > 0n) {
            total += computePendingReward(pool, info, now);
          }
        }
        setPendingRewardRaw(total);
      }
    }, 10_000);
    return () => clearInterval(t);
  }, [pool, userStakeInfos]);

  const stake = useCallback(
    async (amount: string, period: StakingPeriod) => {
      const adapter = wallet.wallet?.adapter ?? null;
      if (!wallet.publicKey || !adapter) {
        throw new Error("Wallet not connected");
      }
      setStakeLoading(true);
      setError(null);
      try {
        const amountRaw = parseUnits(amount, CONFIG.stakingDecimals);
        const anchorWallet = toAnchorWallet(adapter);
        const sig = await stakeTx(connection, anchorWallet, amountRaw, period);
        await fetchData();
        return sig;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Stake failed");
        throw e;
      } finally {
        setStakeLoading(false);
      }
    },
    [connection, wallet.publicKey, wallet.wallet, fetchData]
  );

  const unstake = useCallback(
    async (amount: string, period: StakingPeriod) => {
      const adapter = wallet.wallet?.adapter ?? null;
      if (!wallet.publicKey || !adapter) {
        throw new Error("Wallet not connected");
      }
      setUnstakeLoading(true);
      setError(null);
      try {
        const amountRaw = parseUnits(amount, CONFIG.stakingDecimals);
        const anchorWallet = toAnchorWallet(adapter);
        const sig = await unstakeTx(connection, anchorWallet, amountRaw, period);
        await fetchData();
        return sig;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unstake failed");
        throw e;
      } finally {
        setUnstakeLoading(false);
      }
    },
    [connection, wallet.publicKey, wallet.wallet, fetchData]
  );

  const claim = useCallback(async () => {
    const adapter = wallet.wallet?.adapter ?? null;
    if (!wallet.publicKey || !adapter) {
      throw new Error("Wallet not connected");
    }
    setClaimLoading(true);
    setError(null);
    try {
      const anchorWallet = toAnchorWallet(adapter);
      const sig = await claimTx(connection, anchorWallet);
      await fetchData();
      return sig;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Claim failed";
      if (msg.includes("NothingToClaim") || msg.includes("No rewards to claim")) {
        setError("No rewards to claim yet");
      } else if (msg.includes("InsufficientRewardBalance")) {
        setError(
          "Reward vault has insufficient balance. Pool operator: run `npm run fund-reward-vault` (or send reward tokens to the pool reward vault)."
        );
      } else {
        setError(msg);
      }
      throw e;
    } finally {
      setClaimLoading(false);
    }
  }, [connection, wallet.publicKey, wallet.wallet, fetchData]);

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
    let total = 0n;
    for (const info of userStakeInfos) {
      if (info) total += info.amount;
    }
    return formatUnits(total, CONFIG.stakingDecimals);
  }, [userStakeInfos]);

  const periodStakes = useMemo((): [PeriodStakeInfo, PeriodStakeInfo, PeriodStakeInfo] => {
    const now = getCurrentTimeSeconds();
    const build = (info: UserStakeInfo | null, poolData: GlobalPool | null): PeriodStakeInfo => {
      const amount = info?.amount ?? 0n;
      const unlockAt = info ? Number(info.unlockAt) : 0;
      const isLocked = unlockAt > now;
      const pendingRewardRaw =
        poolData && info && info.amount > 0n
          ? computePendingReward(poolData, info, now)
          : 0n;
      return {
        amount,
        amountFormatted: formatUnits(amount, CONFIG.stakingDecimals),
        unlockAt,
        isLocked,
        pendingRewardRaw,
      };
    };
    return [
      build(userStakeInfos[0], pool),
      build(userStakeInfos[1], pool),
      build(userStakeInfos[2], pool),
    ];
  }, [userStakeInfos, pool]);

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
    userStakeInfos,
    periodStakes,
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
