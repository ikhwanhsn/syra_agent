import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import { useWallet } from '@/contexts/WalletContext';
import api, { Event } from '@/services/api';

type TabType = 'all' | 'active' | 'created' | 'joined';

// Transform API event to EventCard format
const transformEvent = (event: Event, walletAddress?: string | null) => {
  const userJoined = event.participants?.some(p => p.walletAddress === walletAddress);
  const userPredictionData = event.predictions?.find(p => p.walletAddress === walletAddress);
  
  // Calculate total pool
  const participantCount = event.participants?.length || 0;
  const entryFeesCollected = participantCount * (event.entryFee || 0.1);
  const totalPool = (event.creatorDeposit || event.rewardPool || 0) + entryFeesCollected;
  
  return {
    id: event._id,
    token: event.tokenName,
    tokenIcon: event.tokenIcon,
    totalPool,
    creatorDeposit: event.creatorDeposit || event.rewardPool || 0,
    entryFee: event.entryFee || 0.1,
    participants: participantCount,
    predictions: event.predictions?.length || 0,
    minParticipants: event.minParticipants,
    maxParticipants: event.maxParticipants,
    status: event.status,
    joiningEndsAt: event.joiningEndsAt ? new Date(event.joiningEndsAt) : undefined,
    predictionEndsAt: event.predictionEndsAt ? new Date(event.predictionEndsAt) : undefined,
    resolutionAt: event.resolutionAt ? new Date(event.resolutionAt) : undefined,
    endDate: event.endDate ? new Date(event.endDate) : undefined,
    finalPrice: event.finalPrice,
    userJoined,
    userPrediction: userPredictionData?.predictedPrice,
    cancellationReason: event.cancellationReason,
    winners: event.winners?.map(w => ({
      address: w.walletAddress,
      prize: w.prize,
      rank: w.rank,
    })),
  };
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const { isConnected, walletAddress } = useWallet();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'all') {
        // Fetch all events
        const response = await api.getEvents({ limit: 50 });
        setEvents(response.events);
      } else if (activeTab === 'active') {
        // Fetch active events (joining, predicting, waiting)
        const response = await api.getEvents({ 
          status: 'joining,predicting,waiting',
          limit: 50 
        });
        setEvents(response.events);
      } else if (walletAddress) {
        // Fetch user-specific events
        const userEvents = await api.getUserEvents(walletAddress, activeTab);
        setEvents(Array.isArray(userEvents) ? userEvents : []);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTab, walletAddress]);

  // Group events by status for the "All" tab
  const groupedEvents = {
    active: events.filter(e => ['joining', 'predicting', 'waiting'].includes(e.status)),
    completed: events.filter(e => e.status === 'completed'),
    cancelled: events.filter(e => e.status === 'cancelled'),
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base md:text-lg">
              Please connect your wallet to view your dashboard and manage your prediction events.
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 gradient-text">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Manage your prediction events</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="default" 
              onClick={fetchEvents}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/create" className="transition-transform duration-300 hover:scale-105">
              <Button variant="gradient" size="default">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'active', label: 'Active' },
            { key: 'created', label: 'My Created' },
            { key: 'joined', label: 'Joined' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 relative ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(270_70%_60%/0.3)]'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Phase Legend */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
            <span className="text-muted-foreground">Joining - Pay entry fee</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-muted-foreground">Predicting - Submit prediction</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-400"></span>
            <span className="text-muted-foreground">Waiting - Resolution pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-muted-foreground">Completed</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary" />
                  <div className="h-6 w-24 rounded bg-secondary" />
                </div>
                <div className="h-4 w-full rounded bg-secondary mb-3" />
                <div className="h-4 w-3/4 rounded bg-secondary mb-3" />
                <div className="h-8 w-full rounded bg-secondary" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="glass-card p-12 text-center animate-fade-in-up">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchEvents}>
              Try Again
            </Button>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && !error && events.length > 0 && (
          <>
            {activeTab === 'all' ? (
              // Grouped view for All tab
              <div className="space-y-10">
                {/* Active Events */}
                {groupedEvents.active.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></span>
                      Active Events
                      <span className="text-sm sm:text-base font-normal text-muted-foreground">({groupedEvents.active.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedEvents.active.map((event, index) => (
                        <div
                          key={event._id}
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <EventCard event={transformEvent(event, walletAddress)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Events */}
                {groupedEvents.completed.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                      Completed Events
                      <span className="text-sm sm:text-base font-normal text-muted-foreground">({groupedEvents.completed.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedEvents.completed.map((event, index) => (
                        <div
                          key={event._id}
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <EventCard event={transformEvent(event, walletAddress)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancelled Events */}
                {groupedEvents.cancelled.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2 opacity-60">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      Cancelled Events
                      <span className="text-sm sm:text-base font-normal text-muted-foreground">({groupedEvents.cancelled.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                      {groupedEvents.cancelled.map((event, index) => (
                        <div
                          key={event._id}
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <EventCard event={transformEvent(event, walletAddress)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Simple grid for other tabs
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event, index) => (
                  <div
                    key={event._id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <EventCard event={transformEvent(event, walletAddress)} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <div className="glass-card p-8 text-center animate-fade-in-up">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base md:text-lg">
              {activeTab === 'all'
                ? "No events available yet. Be the first to create one!"
                : activeTab === 'active'
                ? "No active events at the moment."
                : activeTab === 'created'
                ? "You haven't created any events yet."
                : "You haven't joined any events yet."}
            </p>
            <Link 
              to={activeTab === 'joined' ? '/dashboard' : '/create'} 
              className="inline-block transition-transform duration-300 hover:scale-105"
            >
              <Button variant="gradient" size="default">
                {activeTab === 'joined' ? 'Browse Events' : 'Create Your First Event'}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
