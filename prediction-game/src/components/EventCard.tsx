import { Users, Trophy, Eye, Clock, EyeOff, Timer, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CountdownTimer from './CountdownTimer';
import { Link } from 'react-router-dom';

export type EventStatus = 'joining' | 'predicting' | 'waiting' | 'completed' | 'cancelled';

export interface Event {
  id: string;
  token: string;
  tokenIcon: string;
  totalPool: number;
  creatorDeposit: number;
  entryFee: number;
  participants: number;
  predictions?: number;
  minParticipants: number;
  maxParticipants: number;
  status: EventStatus;
  joiningEndsAt?: Date;
  predictionEndsAt?: Date;
  resolutionAt?: Date;
  endDate?: Date;
  creatorAddress?: string;
  userPrediction?: number;
  userJoined?: boolean;
  finalPrice?: number;
  winners?: { address: string; prize: number; rank: number }[];
  cancellationReason?: string;
}

interface EventCardProps {
  event: Event;
  showViewButton?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, showViewButton = true }) => {
  const statusConfig = {
    joining: {
      classes: 'bg-primary/15 text-primary border-primary/30',
      label: 'Joining',
      icon: Users,
    },
    predicting: {
      classes: 'bg-warning/15 text-warning border-warning/30',
      label: 'Predicting',
      icon: EyeOff,
    },
    waiting: {
      classes: 'bg-muted text-muted-foreground border-border',
      label: 'Waiting',
      icon: Clock,
    },
    completed: {
      classes: 'bg-success/15 text-success border-success/30',
      label: 'Completed',
      icon: Trophy,
    },
    cancelled: {
      classes: 'bg-destructive/15 text-destructive border-destructive/30',
      label: 'Cancelled',
      icon: XCircle,
    },
  };

  const status = statusConfig[event.status] || statusConfig.joining;
  const StatusIcon = status.icon;
  const progressPercent = (event.participants / event.maxParticipants) * 100;
  const hasMinParticipants = event.participants >= event.minParticipants;

  // Determine countdown date and label based on status
  let countdownDate: Date | null = null;
  let countdownLabel = '';
  
  if (event.status === 'joining' && event.joiningEndsAt) {
    countdownDate = event.joiningEndsAt;
    countdownLabel = 'Joining ends';
  } else if (event.status === 'predicting' && event.predictionEndsAt) {
    countdownDate = event.predictionEndsAt;
    countdownLabel = 'Predict by';
  } else if (event.status === 'waiting' && event.resolutionAt) {
    countdownDate = event.resolutionAt;
    countdownLabel = 'Resolution';
  } else if (event.endDate && event.status !== 'completed' && event.status !== 'cancelled') {
    countdownDate = event.endDate;
    countdownLabel = 'Ends';
  }

  return (
    <div className="event-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_hsl(var(--ring)/0.2)]">
            {event.tokenIcon}
          </div>
          <div>
            <h3 className="font-bold text-lg transition-colors duration-300 group-hover:text-primary">{event.token}</h3>
            <p className="text-sm text-muted-foreground">Price Prediction</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${status.classes}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      <div className="space-y-4">
        {/* Total Pool */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>Prize Pool</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-foreground">{event.totalPool.toFixed(2)} SOL</span>
            <p className="text-xs text-muted-foreground">Entry: {event.entryFee} SOL</p>
          </div>
        </div>

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Participants</span>
            </div>
            <span className="font-semibold">
              {event.participants}/{event.maxParticipants}
              {event.status === 'joining' && !hasMinParticipants && (
                <span className="text-xs text-muted-foreground ml-1">(min: {event.minParticipants})</span>
              )}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: hasMinParticipants
                  ? 'linear-gradient(90deg, hsl(var(--success)) 0%, hsl(var(--foreground) / 0.85) 100%)'
                  : 'linear-gradient(90deg, hsl(var(--muted-foreground) / 0.35) 0%, hsl(var(--ring) / 0.45) 100%)',
              }}
            />
          </div>
          {event.status === 'joining' && !hasMinParticipants && (
            <p className="text-xs text-muted-foreground mt-1">
              {event.minParticipants - event.participants} more needed to start
            </p>
          )}
        </div>

        {/* Predictions count for predicting/waiting phases */}
        {(event.status === 'predicting' || event.status === 'waiting') && event.predictions !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Predictions</span>
            <span className="font-semibold">{event.predictions}/{event.participants}</span>
          </div>
        )}

        {/* Countdown */}
        {countdownDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {countdownLabel}
            </span>
            <CountdownTimer targetDate={countdownDate} size="sm" />
          </div>
        )}

        {/* User Status */}
        {event.userJoined && event.status === 'joining' && (
          <div className="bg-success/10 border border-success/25 rounded-lg p-2 text-center">
            <p className="text-xs text-success">You've joined this event</p>
          </div>
        )}

        {/* User Prediction (if joined and predicted) */}
        {event.userPrediction && (
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Your Prediction</p>
            <p className="font-bold text-lg">${event.userPrediction.toLocaleString()}</p>
          </div>
        )}

        {/* Final Price for completed */}
        {event.status === 'completed' && event.finalPrice && (
          <div className="bg-success/10 border border-success/25 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Final Price</p>
            <p className="font-bold text-lg text-success">${event.finalPrice.toLocaleString()}</p>
          </div>
        )}

        {/* Cancelled reason */}
        {event.status === 'cancelled' && event.cancellationReason && (
          <div className="bg-destructive/10 border border-destructive/25 rounded-lg p-2">
            <p className="text-xs text-destructive">{event.cancellationReason}</p>
          </div>
        )}

        {/* View Button */}
        {showViewButton && (
          <Link to={`/event/${event.id}`} className="block mt-2">
            <Button variant="secondary" className="w-full group/btn">
              <Eye className="h-4 w-4 mr-2 transition-transform duration-300 group-hover/btn:scale-110" />
              View Event Detail
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default EventCard;
