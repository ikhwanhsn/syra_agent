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
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Manage your prediction events</p>
          </div>
          <Link to="/create" className="transition-transform duration-300 hover:scale-105">
            <Button variant="gradient" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-10">
          <button
            onClick={() => setActiveTab('created')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 relative ${
              activeTab === 'created'
                ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(270_70%_60%/0.4)]'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:border-primary/30 border border-transparent'
            }`}
          >
            My Created Events
            {activeTab === 'created' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent-blue to-accent rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 relative ${
              activeTab === 'joined'
                ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(270_70%_60%/0.4)]'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:border-primary/30 border border-transparent'
            }`}
          >
            Joined Events
            {activeTab === 'joined' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent-blue to-accent rounded-full" />
            )}
          </button>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center animate-fade-in-up">
            <p className="text-muted-foreground mb-6 text-lg">
              {activeTab === 'created'
                ? "You haven't created any events yet."
                : "You haven't joined any events yet."}
            </p>
            <Link to={activeTab === 'created' ? '/create' : '/dashboard'} className="inline-block transition-transform duration-300 hover:scale-105">
              <Button variant="gradient" size="lg">
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
