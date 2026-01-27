// API Base URL - uses the main SYRA API with /prediction-game prefix
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.syraa.fun/prediction-game';

// Staking tier configuration (mirrored from backend)
export const STAKING_TIERS = {
  FREE: {
    name: 'Free',
    minStake: 0,
    dailyEvents: 0,
    lockDays: 0,
    creationFee: 5000,
    color: 'gray',
    emoji: '📊',
  },
  BRONZE: {
    name: 'Bronze',
    minStake: 10_000,
    dailyEvents: 1,
    lockDays: 1,
    creationFee: 1000,
    color: 'orange',
    emoji: '🥉',
  },
  SILVER: {
    name: 'Silver',
    minStake: 100_000,
    dailyEvents: 3,
    lockDays: 3,
    creationFee: 500,
    color: 'gray',
    emoji: '🥈',
  },
  GOLD: {
    name: 'Gold',
    minStake: 1_000_000,
    dailyEvents: 5,
    lockDays: 5,
    creationFee: 100,
    color: 'yellow',
    emoji: '🥇',
  },
  DIAMOND: {
    name: 'Diamond',
    minStake: 10_000_000,
    dailyEvents: 10,
    lockDays: 7,
    creationFee: 0,
    color: 'cyan',
    emoji: '💎',
  },
} as const;

export type TierName = keyof typeof STAKING_TIERS;

export interface StakingTier {
  name: string;
  minStake: number;
  dailyEvents: number;
  lockDays: number;
  creationFee: number;
  color: string;
  emoji: string;
}

export interface CanCreateResult {
  canCreate: boolean;
  reason: string | null;
  dailyLimit: number;
  eventsCreatedToday: number;
  remainingToday: number;
  creationFee: number;
}

export interface CanUnstakeResult {
  canUnstake: boolean;
  reason: string | null;
  unlocksAt?: string;
  timeRemaining?: number;
}

export interface StakingHistoryEntry {
  action: 'stake' | 'unstake' | 'tier_change';
  amount: number;
  previousAmount: number;
  previousTier: TierName;
  newTier: TierName;
  txSignature?: string;
  timestamp: string;
}

export interface StakingInfo {
  walletAddress: string;
  stakedAmount: number;
  tier: TierName;
  tierInfo: StakingTier;
  stakedAt: string | null;
  unlocksAt: string | null;
  eventsCreatedToday: number;
  totalEventsCreated: number;
  totalSlashed: number;
  canCreate: CanCreateResult;
  canUnstake: CanUnstakeResult;
  stakingHistory: StakingHistoryEntry[];
}

export interface StakeResult {
  message: string;
  walletAddress: string;
  stakedAmount: number;
  tier: TierName;
  tierInfo: StakingTier;
  previousTier: TierName;
  tierChanged: boolean;
  unlocksAt: string | null;
  canCreate: CanCreateResult;
}

export interface UnstakeResult extends StakeResult {}

export interface StakingStats {
  totalStakers: number;
  totalStaked: number;
  totalSlashed: number;
  avgStaked: number;
  tierDistribution: Record<TierName, { count: number; totalStaked: number }>;
}

export interface LeaderboardEntry {
  walletAddress: string;
  stakedAmount: number;
  tier: TierName;
  totalEventsCreated: number;
}

class StakingApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}/staking${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }

  // Get staking tiers configuration
  async getTiers(): Promise<{ tiers: typeof STAKING_TIERS }> {
    return this.request('/tiers');
  }

  // Get staking info for a wallet
  async getStakingInfo(walletAddress: string): Promise<StakingInfo> {
    return this.request(`/${walletAddress}`);
  }

  // Stake tokens
  async stake(walletAddress: string, amount: number, txSignature?: string): Promise<StakeResult> {
    return this.request(`/${walletAddress}/stake`, {
      method: 'POST',
      body: JSON.stringify({ amount, txSignature }),
    });
  }

  // Unstake tokens
  async unstake(walletAddress: string, amount: number, txSignature?: string): Promise<UnstakeResult> {
    return this.request(`/${walletAddress}/unstake`, {
      method: 'POST',
      body: JSON.stringify({ amount, txSignature }),
    });
  }

  // Check if wallet can create event
  async canCreate(walletAddress: string): Promise<CanCreateResult & { tier: TierName; tierInfo: StakingTier; stakedAmount: number }> {
    return this.request(`/${walletAddress}/can-create`);
  }

  // Record event creation
  async recordEventCreation(walletAddress: string): Promise<{ message: string; eventsCreatedToday: number; remainingToday: number }> {
    return this.request(`/${walletAddress}/record-event`, {
      method: 'POST',
    });
  }

  // Get staking stats (admin)
  async getStats(): Promise<StakingStats> {
    return this.request('/admin/stats');
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<{ leaderboard: LeaderboardEntry[] }> {
    return this.request(`/leaderboard/top?limit=${limit}`);
  }
}

export const stakingApi = new StakingApiService();

// Helper functions
export function getTierForAmount(amount: number): TierName {
  if (amount >= STAKING_TIERS.DIAMOND.minStake) return 'DIAMOND';
  if (amount >= STAKING_TIERS.GOLD.minStake) return 'GOLD';
  if (amount >= STAKING_TIERS.SILVER.minStake) return 'SILVER';
  if (amount >= STAKING_TIERS.BRONZE.minStake) return 'BRONZE';
  return 'FREE';
}

export function getNextTier(currentTier: TierName): TierName | null {
  const tiers: TierName[] = ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex < tiers.length - 1) {
    return tiers[currentIndex + 1];
  }
  return null;
}

export function formatSyraAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

export function getAmountToNextTier(currentAmount: number, currentTier: TierName): number | null {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;
  return STAKING_TIERS[nextTier].minStake - currentAmount;
}

export function getTierColor(tier: TierName): string {
  const colors: Record<TierName, string> = {
    FREE: 'text-gray-400',
    BRONZE: 'text-orange-400',
    SILVER: 'text-gray-300',
    GOLD: 'text-yellow-400',
    DIAMOND: 'text-cyan-400',
  };
  return colors[tier];
}

export function getTierBgColor(tier: TierName): string {
  const colors: Record<TierName, string> = {
    FREE: 'bg-gray-500/10 border-gray-500/30',
    BRONZE: 'bg-orange-500/10 border-orange-500/30',
    SILVER: 'bg-gray-400/10 border-gray-400/30',
    GOLD: 'bg-yellow-500/10 border-yellow-500/30',
    DIAMOND: 'bg-cyan-500/10 border-cyan-500/30',
  };
  return colors[tier];
}
