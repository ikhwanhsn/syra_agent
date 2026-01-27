import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Trophy,
  Zap,
  RefreshCw,
  Info,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useStaking } from '@/contexts/StakingContext';
import { 
  STAKING_TIERS, 
  TierName, 
  formatSyraAmount, 
  getNextTier, 
  getAmountToNextTier,
  getTierColor,
  getTierBgColor
} from '@/services/stakingApi';
import { toast } from 'sonner';

const Staking = () => {
  const navigate = useNavigate();
  const { isConnected, syraBalance, walletAddress, refreshBalances } = useWallet();
  const { 
    stakingInfo, 
    isLoading, 
    currentTier, 
    stakedAmount, 
    canCreateEvent,
    remainingEventsToday,
    dailyLimit,
    isLocked,
    unlockDate,
    creationFee,
    stake,
    unstake,
    refreshStakingInfo
  } = useStaking();

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stakeAmountNum = parseFloat(stakeAmount) || 0;
  const unstakeAmountNum = parseFloat(unstakeAmount) || 0;
  
  const currentTierName = (stakingInfo?.tier || 'FREE') as TierName;
  const nextTier = getNextTier(currentTierName);
  const amountToNextTier = getAmountToNextTier(stakedAmount, currentTierName);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshBalances(), refreshStakingInfo()]);
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStake = async () => {
    if (stakeAmountNum <= 0) {
      toast.error('Enter a valid amount to stake');
      return;
    }

    if (stakeAmountNum > syraBalance) {
      toast.error('Insufficient SYRA balance');
      return;
    }

    setIsStaking(true);
    try {
      // TODO: In production, trigger actual token transfer to staking contract
      toast.info('Processing stake...');
      
      const success = await stake(stakeAmountNum);
      
      if (success) {
        toast.success(`Successfully staked ${formatSyraAmount(stakeAmountNum)} SYRA!`);
        setStakeAmount('');
        await refreshBalances();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stake');
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (unstakeAmountNum <= 0) {
      toast.error('Enter a valid amount to unstake');
      return;
    }

    if (unstakeAmountNum > stakedAmount) {
      toast.error('Cannot unstake more than staked amount');
      return;
    }

    if (isLocked) {
      toast.error(`Tokens are locked until ${unlockDate?.toLocaleDateString()}`);
      return;
    }

    setIsUnstaking(true);
    try {
      toast.info('Processing unstake...');
      
      const success = await unstake(unstakeAmountNum);
      
      if (success) {
        toast.success(`Successfully unstaked ${formatSyraAmount(unstakeAmountNum)} SYRA!`);
        setUnstakeAmount('');
        await refreshBalances();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unstake');
    } finally {
      setIsUnstaking(false);
    }
  };

  const setMaxStake = () => {
    setStakeAmount(syraBalance.toString());
  };

  const setMaxUnstake = () => {
    setUnstakeAmount(stakedAmount.toString());
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="glass-card p-8 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Connect your wallet to stake SYRA tokens and unlock event creation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">Stake SYRA</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg mt-1">
              Stake tokens to unlock event creation
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Current Status Card */}
        <div className="glass-card p-4 sm:p-5 mb-4 border-primary/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl ${getTierBgColor(currentTierName)} border`}>
                {currentTier?.emoji || '📊'}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Current Tier</p>
                <h2 className={`text-xl sm:text-2xl font-bold ${getTierColor(currentTierName)}`}>
                  {currentTier?.name || 'Free'}
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
              <div className="bg-secondary/50 rounded-lg p-2 sm:p-3">
                <p className="text-xs sm:text-sm text-muted-foreground">Staked</p>
                <p className="text-sm sm:text-base font-bold text-primary">{formatSyraAmount(stakedAmount)}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2 sm:p-3">
                <p className="text-xs sm:text-sm text-muted-foreground">Available</p>
                <p className="text-sm sm:text-base font-bold text-accent">{formatSyraAmount(syraBalance)}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2 sm:p-3">
                <p className="text-xs sm:text-sm text-muted-foreground">Events</p>
                <p className="text-sm sm:text-base font-bold">
                  <span className={canCreateEvent ? 'text-green-400' : 'text-red-400'}>
                    {remainingEventsToday}
                  </span>
                  <span className="text-muted-foreground">/{dailyLimit}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && amountToNextTier !== null && (
            <div className="bg-secondary/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs sm:text-sm text-muted-foreground">Progress to {STAKING_TIERS[nextTier].name}</span>
                <span className="text-xs sm:text-sm font-medium">
                  {formatSyraAmount(amountToNextTier)} more
                </span>
              </div>
              <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (stakedAmount / STAKING_TIERS[nextTier].minStake) * 100)}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Lock status */}
          {isLocked && unlockDate && (
            <div className="mt-3 p-2 sm:p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-400">Locked until {unlockDate.toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          {/* Left - Stake/Unstake */}
          <div className="lg:col-span-5 space-y-4">
            {/* Stake Card */}
            <div className="glass-card p-4 sm:p-5 border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Stake SYRA</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Lock to create events</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs sm:text-sm font-medium">Amount</label>
                    <button onClick={setMaxStake} className="text-xs sm:text-sm text-primary hover:underline">
                      Max: {formatSyraAmount(syraBalance)}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="input-field h-10 text-sm sm:text-base pr-14"
                      min="0"
                      max={syraBalance}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted-foreground">
                      SYRA
                    </span>
                  </div>
                </div>

                {stakeAmountNum > 0 && (
                  <div className="p-2 sm:p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                      New tier: <strong>{STAKING_TIERS[getNextTier(currentTierName) || currentTierName]?.name || currentTier?.name}</strong>
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleStake}
                  disabled={isStaking || stakeAmountNum <= 0 || stakeAmountNum > syraBalance}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isStaking ? 'Staking...' : 'Stake Tokens'}
                </Button>
              </div>
            </div>

            {/* Unstake Card */}
            <div className="glass-card p-4 sm:p-5 border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Unlock className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Unstake SYRA</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Withdraw staked tokens</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs sm:text-sm font-medium">Amount</label>
                    <button onClick={setMaxUnstake} className="text-xs sm:text-sm text-primary hover:underline" disabled={isLocked}>
                      Max: {formatSyraAmount(stakedAmount)}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="input-field h-10 text-sm sm:text-base pr-14"
                      min="0"
                      max={stakedAmount}
                      disabled={isLocked}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted-foreground">
                      SYRA
                    </span>
                  </div>
                </div>

                {isLocked && (
                  <div className="p-2 sm:p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      Locked {currentTier?.lockDays || 0} days
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleUnstake}
                  disabled={isUnstaking || unstakeAmountNum <= 0 || unstakeAmountNum > stakedAmount || isLocked}
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  size="sm"
                >
                  {isUnstaking ? 'Unstaking...' : 'Unstake Tokens'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right - Tier Table & Info */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tier Benefits Table */}
            <div className="glass-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <h3 className="text-sm sm:text-base font-semibold">Staking Tiers</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Tier</th>
                      <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Min Stake</th>
                      <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Daily</th>
                      <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Lock</th>
                      <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(STAKING_TIERS) as [TierName, typeof STAKING_TIERS.FREE][]).map(([key, tier]) => {
                      const isCurrentTier = key === currentTierName;
                      return (
                        <tr 
                          key={key} 
                          className={`border-b border-border/50 transition-colors ${
                            isCurrentTier ? 'bg-primary/10' : 'hover:bg-secondary/30'
                          }`}
                        >
                          <td className="py-2 sm:py-3 px-2">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-base sm:text-lg">{tier.emoji}</span>
                              <span className={`font-medium text-xs sm:text-sm ${getTierColor(key)}`}>
                                {tier.name}
                              </span>
                              {isCurrentTier && (
                                <span className="px-1 py-0.5 rounded bg-primary/20 text-primary text-xs sm:text-sm">✓</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 font-mono text-xs sm:text-sm">{formatSyraAmount(tier.minStake)}</td>
                          <td className="py-2 sm:py-3 px-2">
                            <span className={`text-xs sm:text-sm ${tier.dailyEvents === 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {tier.dailyEvents === 0 ? 'N/A' : `${tier.dailyEvents}/day`}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 text-xs sm:text-sm text-muted-foreground">
                            {tier.lockDays === 0 ? '-' : `${tier.lockDays}d`}
                          </td>
                          <td className="py-2 sm:py-3 px-2 text-xs sm:text-sm">
                            <span className={tier.creationFee === 0 ? 'text-green-400' : ''}>
                              {tier.creationFee === 0 ? 'Free' : formatSyraAmount(tier.creationFee)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  <h3 className="font-semibold text-xs sm:text-sm">Why Stake?</h3>
                </div>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 shrink-0 mt-0.5" />
                    <span>Create events & earn fees</span>
                  </li>
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 shrink-0 mt-0.5" />
                    <span>More tiers = more slots</span>
                  </li>
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 shrink-0 mt-0.5" />
                    <span>Diamond = free creation</span>
                  </li>
                </ul>
              </div>

              <div className="glass-card p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                  <h3 className="font-semibold text-xs sm:text-sm">Notes</h3>
                </div>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Tokens locked per tier</span>
                  </li>
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Limits reset midnight UTC</span>
                  </li>
                  <li className="flex items-start gap-1.5 sm:gap-2">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span>Fees are burned</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            {canCreateEvent && (
              <div className="glass-card p-4 sm:p-5 border-primary/30 text-center">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <div className="text-left">
                    <h3 className="font-semibold text-sm sm:text-base">Ready to Create?</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {remainingEventsToday} event{remainingEventsToday !== 1 ? 's' : ''} remaining today
                    </p>
                  </div>
                  <Button variant="hero" size="sm" onClick={() => navigate('/create')}>
                    Create Event
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staking;
