import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import { mockCreatedEvents, mockJoinedEvents } from '@/data/mockData';
import { useWallet } from '@/contexts/WalletContext';

type TabType = 'created' | 'joined';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const { isConnected } = useWallet();

  const events = activeTab === 'created' ? mockCreatedEvents : mockJoinedEvents;

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view your dashboard and manage your prediction events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your prediction events</p>
          </div>
          <Link to="/create">
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('created')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'created'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            My Created Events
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'joined'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Joined Events
          </button>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {activeTab === 'created'
                ? "You haven't created any events yet."
                : "You haven't joined any events yet."}
            </p>
            <Link to={activeTab === 'created' ? '/create' : '/dashboard'}>
              <Button variant="gradient">
                {activeTab === 'created' ? 'Create Your First Event' : 'Browse Events'}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
