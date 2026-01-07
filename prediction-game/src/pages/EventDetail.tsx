import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Trophy, Users, Clock, Info, CheckCircle, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/CountdownTimer';
import { mockEvents } from '@/data/mockData';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useWallet();
  const [prediction, setPrediction] = useState('');

  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
            <p className="text-muted-foreground">
              This event doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleJoin = () => {
    if (!prediction) {
      toast.error('Please enter your price prediction');
      return;
    }
    toast.success('Joined event successfully! (Mock - trigger smart contract here)');
  };

  const statusConfig = {
    pending: {
      color: 'text-status-pending',
      bg: 'bg-status-pending/20',
      label: 'Pending - Waiting for participants',
    },
    active: {
      color: 'text-status-active',
      bg: 'bg-status-active/20',
      label: 'Active - Prediction period ongoing',
    },
    completed: {
      color: 'text-status-completed',
      bg: 'bg-status-completed/20',
      label: 'Completed - Winners announced',
    },
  };

  const status = statusConfig[event.status];
  const progressPercent = (event.participants / event.maxParticipants) * 100;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="glass-card p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-4xl">
                {event.tokenIcon}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{event.token} Price Prediction</h1>
                <p className="text-muted-foreground">Event #{event.id}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full ${status.bg} ${status.color} text-sm font-semibold`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </div>
          </div>

          <p className={`text-sm ${status.color} mb-6`}>
            <Clock className="inline h-4 w-4 mr-1" />
            {status.label}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Total Reward</span>
              </div>
              <p className="text-xl font-bold text-accent">{event.rewardPool} SOL</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Participants</span>
              </div>
              <p className="text-xl font-bold">{event.participants}/{event.maxParticipants}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className="text-sm">Creator Reward</span>
              </div>
              <p className="text-xl font-bold text-status-active">1.3 SOL</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className="text-sm">Platform Fee</span>
              </div>
              <p className="text-xl font-bold text-muted-foreground">0.2 SOL</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: 'var(--gradient-primary)',
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {event.maxParticipants - event.participants} spots remaining
            </p>
          </div>
        </div>

        {/* Countdown / Timer */}
        {event.status !== 'completed' && (
          <div className="glass-card p-6 mb-6 text-center">
            <p className="text-muted-foreground mb-4">Time Remaining</p>
            <CountdownTimer targetDate={event.endDate} size="lg" />
          </div>
        )}

        {/* Action Section based on status */}
        {event.status === 'pending' && isConnected && !event.userPrediction && (
          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold mb-4">Submit Your Prediction</h3>
            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-2">
                Your Price Prediction (USD)
              </label>
              <input
                type="number"
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                placeholder={`Enter ${event.token} price prediction`}
                className="input-field"
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg mb-4">
              <Info className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Entry fee: <span className="text-foreground font-semibold">0.1 SOL</span>
              </p>
            </div>
            <Button variant="hero" className="w-full" onClick={handleJoin}>
              Join Event (Pay 0.1 SOL)
            </Button>
          </div>
        )}

        {event.status === 'active' && event.userPrediction && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-status-active" />
              <h3 className="font-semibold">Your Prediction Submitted</h3>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Your Predicted Price</p>
              <p className="text-2xl font-bold">${event.userPrediction.toLocaleString()}</p>
            </div>
            <p className="text-muted-foreground text-center">
              ⏳ Waiting for the event to end...
            </p>
          </div>
        )}

        {event.status === 'completed' && (
          <div className="space-y-6">
            {/* Final Price */}
            <div className="glass-card p-6 text-center">
              <p className="text-muted-foreground mb-2">Final Price</p>
              <p className="text-4xl font-bold gradient-text">
                ${event.finalPrice?.toLocaleString()}
              </p>
            </div>

            {/* Winners */}
            {event.winners && (
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-status-pending" />
                  Winners
                </h3>
                <div className="space-y-3">
                  {event.winners.map((winner) => (
                    <div
                      key={winner.rank}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        winner.rank === 1
                          ? 'bg-status-pending/20 border border-status-pending/30'
                          : 'bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          winner.rank === 1 ? 'bg-status-pending/30' : 
                          winner.rank === 2 ? 'bg-muted' : 'bg-secondary'
                        }`}>
                          <Medal className={`h-5 w-5 ${
                            winner.rank === 1 ? 'text-status-pending' :
                            winner.rank === 2 ? 'text-muted-foreground' : 'text-primary'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">#{winner.rank} Place</p>
                          <p className="text-sm text-muted-foreground">{winner.address}</p>
                        </div>
                      </div>
                      <span className="font-bold text-accent">{winner.prize} SOL</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Result */}
            {event.userPrediction && (
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">Your Result</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Your Prediction</p>
                    <p className="text-xl font-bold">${event.userPrediction.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Actual Price</p>
                    <p className="text-xl font-bold">${event.finalPrice?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-muted-foreground">Your Rank</p>
                  <p className="text-2xl font-bold text-primary">#7</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!isConnected && (
          <div className="glass-card p-6 text-center">
            <p className="text-muted-foreground">
              Connect your wallet to participate in this event.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
