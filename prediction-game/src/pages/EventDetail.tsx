import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Trophy, Users, Clock, Info, CheckCircle, Medal, ArrowLeft, RefreshCw, Timer, Zap, EyeOff, Eye, Play, XCircle, PiggyBank, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/CountdownTimer';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import api, { Event, getPhaseDisplayName, calculateTimeBonus, calculatePayoutBreakdown } from '@/services/api';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected, walletAddress } = useWallet();
  const [prediction, setPrediction] = useState('');
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isStartingPrediction, setIsStartingPrediction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.getEvent(id);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    const interval = setInterval(fetchEvent, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const userParticipant = useMemo(() => 
    event?.participants?.find(p => p.walletAddress === walletAddress),
    [event, walletAddress]
  );

  const userPrediction = useMemo(() => 
    event?.predictions?.find(p => p.walletAddress === walletAddress),
    [event, walletAddress]
  );

  const isCreator = event?.creatorWallet === walletAddress;

  const participants = event?.participants?.length || 0;
  const predictions = event?.predictions?.length || 0;
  const minParticipants = event?.minParticipants || 10;
  const maxParticipants = event?.maxParticipants || 25;

  // Calculate current payout breakdown
  const payoutBreakdown = useMemo(() => {
    if (!event) return null;
    return calculatePayoutBreakdown(
      event.creatorDeposit || event.rewardPool || 0,
      event.entryFee,
      participants,
      event.distribution || { winners: 70, creator: 20, platform: 10 },
      event.winnerSplit || { first: 50, second: 30, third: 20 }
    );
  }, [event, participants]);

  // Calculate max payout
  const maxPayoutBreakdown = useMemo(() => {
    if (!event) return null;
    return calculatePayoutBreakdown(
      event.creatorDeposit || event.rewardPool || 0,
      event.entryFee,
      maxParticipants,
      event.distribution || { winners: 70, creator: 20, platform: 10 },
      event.winnerSplit || { first: 50, second: 30, third: 20 }
    );
  }, [event, maxParticipants]);

  const currentTimeBonus = useMemo(() => {
    if (event?.status !== 'predicting' || !event.predictionStartsAt || !event.predictionEndsAt) {
      return null;
    }
    return calculateTimeBonus(
      new Date(),
      new Date(event.predictionStartsAt),
      new Date(event.predictionEndsAt)
    );
  }, [event]);

  const handleJoin = async () => {
    if (!walletAddress || !event) return;

    setIsJoining(true);
    try {
      // TODO: In production, send entry fee to treasury
      // const txSignature = await sendSol(event.entryFee, 'TREASURY_ADDRESS');
      
      const updatedEvent = await api.joinEvent(event._id, { walletAddress });
      setEvent(updatedEvent);
      toast.success('Successfully joined the event!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePredict = async () => {
    if (!prediction || !walletAddress || !event) return;

    setIsPredicting(true);
    try {
      const updatedEvent = await api.addPrediction(event._id, {
        walletAddress,
        predictedPrice: parseFloat(prediction),
      });
      setEvent(updatedEvent);
      setPrediction('');
      toast.success('Prediction submitted successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit prediction');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleStartPredictionPhase = async () => {
    if (!walletAddress || !event) return;

    setIsStartingPrediction(true);
    try {
      const updatedEvent = await api.startPredictionPhase(event._id, walletAddress);
      setEvent(updatedEvent);
      toast.success('Prediction phase started!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start prediction phase');
    } finally {
      setIsStartingPrediction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="glass-card p-6 animate-pulse max-w-4xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary" />
              <div>
                <div className="h-6 w-40 bg-secondary rounded mb-2" />
                <div className="h-4 w-24 bg-secondary rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-secondary rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="glass-card p-8 text-center max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-3">Event Not Found</h2>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">{error || "This event doesn't exist."}</p>
            <div className="flex gap-4 justify-center">
              <Link to="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Button onClick={fetchEvent}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    joining: { color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Joining Phase', icon: Users },
    predicting: { color: 'text-yellow-400', bg: 'bg-yellow-400/20', label: 'Prediction Phase', icon: EyeOff },
    waiting: { color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'Waiting Phase', icon: Clock },
    completed: { color: 'text-green-400', bg: 'bg-green-400/20', label: 'Completed', icon: Trophy },
    cancelled: { color: 'text-red-400', bg: 'bg-red-400/20', label: 'Cancelled', icon: XCircle },
  };

  const status = statusConfig[event.status];
  const StatusIcon = status.icon;
  const progressPercent = (participants / maxParticipants) * 100;
  const hasMinParticipants = participants >= minParticipants;

  let countdownDate: Date | null = null;
  let countdownLabel = '';
  
  if (event.status === 'joining' && event.joiningEndsAt) {
    countdownDate = new Date(event.joiningEndsAt);
    countdownLabel = 'Joining Phase Ends In';
  } else if (event.status === 'predicting' && event.predictionEndsAt) {
    countdownDate = new Date(event.predictionEndsAt);
    countdownLabel = 'Prediction Phase Ends In';
  } else if (event.status === 'waiting' && event.resolutionAt) {
    countdownDate = new Date(event.resolutionAt);
    countdownLabel = 'Resolution In';
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm sm:text-base">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header */}
            <div className="glass-card p-5 animate-fade-in-up">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-secondary flex items-center justify-center text-3xl sm:text-4xl">
                    {event.tokenIcon}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">{event.tokenName} Prediction</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">Event #{event._id.slice(-8)}</p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full ${status.bg} ${status.color} text-xs font-semibold flex items-center gap-1.5`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <PiggyBank className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Total Pool</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-accent">{payoutBreakdown?.totalPool || 0} SOL</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {event.creatorDeposit || event.rewardPool} + {payoutBreakdown?.entryFeesCollected || 0} fees
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Participants</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold">{participants}/{maxParticipants}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Min: {minParticipants}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">1st Prize</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-yellow-400">{payoutBreakdown?.firstPrize || 0} SOL</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Coins className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Entry Fee</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold">{event.entryFee} SOL</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-1.5">
                  <span>{participants} joined</span>
                  <span>{maxParticipants - participants} spots remaining</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                      background: hasMinParticipants 
                        ? 'linear-gradient(90deg, hsl(145 70% 50%) 0%, hsl(190 90% 50%) 100%)'
                        : 'linear-gradient(90deg, hsl(270 70% 60%) 0%, hsl(220 70% 60%) 100%)',
                    }}
                  />
                </div>
                {!hasMinParticipants && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {minParticipants - participants} more needed to start
                  </p>
                )}
              </div>

              {/* Creator Info */}
              <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  By: <span className="font-mono text-foreground">{event.creatorWallet.slice(0, 4)}...{event.creatorWallet.slice(-4)}</span>
                  {isCreator && <span className="ml-1 text-primary">(You)</span>}
                </p>
                <Button variant="ghost" size="sm" onClick={fetchEvent} className="h-7 text-xs sm:text-sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* JOINING PHASE */}
            {event.status === 'joining' && (
              <>
                {isConnected && !userParticipant && (
                  <div className="glass-card p-4 sm:p-5 border-blue-500/30">
                    <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      Join This Event
                    </h3>
                    <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
                      Pay entry fee to secure your spot. Predictions start when minimum participants join.
                    </p>
                    <div className="flex items-center gap-2 p-2 sm:p-3 bg-blue-500/10 rounded-lg mb-3">
                      <Info className="h-4 w-4 text-blue-400" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Entry fee: <span className="text-foreground font-semibold">{event.entryFee} SOL</span>
                      </p>
                    </div>
                    <Button variant="hero" className="w-full" onClick={handleJoin} disabled={isJoining}>
                      {isJoining ? 'Joining...' : `Join (${event.entryFee} SOL)`}
                    </Button>
                  </div>
                )}

                {userParticipant && (
                  <div className="glass-card p-4 sm:p-5 border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                      <h3 className="font-semibold text-sm sm:text-base">You've Joined!</h3>
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Waiting for prediction phase ({event.predictionPhaseDuration}h to predict).
                    </p>
                  </div>
                )}

                {isCreator && hasMinParticipants && (
                  <div className="glass-card p-4 sm:p-5 border-yellow-500/30">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
                      <Play className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      Start Early
                    </h3>
                    <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
                      Min participants reached! Start now or wait for more.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleStartPredictionPhase} disabled={isStartingPrediction}>
                      {isStartingPrediction ? 'Starting...' : 'Start Now'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* PREDICTION PHASE */}
            {event.status === 'predicting' && (
              <>
                {currentTimeBonus && (
                  <div className="glass-card p-4 sm:p-5 border-yellow-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base">Time Bonus</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{currentTimeBonus.label}</p>
                        </div>
                      </div>
                      <div className={`text-2xl sm:text-3xl font-bold ${
                        currentTimeBonus.bonus >= 1.25 ? 'text-green-400' : 
                        currentTimeBonus.bonus >= 1.0 ? 'text-foreground' : 'text-red-400'
                      }`}>
                        {currentTimeBonus.bonus}x
                      </div>
                    </div>
                  </div>
                )}

                {userParticipant && !userPrediction && (
                  <div className="glass-card p-4 sm:p-5 border-yellow-500/30">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      Submit Prediction
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      Hidden until phase ends. Predict early for bonus!
                    </p>
                    <div className="mb-3">
                      <label className="block text-xs sm:text-sm text-muted-foreground mb-1">
                        Price Prediction (USD)
                      </label>
                      <input
                        type="number"
                        value={prediction}
                        onChange={(e) => setPrediction(e.target.value)}
                        placeholder={`${event.tokenName} price`}
                        className="input-field h-10 text-sm sm:text-base"
                        disabled={isPredicting}
                      />
                    </div>
                    <Button variant="hero" className="w-full" onClick={handlePredict} disabled={isPredicting || !prediction}>
                      {isPredicting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                )}

                {userPrediction && (
                  <div className="glass-card p-4 sm:p-5 border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                      <h3 className="font-semibold text-sm sm:text-base">Submitted!</h3>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-0.5">Your Prediction</p>
                      <p className="text-xl sm:text-2xl font-bold">${userPrediction.predictedPrice?.toLocaleString() || '***'}</p>
                      {userPrediction.isEarlyPrediction && (
                        <p className="text-xs sm:text-sm text-green-400 mt-1 flex items-center gap-1">
                          <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                          Bonus: {userPrediction.timeBonus}x
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!userParticipant && isConnected && (
                  <div className="glass-card p-4 sm:p-5 border-red-500/30">
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      You didn't join during joining phase.
                    </p>
                  </div>
                )}

                <div className="glass-card p-4 sm:p-5">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    Predictions ({predictions}/{participants})
                  </h3>
                  <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${participants > 0 ? (predictions / participants) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* WAITING PHASE */}
            {event.status === 'waiting' && (
              <div className="glass-card p-4 sm:p-5">
                <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  Predictions ({event.predictions.length})
                </h3>
                <div className="space-y-1.5 sm:space-y-2 max-h-56 overflow-y-auto">
                  {event.predictions.map((p, idx) => (
                    <div 
                      key={idx}
                      className={`flex justify-between items-center p-2 sm:p-3 rounded-lg bg-secondary/50 text-sm sm:text-base ${
                        p.walletAddress === walletAddress ? 'border border-primary/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                          {p.walletAddress.slice(0, 4)}...{p.walletAddress.slice(-4)}
                        </span>
                        {p.walletAddress === walletAddress && <span className="text-xs sm:text-sm text-primary">(You)</span>}
                        {p.isEarlyPrediction && (
                          <span className="text-xs sm:text-sm text-green-400">{p.timeBonus}x</span>
                        )}
                      </div>
                      <span className="font-semibold">${p.predictedPrice?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPLETED */}
            {event.status === 'completed' && (
              <div className="space-y-4">
                <div className="glass-card p-4 sm:p-5 text-center">
                  <p className="text-muted-foreground mb-1 text-xs sm:text-sm">Final Price</p>
                  <p className="text-3xl sm:text-4xl font-bold gradient-text">
                    ${event.finalPrice?.toLocaleString()}
                  </p>
                </div>

                {event.winners && event.winners.length > 0 && (
                  <div className="glass-card p-4 sm:p-5">
                    <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      Winners
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {event.winners.map((winner) => (
                        <div
                          key={winner.rank}
                          className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${
                            winner.rank === 1 ? 'bg-yellow-400/20 border border-yellow-400/30' :
                            winner.rank === 2 ? 'bg-gray-400/20 border border-gray-400/30' :
                            'bg-orange-400/20 border border-orange-400/30'
                          } ${winner.walletAddress === walletAddress ? 'ring-2 ring-primary' : ''}`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                              winner.rank === 1 ? 'bg-yellow-400/30' : 
                              winner.rank === 2 ? 'bg-gray-400/30' : 'bg-orange-400/30'
                            }`}>
                              <Medal className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                winner.rank === 1 ? 'text-yellow-400' :
                                winner.rank === 2 ? 'text-gray-400' : 'text-orange-400'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                                #{winner.rank}
                                {winner.walletAddress === walletAddress && <span className="text-xs sm:text-sm text-primary">(You!)</span>}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                                {winner.walletAddress.slice(0, 4)}...{winner.walletAddress.slice(-4)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-accent text-base sm:text-lg">{winner.prize} SOL</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.winners?.find(w => w.walletAddress === walletAddress) && (
                  <div className="glass-card p-4 sm:p-5 text-center bg-green-500/10 border border-green-500/30">
                    <p className="text-green-400 font-semibold text-sm sm:text-base">
                      🎉 You won {event.winners.find(w => w.walletAddress === walletAddress)?.prize} SOL!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CANCELLED */}
            {event.status === 'cancelled' && (
              <div className="glass-card p-4 sm:p-5 border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                  <h3 className="font-semibold text-sm sm:text-base">Cancelled</h3>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {event.cancellationReason || 'Event cancelled.'}
                </p>
                {userParticipant && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Entry fee ({userParticipant.entryFeePaid} SOL) refunded.
                  </p>
                )}
              </div>
            )}

            {!isConnected && (
              <div className="glass-card p-4 sm:p-5 text-center">
                <p className="text-muted-foreground text-xs sm:text-sm">Connect wallet to participate.</p>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Countdown */}
            {countdownDate && event.status !== 'completed' && event.status !== 'cancelled' && (
              <div className="glass-card p-4 sm:p-5 text-center">
                <p className="text-muted-foreground mb-2 text-xs sm:text-sm font-medium">{countdownLabel}</p>
                <CountdownTimer targetDate={countdownDate} size="md" />
              </div>
            )}

            {/* Prize Breakdown */}
            <div className="glass-card p-4 sm:p-5 border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <h3 className="font-semibold text-sm sm:text-base">Prizes</h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">🥇 1st</p>
                  <p className="font-bold text-yellow-400 text-base sm:text-lg">{payoutBreakdown?.firstPrize || 0} SOL</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">🥈 2nd</p>
                    <p className="font-bold text-sm sm:text-base">{payoutBreakdown?.secondPrize || 0} SOL</p>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">🥉 3rd</p>
                    <p className="font-bold text-sm sm:text-base text-orange-400">{payoutBreakdown?.thirdPrize || 0} SOL</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 text-xs sm:text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Creator</span>
                  <span className="text-blue-400 font-medium">{payoutBreakdown?.creatorPayout || 0} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform</span>
                  <span className="font-medium">{payoutBreakdown?.platformPayout || 0} SOL</span>
                </div>
              </div>
            </div>

            {/* Time Bonus Info */}
            {event.status === 'predicting' && (
              <div className="glass-card p-4 sm:p-5 border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                  <h3 className="font-semibold text-sm sm:text-base">Early Bonus</h3>
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center">
                  <div className="bg-green-500/10 rounded p-1.5 sm:p-2">
                    <p className="font-bold text-green-400 text-xs sm:text-sm">1.5x</p>
                    <p className="text-xs text-muted-foreground">0-25%</p>
                  </div>
                  <div className="bg-blue-500/10 rounded p-1.5 sm:p-2">
                    <p className="font-bold text-blue-400 text-xs sm:text-sm">1.25x</p>
                    <p className="text-xs text-muted-foreground">25-50%</p>
                  </div>
                  <div className="bg-secondary/50 rounded p-1.5 sm:p-2">
                    <p className="font-bold text-xs sm:text-sm">1.0x</p>
                    <p className="text-xs text-muted-foreground">50-75%</p>
                  </div>
                  <div className="bg-red-500/10 rounded p-1.5 sm:p-2">
                    <p className="font-bold text-red-400 text-xs sm:text-sm">0.75x</p>
                    <p className="text-xs text-muted-foreground">75-100%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
