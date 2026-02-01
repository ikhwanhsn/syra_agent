import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Info, AlertTriangle, Coins, Trophy, Users, Percent, Clock, Wallet, RefreshCw, Timer, EyeOff, Zap, PiggyBank, ArrowRight, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useStaking } from '@/contexts/StakingContext';
import { tokens } from '@/data/mockData';
import { toast } from 'sonner';
import api, { calculatePayoutBreakdown } from '@/services/api';
import { stakingApi, STAKING_TIERS, formatSyraAmount, getTierColor, getTierBgColor, TierName } from '@/services/stakingApi';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { isConnected, syraBalance, walletAddress, solBalance, refreshBalances } = useWallet();
  const { 
    stakingInfo,
    currentTier, 
    stakedAmount, 
    canCreateEvent, 
    remainingEventsToday, 
    dailyLimit,
    creationFee,
    refreshStakingInfo,
    isLoading: stakingLoading
  } = useStaking();
  
  const [selectedToken, setSelectedToken] = useState('');
  const [creatorDeposit, setCreatorDeposit] = useState('1');
  const [entryFee, setEntryFee] = useState('0.1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Phase configuration
  const [joiningDuration, setJoiningDuration] = useState('48');
  const [predictionDuration, setPredictionDuration] = useState('4');
  const [waitingDuration, setWaitingDuration] = useState('24');
  const [minParticipants, setMinParticipants] = useState('10');
  const [maxParticipants, setMaxParticipants] = useState('25');

  // Distribution (fixed percentages)
  // Entry fees go to Creator and Platform ONLY
  // Winners prize comes from Creator Deposit ONLY
  const distribution = { creator: 70, platform: 30 };
  const winnerSplit = { first: 50, second: 30, third: 20 };

  // Current tier info
  const currentTierName = (stakingInfo?.tier || 'FREE') as TierName;
  const tierInfo = currentTier || STAKING_TIERS.FREE;

  // Refresh balances when page loads
  useEffect(() => {
    if (isConnected) {
      refreshBalances();
      refreshStakingInfo();
    }
  }, [isConnected]);

  const handleRefreshBalance = async () => {
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

  const creatorDepositNum = parseFloat(creatorDeposit) || 0;
  const entryFeeNum = parseFloat(entryFee) || 0;
  const hasEnoughSol = solBalance >= creatorDepositNum;
  const minParticipantsNum = parseInt(minParticipants) || 10;
  const maxParticipantsNum = parseInt(maxParticipants) || 25;

  // Calculate payouts dynamically
  const currentPayout = useMemo(() => 
    calculatePayoutBreakdown(creatorDepositNum, entryFeeNum, minParticipantsNum, distribution, winnerSplit),
    [creatorDepositNum, entryFeeNum, minParticipantsNum]
  );

  const maxPayout = useMemo(() => 
    calculatePayoutBreakdown(creatorDepositNum, entryFeeNum, maxParticipantsNum, distribution, winnerSplit),
    [creatorDepositNum, entryFeeNum, maxParticipantsNum]
  );

  const handleCreate = async () => {
    if (!selectedToken) {
      toast.error('Please select a token');
      return;
    }

    if (!walletAddress) {
      toast.error('Wallet not connected');
      return;
    }

    if (!canCreateEvent) {
      toast.error('You need to stake SYRA tokens to create events');
      return;
    }

    if (remainingEventsToday <= 0) {
      toast.error('Daily event limit reached. Upgrade your tier for more slots.');
      return;
    }

    if (isNaN(creatorDepositNum) || creatorDepositNum < 0.5) {
      toast.error('Creator deposit must be at least 0.5 SOL');
      return;
    }

    if (!hasEnoughSol) {
      toast.error(`Insufficient SOL balance. You need ${creatorDepositNum} SOL but have ${solBalance.toFixed(4)} SOL`);
      return;
    }

    if (minParticipantsNum < 3) {
      toast.error('Minimum participants must be at least 3');
      return;
    }

    if (maxParticipantsNum < minParticipantsNum) {
      toast.error('Maximum participants must be greater than or equal to minimum');
      return;
    }

    setIsSubmitting(true);

    try {
      toast.info('Please approve the transaction in your wallet...');
      
      // TODO: In production, send creatorDeposit to treasury/escrow
      // const txSignature = await sendSol(creatorDepositNum, 'TREASURY_ADDRESS');
      
      if (solBalance < creatorDepositNum) {
        throw new Error('Insufficient SOL balance');
      }

      const event = await api.createEvent({
        token: selectedToken,
        creatorWallet: walletAddress,
        creatorDeposit: creatorDepositNum,
        entryFee: entryFeeNum,
        joiningDuration: parseInt(joiningDuration),
        predictionPhaseDuration: parseInt(predictionDuration),
        waitingPhaseDuration: parseInt(waitingDuration),
        minParticipants: minParticipantsNum,
        maxParticipants: maxParticipantsNum,
        distribution,
        winnerSplit,
      });

      // Record event creation in staking system
      try {
        await stakingApi.recordEventCreation(walletAddress);
      } catch (recordError) {
        // Silently fail; event was created
      }

      toast.success('Event created successfully!');
      await Promise.all([refreshBalances(), refreshStakingInfo()]);
      navigate(`/event/${event._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
              Please connect your wallet to create prediction events.
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">Create Prediction Event</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Set up a new price prediction competition</p>
          </div>
          
          {/* Quick Wallet Info - Desktop */}
          <div className="hidden md:flex items-center gap-4 glass-card px-4 py-2 border-accent/30">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent" />
              <span className="text-sm font-mono text-muted-foreground">
                {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-accent">{solBalance.toFixed(2)} SOL</span>
              <span className="text-sm font-bold text-primary">
                {syraBalance >= 1_000_000 ? `${(syraBalance / 1_000_000).toFixed(1)}M` : syraBalance.toLocaleString()} SYRA
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefreshBalance} disabled={isRefreshing} className="h-7 w-7 p-0">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Mobile Wallet Card */}
        <div className="md:hidden glass-card p-4 mb-4 border-accent/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent" />
              <span className="text-sm font-mono">{walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefreshBalance} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-secondary/50 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">SOL</p>
              <p className="font-bold text-accent">{solBalance.toFixed(4)}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">SYRA</p>
              <p className="font-bold text-primary">{syraBalance >= 1_000_000 ? `${(syraBalance / 1_000_000).toFixed(2)}M` : syraBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column - Event Configuration */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Token Selection - Compact */}
            <div className="glass-card p-4 sm:p-5">
              <label className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Select Token to Predict
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {tokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => setSelectedToken(token.symbol)}
                    className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 group ${
                      selectedToken === token.symbol
                        ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(270_70%_60%/0.3)] scale-105'
                        : 'border-border bg-secondary/50 hover:border-primary/40 hover:scale-105'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-0.5 transition-transform duration-200 group-hover:scale-110">{token.icon}</div>
                    <div className="text-xs font-semibold">{token.symbol}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prize Pool + Participants - Combined Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prize Pool */}
              <div className="glass-card p-4 sm:p-5 border-green-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  <h3 className="font-semibold text-sm sm:text-base">Prize Pool</h3>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm text-muted-foreground mb-1">Your Deposit (SOL)</label>
                    <input
                      type="number"
                      value={creatorDeposit}
                      onChange={(e) => setCreatorDeposit(e.target.value)}
                      className="input-field h-10 text-sm sm:text-base"
                      placeholder="Min 0.5"
                      min="0.5"
                      step="0.1"
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">100% goes to winners</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-muted-foreground mb-1">Entry Fee (SOL)</label>
                    <input
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      className="input-field h-10 text-sm sm:text-base"
                      placeholder="0.1"
                      min="0.01"
                      step="0.01"
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">You earn {distribution.creator}% of fees</p>
                  </div>
                </div>
                {creatorDepositNum > 0 && (
                  <div className={`mt-3 p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${hasEnoughSol ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 sm:h-4 sm:w-4" />
                      {hasEnoughSol ? `Deposit: ${creatorDepositNum} SOL` : `Need ${creatorDepositNum} SOL (have ${solBalance.toFixed(2)})`}
                    </div>
                  </div>
                )}
              </div>

              {/* Participants */}
              <div className="glass-card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  <h3 className="font-semibold text-sm sm:text-base">Participants</h3>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm text-muted-foreground mb-1">Minimum</label>
                    <input
                      type="number"
                      value={minParticipants}
                      onChange={(e) => setMinParticipants(e.target.value)}
                      className="input-field h-10 text-sm sm:text-base"
                      min="3"
                      max="100"
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Event starts when reached</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-muted-foreground mb-1">Maximum</label>
                    <input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      className="input-field h-10 text-sm sm:text-base"
                      min="3"
                      max="100"
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Auto-starts when full</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase Timing - Compact */}
            <div className="glass-card p-4 sm:p-5 border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                <h3 className="font-semibold text-sm sm:text-base">Event Phases</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm text-muted-foreground mb-2">
                    <span className="text-blue-400">1.</span> Joining (max wait)
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {['24', '48', '72', '96'].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setJoiningDuration(hours)}
                        className={`py-1.5 sm:py-2 rounded border text-xs sm:text-sm transition-all ${
                          joiningDuration === hours
                            ? 'border-blue-400 bg-blue-400/10 text-blue-400 font-semibold'
                            : 'border-border bg-secondary/50 hover:border-blue-400/40'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <span className="text-yellow-400">2.</span> Prediction
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {['2', '4', '6', '8'].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setPredictionDuration(hours)}
                        className={`py-1.5 sm:py-2 rounded border text-xs sm:text-sm transition-all ${
                          predictionDuration === hours
                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400 font-semibold'
                            : 'border-border bg-secondary/50 hover:border-yellow-400/40'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <span className="text-purple-400">3.</span> Waiting
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {['12', '24', '48', '72'].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setWaitingDuration(hours)}
                        className={`py-1.5 sm:py-2 rounded border text-xs sm:text-sm transition-all ${
                          waitingDuration === hours
                            ? 'border-purple-400 bg-purple-400/10 text-purple-400 font-semibold'
                            : 'border-border bg-secondary/50 hover:border-purple-400/40'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phase Flow Summary */}
              <div className="mt-3 p-2 sm:p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-blue-400">Join {joiningDuration}h</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="text-yellow-400">Predict {predictionDuration}h</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="text-purple-400">Wait {waitingDuration}h</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="text-green-400">Results</span>
                </div>
              </div>
            </div>

            {/* Warnings - Compact */}
            {(!canCreateEvent || !hasEnoughSol) && (
              <div className="space-y-2">
                {!canCreateEvent && stakedAmount === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-destructive">Staking Required:</span>{' '}
                      <Link to="/staking" className="text-primary underline">Stake SYRA</Link> to create events
                    </p>
                  </div>
                )}
                {!canCreateEvent && stakedAmount > 0 && remainingEventsToday <= 0 && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-destructive">Daily limit reached:</span>{' '}
                      <Link to="/staking" className="text-primary underline">Upgrade tier</Link> for more slots
                    </p>
                  </div>
                )}
                {!hasEnoughSol && creatorDepositNum > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm">
                      <span className="font-semibold text-destructive">Insufficient SOL:</span>{' '}
                      <span className="text-muted-foreground">Need {creatorDepositNum} SOL</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Payouts & Status */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Payout Breakdown - Compact */}
            <div className="glass-card p-4 sm:p-5 border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <h3 className="font-semibold text-sm sm:text-base">Payout Breakdown</h3>
              </div>

              {/* How It Works - Inline */}
              <div className="mb-3 p-2 sm:p-3 bg-secondary/50 rounded-lg text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Deposit</span>
                  <span className="text-muted-foreground">→ 100% to Winners</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Entry Fees</span>
                  <span className="text-muted-foreground">→ {distribution.creator}% You + {distribution.platform}% Platform</span>
                </div>
              </div>

              {/* Prize Pool */}
              <div className="mb-3">
                <p className="text-xs sm:text-sm font-medium mb-2 text-yellow-400">Winner Prizes ({creatorDepositNum} SOL)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">🥇 1st</p>
                    <p className="font-bold text-yellow-400 text-sm sm:text-base">{currentPayout.firstPrize}</p>
                  </div>
                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">🥈 2nd</p>
                    <p className="font-bold text-sm sm:text-base">{currentPayout.secondPrize}</p>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">🥉 3rd</p>
                    <p className="font-bold text-orange-400 text-sm sm:text-base">{currentPayout.thirdPrize}</p>
                  </div>
                </div>
              </div>

              {/* Your Profit */}
              <div className="border-t border-border/50 pt-3">
                <p className="text-xs sm:text-sm font-medium mb-2 text-green-400">Your Profit from Fees</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">@{minParticipantsNum} players</p>
                    <p className="font-bold text-green-400 text-base sm:text-lg">{currentPayout.creatorPayout} SOL</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">@{maxParticipantsNum} players</p>
                    <p className="font-bold text-green-400 text-base sm:text-lg">{maxPayout.creatorPayout} SOL</p>
                  </div>
                </div>
              </div>

              {/* Summary Row */}
              <div className="mt-3 p-2 sm:p-3 bg-secondary/30 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm text-center">
                  <div>
                    <p className="font-bold text-yellow-400">{creatorDepositNum} SOL</p>
                    <p className="text-muted-foreground">Winners</p>
                  </div>
                  <div>
                    <p className="font-bold text-green-400">{maxPayout.creatorPayout} SOL</p>
                    <p className="text-muted-foreground">Your Profit</p>
                  </div>
                  <div>
                    <p className="font-bold text-purple-400">{maxPayout.platformPayout} SOL</p>
                    <p className="text-muted-foreground">Platform</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Early Bonus - Very Compact */}
            <div className="glass-card p-4 sm:p-5 border-yellow-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                  <h3 className="font-semibold text-sm sm:text-base">Early Bird Bonus</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Score multiplier for early predictions</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-green-500/10 border border-green-500/30 rounded p-1.5 sm:p-2 text-center">
                  <p className="font-bold text-green-400 text-sm sm:text-base">1.5x</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">0-25%</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-1.5 sm:p-2 text-center">
                  <p className="font-bold text-blue-400 text-sm sm:text-base">1.25x</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">25-50%</p>
                </div>
                <div className="bg-secondary/50 border border-border rounded p-1.5 sm:p-2 text-center">
                  <p className="font-bold text-sm sm:text-base">1.0x</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">50-75%</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded p-1.5 sm:p-2 text-center">
                  <p className="font-bold text-red-400 text-sm sm:text-base">0.75x</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">75-100%</p>
                </div>
              </div>
            </div>

            {/* Staking Status - Compact */}
            <div className={`glass-card p-4 sm:p-5 ${canCreateEvent ? 'border-primary/30' : 'border-red-500/30'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${getTierBgColor(currentTierName)} border`}>
                    <span className="text-lg sm:text-xl">{tierInfo.emoji}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">Staking Status</h3>
                    <p className={`text-xs sm:text-sm ${getTierColor(currentTierName)}`}>{tierInfo.name} Tier</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-bold text-primary">{formatSyraAmount(stakedAmount)} SYRA</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">staked</p>
                </div>
              </div>

              {/* Daily Events Bar */}
              <div className="bg-secondary/50 rounded-lg p-2 sm:p-3 mb-3">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                  <span className="text-muted-foreground">Events Today</span>
                  <span className={`font-bold ${canCreateEvent ? 'text-green-400' : 'text-red-400'}`}>
                    {remainingEventsToday}/{dailyLimit}
                  </span>
                </div>
                {dailyLimit > 0 && (
                  <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${(remainingEventsToday / dailyLimit) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Tier Quick Ref */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3">
                {(Object.entries(STAKING_TIERS) as [TierName, typeof STAKING_TIERS.FREE][])
                  .filter(([key]) => key !== 'FREE')
                  .map(([key, tier]) => {
                    const isCurrentTier = key === currentTierName;
                    return (
                      <div key={key} className={`p-1.5 sm:p-2 rounded text-center ${
                        isCurrentTier ? `${getTierBgColor(key)} border` : 'bg-secondary/30'
                      }`}>
                        <p className="text-xs sm:text-sm">{tier.emoji}</p>
                        <p className={`text-xs sm:text-sm font-semibold ${isCurrentTier ? getTierColor(key) : 'text-muted-foreground'}`}>
                          {tier.dailyEvents}/day
                        </p>
                      </div>
                    );
                  })}
              </div>

              {/* Creation Fee */}
              {creationFee > 0 && (
                <div className="p-2 sm:p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-3">
                  <p className="text-xs sm:text-sm text-yellow-400 flex items-center gap-1">
                    <Coins className="h-3 w-3 sm:h-4 sm:w-4" />
                    Creation fee: {formatSyraAmount(creationFee)} SYRA (burned)
                  </p>
                </div>
              )}

              {/* CTA */}
              {!canCreateEvent ? (
                <Link to="/staking">
                  <Button variant="outline" size="sm" className="w-full border-primary/50 hover:bg-primary/10">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Stake SYRA to Create
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <div className="p-2 sm:p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-green-400 flex items-center gap-1">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                    {remainingEventsToday} event{remainingEventsToday !== 1 ? 's' : ''} remaining today
                  </p>
                </div>
              )}
            </div>

            {/* Create Button - Sticky on Desktop */}
            <div className="lg:sticky lg:top-20 space-y-3">
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleCreate}
                disabled={!canCreateEvent || !selectedToken || isSubmitting || !hasEnoughSol || creatorDepositNum < 0.5}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : !canCreateEvent ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Stake SYRA to Create
                  </>
                ) : (
                  <>
                    Create Event ({creatorDepositNum || 0} SOL)
                  </>
                )}
              </Button>

              <p className="text-xs sm:text-sm text-center text-muted-foreground">
                Deposit → Winners | Fees → {distribution.creator}% You ({currentPayout.creatorPayout}-{maxPayout.creatorPayout} SOL profit)
                {creationFee > 0 && ` | Fee: ${formatSyraAmount(creationFee)} SYRA`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
