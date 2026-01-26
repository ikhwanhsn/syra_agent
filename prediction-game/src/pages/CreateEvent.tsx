import { useState } from 'react';
import { Info, AlertTriangle, Coins, Trophy, Users, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { tokens } from '@/data/mockData';
import { toast } from 'sonner';

const CreateEvent = () => {
  const { isConnected, syraBalance } = useWallet();
  const [selectedToken, setSelectedToken] = useState('');
  const [rewardPool, setRewardPool] = useState('2.5');

  const requiredParticipants = 25;
  const entryFee = 0.1;
  const platformFee = 0.2;
  const creatorReward = 1.3;
  const prizeDistribution = { first: 0.5, second: 0.3, third: 0.2 };

  const getTier = () => {
    if (syraBalance >= 10_000_000) return { limit: 'Unlimited', tier: 'Diamond' };
    if (syraBalance >= 1_000_000) return { limit: '5 events/day', tier: 'Gold' };
    return { limit: '3 events/day', tier: 'Silver' };
  };

  const tier = getTier();
  const eventsCreatedToday = 2; // Mock value
  const canCreateMore = tier.limit === 'Unlimited' || 
    (tier.tier === 'Gold' && eventsCreatedToday < 5) ||
    (tier.tier === 'Silver' && eventsCreatedToday < 3);

  const handleCreate = () => {
    if (!selectedToken) {
      toast.error('Please select a token');
      return;
    }
    toast.success('Event created successfully! (Mock - trigger smart contract here)');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to create prediction events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">Create Event</h1>
        <p className="text-muted-foreground mb-10 text-lg">
          Set up a new price prediction competition
        </p>

        <div className="space-y-6">
          {/* Token Selection */}
          <div className="glass-card p-6 mb-6">
            <label className="block text-sm font-semibold mb-4">Select Token</label>
            <div className="grid grid-cols-4 gap-3">
              {tokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => setSelectedToken(token.symbol)}
                  className={`p-4 rounded-lg border transition-all duration-300 group ${
                    selectedToken === token.symbol
                      ? 'border-primary bg-primary/10 shadow-[0_0_20px_hsl(270_70%_60%/0.3)] scale-105'
                      : 'border-border bg-secondary/50 hover:border-primary/40 hover:bg-secondary/70 hover:scale-105'
                  }`}
                >
                  <div className="text-2xl mb-1 transition-transform duration-300 group-hover:scale-110">{token.icon}</div>
                  <div className="text-sm font-semibold">{token.symbol}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reward Pool */}
          <div className="glass-card p-6 mb-6">
            <label className="block text-sm font-semibold mb-4">Total Reward Pool (SOL)</label>
            <input
              type="number"
              value={rewardPool}
              onChange={(e) => setRewardPool(e.target.value)}
              className="input-field"
              placeholder="Enter reward pool"
              min="1"
              step="0.1"
            />
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
              <Info className="h-4 w-4" />
              Required participants: <span className="font-semibold text-primary">{requiredParticipants}</span> users
            </p>
          </div>

          {/* Fee Breakdown */}
          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold mb-5 text-lg">Fee Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Entry fee per user</span>
                </div>
                <span className="font-semibold">{entryFee} SOL</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <span>Prize distribution</span>
                </div>
                <span className="font-semibold">
                  {prizeDistribution.first} / {prizeDistribution.second} / {prizeDistribution.third} SOL
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Creator reward</span>
                </div>
                <span className="font-semibold text-status-active">{creatorReward} SOL</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Percent className="h-4 w-4" />
                  <span>Platform fee</span>
                </div>
                <span className="font-semibold text-muted-foreground">{platformFee} SOL</span>
              </div>
            </div>
          </div>

          {/* SYRA Token Requirement */}
          <div className="glass-card p-6 border-primary/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xl">💎</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">$SYRA Token Benefits</h3>
                <p className="text-sm text-muted-foreground">
                  Hold $SYRA tokens to create more events per day
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                syraBalance >= 10_000_000 ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/50'
              }`}>
                <span className={syraBalance >= 10_000_000 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                  ≥10M $SYRA
                </span>
                <span className={syraBalance >= 10_000_000 ? 'text-primary' : 'text-muted-foreground'}>
                  🔥 Unlimited events/day
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                syraBalance >= 1_000_000 && syraBalance < 10_000_000 ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/50'
              }`}>
                <span className={syraBalance >= 1_000_000 && syraBalance < 10_000_000 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                  ≥1M $SYRA
                </span>
                <span className={syraBalance >= 1_000_000 && syraBalance < 10_000_000 ? 'text-primary' : 'text-muted-foreground'}>
                  ⭐ 5 events/day
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                syraBalance < 1_000_000 ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/50'
              }`}>
                <span className={syraBalance < 1_000_000 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                  {'<'}1M $SYRA
                </span>
                <span className={syraBalance < 1_000_000 ? 'text-primary' : 'text-muted-foreground'}>
                  📊 3 events/day
                </span>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-sm">
                Your balance: <span className="font-bold text-primary">{(syraBalance / 1_000_000).toFixed(1)}M $SYRA</span>
                <span className="mx-2">•</span>
                Tier: <span className="font-semibold">{tier.tier}</span>
              </p>
            </div>
          </div>

          {/* Warning if limit exceeded */}
          {!canCreateMore && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Daily limit reached</p>
                <p className="text-sm text-muted-foreground">
                  You've created {eventsCreatedToday} events today. Hold more $SYRA to increase your limit.
                </p>
              </div>
            </div>
          )}

          {/* Create Button */}
          <Button
            variant="hero"
            size="lg"
            className="w-full mt-6"
            onClick={handleCreate}
            disabled={!canCreateMore || !selectedToken}
          >
            Create Event
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
