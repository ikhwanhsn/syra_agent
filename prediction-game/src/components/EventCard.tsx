import { Users, Trophy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CountdownTimer from './CountdownTimer';
import { Link } from 'react-router-dom';

export type EventStatus = 'pending' | 'active' | 'completed';

export interface Event {
  id: string;
  token: string;
  tokenIcon: string;
  rewardPool: number;
  participants: number;
  maxParticipants: number;
  status: EventStatus;
  endDate: Date;
  creatorAddress?: string;
  userPrediction?: number;
  finalPrice?: number;
  winners?: { address: string; prize: number; rank: number }[];
}

interface EventCardProps {
  event: Event;
  showViewButton?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, showViewButton = true }) => {
  const statusClasses = {
    pending: 'status-pending',
    active: 'status-active',
    completed: 'status-completed',
  };

  const statusLabels = {
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
  };

  const progressPercent = (event.participants / event.maxParticipants) * 100;

  return (
    <div className="event-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
            {event.tokenIcon}
          </div>
          <div>
            <h3 className="font-bold text-lg">{event.token}</h3>
            <p className="text-sm text-muted-foreground">Price Prediction</p>
          </div>
        </div>
        <span className={`status-badge ${statusClasses[event.status]}`}>
          {statusLabels[event.status]}
        </span>
      </div>

      <div className="space-y-4">
        {/* Reward Pool */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>Reward Pool</span>
          </div>
          <span className="font-bold text-accent">{event.rewardPool} SOL</span>
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
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: 'var(--gradient-primary)',
              }}
            />
          </div>
        </div>

        {/* Countdown */}
        {event.status !== 'completed' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Time Remaining</span>
            <CountdownTimer targetDate={event.endDate} size="sm" />
          </div>
        )}

        {/* User Prediction (if joined) */}
        {event.userPrediction && (
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Your Prediction</p>
            <p className="font-bold text-lg">${event.userPrediction.toLocaleString()}</p>
          </div>
        )}

        {/* View Button */}
        {showViewButton && (
          <Link to={`/event/${event.id}`}>
            <Button variant="secondary" className="w-full mt-2">
              <Eye className="h-4 w-4 mr-2" />
              View Event Detail
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default EventCard;
