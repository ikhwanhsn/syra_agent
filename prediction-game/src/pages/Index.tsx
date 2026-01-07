import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users, Zap, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockStats } from '@/data/mockData';

interface IndexProps {
  onOpenWalletModal: () => void;
}

const Index: React.FC<IndexProps> = ({ onOpenWalletModal }) => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by Solana</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Predict.{' '}
              <span className="gradient-text">Compete.</span>
              <br />
              Win SOL.
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Create or join crypto price prediction competitions. Put your market knowledge to the test and win real SOL rewards.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button variant="hero" size="xl" onClick={onOpenWalletModal}>
                Connect Wallet
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Link to="/create">
                <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                  Create Event
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <p className="text-4xl font-bold gradient-text mb-2">
                {mockStats.totalEvents.toLocaleString()}
              </p>
              <p className="text-muted-foreground">Total Events</p>
            </div>

            <div className="stat-card animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <p className="text-4xl font-bold gradient-text mb-2">
                {mockStats.totalParticipants.toLocaleString()}
              </p>
              <p className="text-muted-foreground">Total Participants</p>
            </div>

            <div className="stat-card animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-status-active/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-status-active" />
              </div>
              <p className="text-4xl font-bold gradient-text mb-2">
                {mockStats.totalRewardsGiven.toLocaleString()} SOL
              </p>
              <p className="text-muted-foreground">Total Rewards Given</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Simple, transparent, and rewarding. Here's how you can start winning.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Create or Join',
                description: 'Create a prediction event or join an existing one. Pick your token and make your price prediction.',
              },
              {
                icon: Shield,
                title: 'Lock Your Prediction',
                description: 'Pay 0.1 SOL entry fee to submit your prediction. All predictions are locked on-chain.',
              },
              {
                icon: Trophy,
                title: 'Win Rewards',
                description: 'The closest predictions win! Top 3 share the prize pool. Accurate predictions = bigger wins.',
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="glass-card p-8 text-center animate-fade-in"
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center gradient-border bg-secondary">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm text-primary font-semibold mb-2">Step {index + 1}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ background: 'var(--gradient-hero)' }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to <span className="gradient-text">Predict & Win</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands of traders competing for SOL rewards. Your prediction skills could pay off big.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dashboard">
                  <Button variant="hero" size="lg">
                    Join Event
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/create">
                  <Button variant="secondary" size="lg">
                    Create Event
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
              <span className="text-foreground font-bold text-xs">S</span>
            </div>
            <span className="font-semibold">SyraPredict</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SyraPredict. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
