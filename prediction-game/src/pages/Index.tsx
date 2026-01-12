import { Link } from "react-router-dom";
import {
  ArrowRight,
  Trophy,
  Users,
  Zap,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockStats } from "@/data/mockData";

interface IndexProps {
  onOpenWalletModal: () => void;
}

const Index: React.FC<IndexProps> = ({ onOpenWalletModal }) => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute rounded-full top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-3xl animate-pulse-glow" />
          <div
            className="absolute rounded-full bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 blur-3xl animate-pulse-glow"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="container relative z-10 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border rounded-full bg-primary/10 border-primary/30 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Powered by Solana</span>
            </div>

            {/* Headline */}
            <h1
              className="mb-6 text-5xl font-bold md:text-7xl animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Predict. <span className="gradient-text">Compete.</span>
              <br />
              Win SOL.
            </h1>

            {/* Subheadline */}
            <p
              className="max-w-2xl mx-auto mb-10 text-xl text-muted-foreground animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Create or join crypto price prediction competitions. Put your
              market knowledge to the test and win real SOL rewards.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col justify-center gap-4 sm:flex-row animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <Button variant="hero" size="xl" onClick={onOpenWalletModal}>
                Connect Wallet
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to="/create">
                <Button
                  variant="secondary"
                  size="xl"
                  className="w-full sm:w-auto"
                >
                  Create Event
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div
              className="stat-card animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <p className="mb-2 text-4xl font-bold gradient-text">
                {mockStats.totalEvents.toLocaleString()}
              </p>
              <p className="text-muted-foreground">Total Events</p>
            </div>

            <div
              className="stat-card animate-fade-in"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/20">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <p className="mb-2 text-4xl font-bold gradient-text">
                {mockStats.totalParticipants.toLocaleString()}
              </p>
              <p className="text-muted-foreground">Total Participants</p>
            </div>

            <div
              className="stat-card animate-fade-in"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl bg-status-active/20">
                <Trophy className="w-6 h-6 text-status-active" />
              </div>
              <p className="mb-2 text-4xl font-bold gradient-text">
                {mockStats.totalRewardsGiven.toLocaleString()} SOL
              </p>
              <p className="text-muted-foreground">Total Rewards Given</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20">
        <div className="container mx-auto">
          <h2 className="mb-4 text-3xl font-bold text-center md:text-4xl">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="max-w-xl mx-auto mb-12 text-center text-muted-foreground">
            Simple, transparent, and rewarding. Here's how you can start
            winning.
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Create or Join",
                description:
                  "Create a prediction event or join an existing one. Pick your token and make your price prediction.",
              },
              {
                icon: Shield,
                title: "Lock Your Prediction",
                description:
                  "Pay 0.1 SOL entry fee to submit your prediction. All predictions are locked on-chain.",
              },
              {
                icon: Trophy,
                title: "Win Rewards",
                description:
                  "The closest predictions win! Top 3 share the prize pool. Accurate predictions = bigger wins.",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="p-8 text-center glass-card animate-fade-in"
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl gradient-border bg-secondary">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="mb-2 text-sm font-semibold text-primary">
                  Step {index + 1}
                </div>
                <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto">
          <div className="relative p-12 overflow-hidden text-center glass-card">
            <div
              className="absolute inset-0 opacity-30"
              style={{ background: "var(--gradient-hero)" }}
            />
            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Ready to <span className="gradient-text">Predict & Win</span>?
              </h2>
              <p className="max-w-lg mx-auto mb-8 text-muted-foreground">
                Join thousands of traders competing for SOL rewards. Your
                prediction skills could pay off big.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/dashboard">
                  <Button variant="hero" size="lg">
                    Join Event
                    <ArrowRight className="w-5 h-5 ml-2" />
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
      <footer className="px-4 py-8 border-t border-border/50">
        <div className="container flex flex-col items-center justify-between gap-4 mx-auto md:flex-row">
          <div className="flex items-center gap-2">
            <img
              src="/images/logo-transparent-notext.png"
              alt="SyraPredict Logo"
              className="rounded-lg w-9 h-9"
            />
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
