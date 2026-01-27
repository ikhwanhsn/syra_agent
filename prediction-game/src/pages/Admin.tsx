import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  FileText, 
  Users, 
  Trophy,
  Zap,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Coins,
  Lock,
  Crown,
  Play,
  Eye,
  PiggyBank,
  CircleDollarSign,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api, { StatsResponse, Event } from '@/services/api';
import { stakingApi, StakingStats, LeaderboardEntry, formatSyraAmount, STAKING_TIERS, TierName, getTierColor } from '@/services/stakingApi';

const Admin = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [stakingStats, setStakingStats] = useState<StakingStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingTransitions, setIsProcessingTransitions] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, stakingStatsData, leaderboardData, eventsData] = await Promise.all([
        api.getStats(),
        stakingApi.getStats().catch(() => null),
        stakingApi.getLeaderboard(5).catch(() => ({ leaderboard: [] })),
        api.getEvents({ limit: 10 }),
      ]);
      
      setStats(statsData);
      setStakingStats(stakingStatsData);
      setLeaderboard(leaderboardData.leaderboard);
      setRecentEvents(eventsData.events || []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleProcessTransitions = async () => {
    setIsProcessingTransitions(true);
    try {
      const result = await api.processPhaseTransitions();
      toast.success(`Processed: ${result.transitionedFromJoining} from joining, ${result.transitionedFromPredicting} from predicting`);
      await fetchData();
    } catch (error) {
      toast.error('Failed to process transitions');
    } finally {
      setIsProcessingTransitions(false);
    }
  };

  const handleWithdraw = () => {
    toast.info('Withdrawal feature coming soon! (Requires smart contract integration)');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'joining': return <Users className="h-4 w-4 text-blue-400" />;
      case 'predicting': return <Eye className="h-4 w-4 text-yellow-400" />;
      case 'waiting': return <Clock className="h-4 w-4 text-purple-400" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'joining': return 'text-blue-400 bg-blue-500/10';
      case 'predicting': return 'text-yellow-400 bg-yellow-500/10';
      case 'waiting': return 'text-purple-400 bg-purple-500/10';
      case 'completed': return 'text-green-400 bg-green-500/10';
      case 'cancelled': return 'text-red-400 bg-red-500/10';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Platform statistics & management</p>
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

        {/* Platform Revenue Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="glass-card p-3 sm:p-4 hover-lift">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Platform</p>
                <p className="text-lg sm:text-xl font-bold text-purple-400">
                  {(stats?.totalPlatformEarned || 0).toFixed(2)} SOL
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4 hover-lift">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Creators</p>
                <p className="text-lg sm:text-xl font-bold text-green-400">
                  {(stats?.totalCreatorPaid || 0).toFixed(2)} SOL
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4 hover-lift">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Winners</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-400">
                  {(stats?.totalWinnersPaid || 0).toFixed(2)} SOL
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4 hover-lift">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Volume</p>
                <p className="text-lg sm:text-xl font-bold text-blue-400">
                  {(stats?.totalPoolDistributed || 0).toFixed(2)} SOL
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Event Breakdown */}
          <div className="glass-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-sm sm:text-base font-semibold">Event Statistics</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
              <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{stats?.totalEvents || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{stats?.activeEvents || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-blue-500/10">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-xs sm:text-sm">Joining</span>
                </div>
                <span className="font-bold text-xs sm:text-sm text-blue-400">{stats?.joiningEvents || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-yellow-500/10">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Eye className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs sm:text-sm">Predicting</span>
                </div>
                <span className="font-bold text-xs sm:text-sm text-yellow-400">{stats?.predictingEvents || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-purple-500/10">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span className="text-xs sm:text-sm">Waiting</span>
                </div>
                <span className="font-bold text-xs sm:text-sm text-purple-400">{stats?.waitingEvents || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-green-500/10">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-xs sm:text-sm">Completed</span>
                </div>
                <span className="font-bold text-xs sm:text-sm text-green-400">{stats?.completedEvents || 0}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Participants</p>
                <p className="text-lg sm:text-xl font-bold">{stats?.totalParticipants || 0}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Predictions</p>
                <p className="text-lg sm:text-xl font-bold">{stats?.totalPredictions || 0}</p>
              </div>
            </div>
          </div>

          {/* Staking Statistics */}
          <div className="glass-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-sm sm:text-base font-semibold">Staking Statistics</h2>
            </div>

            {stakingStats ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
                  <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold gradient-text">
                      {formatSyraAmount(stakingStats.totalStaked)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Staked</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold gradient-text">{stakingStats.totalStakers}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Stakers</p>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  {(Object.entries(STAKING_TIERS) as [TierName, typeof STAKING_TIERS.FREE][])
                    .filter(([key]) => key !== 'FREE')
                    .map(([key, tier]) => {
                      const tierData = stakingStats.tierDistribution?.[key];
                      return (
                        <div key={key} className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-secondary/30">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-base">{tier.emoji}</span>
                            <span className={`text-xs sm:text-sm ${getTierColor(key)}`}>{tier.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-xs sm:text-sm">{tierData?.count || 0}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                              ({formatSyraAmount(tierData?.totalStaked || 0)})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {stakingStats.totalSlashed > 0 && (
                  <div className="mt-3 p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-red-400">Slashed</span>
                      <span className="font-bold text-red-400">{formatSyraAmount(stakingStats.totalSlashed)}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Lock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No staking data</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions & Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Phase Transitions */}
          <div className="glass-card p-4 sm:p-5 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              <h2 className="text-sm sm:text-base font-semibold">Phase Transitions</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Trigger phase transitions for events at time limits.
            </p>
            <Button
              onClick={handleProcessTransitions}
              disabled={isProcessingTransitions}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              size="sm"
            >
              {isProcessingTransitions ? 'Processing...' : 'Process Transitions'}
            </Button>
          </div>

          {/* Withdrawal */}
          <div className="glass-card p-4 sm:p-5 border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              <h2 className="text-sm sm:text-base font-semibold">Platform Wallet</h2>
            </div>
            <div className="mb-3">
              <p className="text-xs sm:text-sm text-muted-foreground mb-0.5">Available</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">
                {(stats?.totalPlatformEarned || 0).toFixed(2)} SOL
              </p>
            </div>
            <Button
              onClick={handleWithdraw}
              variant="outline"
              className="w-full border-green-500/50 hover:bg-green-500/10"
              size="sm"
            >
              <ArrowDownToLine className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Top Stakers Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="glass-card p-4 sm:p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <h2 className="text-sm sm:text-base font-semibold">Top Stakers</h2>
              </div>
              <Link to="/staking">
                <Button variant="ghost" size="sm" className="h-7 sm:h-8 text-xs sm:text-sm">
                  View All <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Wallet</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Tier</th>
                    <th className="text-right py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Staked</th>
                    <th className="text-right py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.walletAddress} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-2 sm:py-3 px-2">
                        <span className={`font-bold text-xs sm:text-sm ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 font-mono text-xs sm:text-sm">
                        {entry.walletAddress.slice(0, 4)}...{entry.walletAddress.slice(-4)}
                      </td>
                      <td className="py-2 sm:py-3 px-2">
                        <span className={`inline-flex items-center gap-1 text-xs sm:text-sm ${getTierColor(entry.tier)}`}>
                          {STAKING_TIERS[entry.tier].emoji} {STAKING_TIERS[entry.tier].name}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 text-right font-bold text-xs sm:text-sm">
                        {formatSyraAmount(entry.stakedAmount)}
                      </td>
                      <td className="py-2 sm:py-3 px-2 text-right text-muted-foreground text-xs sm:text-sm">
                        {entry.totalEventsCreated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-sm sm:text-base font-semibold">Recent Events</h2>
            </div>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="h-7 sm:h-8 text-xs sm:text-sm">
                View All <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {recentEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Token</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Creator</th>
                    <th className="text-center py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Join</th>
                    <th className="text-right py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Pool</th>
                    <th className="text-right py-2 px-2 text-xs sm:text-sm font-medium text-muted-foreground">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event._id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-2 sm:py-3 px-2">
                        <Link to={`/event/${event._id}`} className="flex items-center gap-1.5 sm:gap-2 hover:text-primary">
                          <span className="text-base sm:text-lg">{event.tokenIcon}</span>
                          <span className="font-medium text-xs sm:text-sm">{event.token}</span>
                        </Link>
                      </td>
                      <td className="py-2 sm:py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm ${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)}
                          {event.status}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 font-mono text-xs sm:text-sm text-muted-foreground">
                        {event.creatorWallet?.slice(0, 4)}...{event.creatorWallet?.slice(-4)}
                      </td>
                      <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                        <span className={event.participants?.length >= event.minParticipants ? 'text-green-400' : ''}>
                          {event.participants?.length || 0}
                        </span>
                        <span className="text-muted-foreground">/{event.maxParticipants}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 text-right font-bold text-xs sm:text-sm text-yellow-400">
                        {event.creatorDeposit}
                      </td>
                      <td className="py-2 sm:py-3 px-2 text-right text-muted-foreground text-xs sm:text-sm">
                        {event.entryFee}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No events</p>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="mt-4 p-3 sm:p-4 bg-secondary/30 rounded-lg">
          <h3 className="text-xs sm:text-sm font-semibold mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            System Info
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Entry fees: 70% Creator / 30% Platform • Deposits: 100% to winners (50/30/20) • Bronze tier min to create
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
