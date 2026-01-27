import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { stakingApi, StakingInfo, StakingTier, STAKING_TIERS } from '@/services/stakingApi';

interface StakingContextType {
  stakingInfo: StakingInfo | null;
  isLoading: boolean;
  error: string | null;
  tiers: typeof STAKING_TIERS;
  
  // Actions
  refreshStakingInfo: () => Promise<void>;
  stake: (amount: number, txSignature?: string) => Promise<boolean>;
  unstake: (amount: number, txSignature?: string) => Promise<boolean>;
  
  // Computed values
  currentTier: StakingTier | null;
  canCreateEvent: boolean;
  remainingEventsToday: number;
  dailyLimit: number;
  stakedAmount: number;
  isLocked: boolean;
  unlockDate: Date | null;
  creationFee: number;
}

const StakingContext = createContext<StakingContextType | undefined>(undefined);

export const StakingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, walletAddress } = useWallet();
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStakingInfo = useCallback(async () => {
    if (!isConnected || !walletAddress) {
      setStakingInfo(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const info = await stakingApi.getStakingInfo(walletAddress);
      setStakingInfo(info);
    } catch (err) {
      console.error('Failed to fetch staking info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staking info');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, walletAddress]);

  // Refresh staking info when wallet connects/changes
  useEffect(() => {
    if (isConnected && walletAddress) {
      refreshStakingInfo();
    } else {
      setStakingInfo(null);
    }
  }, [isConnected, walletAddress, refreshStakingInfo]);

  const stake = useCallback(async (amount: number, txSignature?: string): Promise<boolean> => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: In production, this should trigger a real token transfer transaction
      // For now, we'll just record it in the backend
      const result = await stakingApi.stake(walletAddress, amount, txSignature);
      setStakingInfo(prev => prev ? {
        ...prev,
        stakedAmount: result.stakedAmount,
        tier: result.tier,
        tierInfo: result.tierInfo,
        unlocksAt: result.unlocksAt,
        canCreate: result.canCreate,
      } : null);
      return true;
    } catch (err) {
      console.error('Failed to stake:', err);
      setError(err instanceof Error ? err.message : 'Failed to stake');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  const unstake = useCallback(async (amount: number, txSignature?: string): Promise<boolean> => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await stakingApi.unstake(walletAddress, amount, txSignature);
      setStakingInfo(prev => prev ? {
        ...prev,
        stakedAmount: result.stakedAmount,
        tier: result.tier,
        tierInfo: result.tierInfo,
        unlocksAt: result.unlocksAt,
        canCreate: result.canCreate,
      } : null);
      return true;
    } catch (err) {
      console.error('Failed to unstake:', err);
      setError(err instanceof Error ? err.message : 'Failed to unstake');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Computed values
  const currentTier = stakingInfo?.tierInfo || null;
  const canCreateEvent = stakingInfo?.canCreate?.canCreate || false;
  const remainingEventsToday = stakingInfo?.canCreate?.remainingToday || 0;
  const dailyLimit = stakingInfo?.canCreate?.dailyLimit || 0;
  const stakedAmount = stakingInfo?.stakedAmount || 0;
  const isLocked = stakingInfo?.unlocksAt ? new Date(stakingInfo.unlocksAt) > new Date() : false;
  const unlockDate = stakingInfo?.unlocksAt ? new Date(stakingInfo.unlocksAt) : null;
  const creationFee = stakingInfo?.canCreate?.creationFee || STAKING_TIERS.FREE.creationFee;

  return (
    <StakingContext.Provider
      value={{
        stakingInfo,
        isLoading,
        error,
        tiers: STAKING_TIERS,
        refreshStakingInfo,
        stake,
        unstake,
        currentTier,
        canCreateEvent,
        remainingEventsToday,
        dailyLimit,
        stakedAmount,
        isLocked,
        unlockDate,
        creationFee,
      }}
    >
      {children}
    </StakingContext.Provider>
  );
};

export const useStaking = () => {
  const context = useContext(StakingContext);
  if (!context) {
    throw new Error('useStaking must be used within a StakingProvider');
  }
  return context;
};
