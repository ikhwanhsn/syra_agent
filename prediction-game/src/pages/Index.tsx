import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Trophy,
  Users,
  Zap,
  TrendingUp,
  Shield,
  Sparkles,
  Coins,
  Lock,
  PiggyBank,
  Target,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  Play,
  Gift,
  Wallet,
  BarChart3,
  Crown,
  Star,
  ArrowUpRight,
  Timer,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import api, { StatsResponse, Event } from "@/services/api";
import { STAKING_TIERS, formatSyraAmount } from "@/services/stakingApi";
import EventCard from "@/components/EventCard";

interface IndexProps {
  onOpenWalletModal: () => void;
}

const Index: React.FC<IndexProps> = ({ onOpenWalletModal }) => {
  const { isConnected } = useWallet();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, eventsData] = await Promise.all([
          api.getStats(),
          api.getEvents({ status: 'joining', limit: 3 }),
        ]);
        setStats(statsData);
        setActiveEvents(eventsData.events || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <div
            className="absolute rounded-full top-1/2 left-1/2 w-72 h-72 bg-[hsl(210_100%_60%)]/15 blur-3xl animate-pulse-glow"
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        <div className="container relative z-10 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border rounded-full bg-primary/10 border-primary/30 animate-fade-in hover:border-primary/50 hover:bg-primary/15 transition-all duration-300 hover:scale-105">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">Powered by Solana & $SYRA Token</span>
            </div>

            {/* Headline */}
            <h1
              className="mb-6 text-3xl font-bold sm:text-5xl md:text-7xl animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Predict Crypto Prices.
              <br />
              <span className="gradient-text">Win Real SOL.</span>
            </h1>

            {/* Subheadline */}
            <p
              className="max-w-2xl mx-auto mb-10 text-base sm:text-xl text-muted-foreground animate-fade-in px-2"
              style={{ animationDelay: "0.2s" }}
            >
              Join prediction competitions or create your own events. Put your market knowledge to the test 
              and compete for SOL prizes in a fair, transparent system.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col justify-center gap-4 sm:flex-row animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              {!isConnected ? (
                <Button variant="hero" size="xl" onClick={onOpenWalletModal}>
                  Connect Wallet
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Link to="/dashboard">
                  <Button variant="hero" size="xl">
                    Browse Events
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}
              <Link to="/create">
                <Button
                  variant="secondary"
                  size="xl"
                  className="w-full sm:w-auto"
                >
                  <PiggyBank className="w-5 h-5 mr-2" />
                  Create Event
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 animate-fade-in max-w-md sm:max-w-none mx-auto" style={{ animationDelay: "0.4s" }}>
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold gradient-text">
                  {isLoading ? "..." : (stats?.activeEvents || 0)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Events</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold gradient-text">
                  {isLoading ? "..." : (stats?.totalParticipants || 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Predictions</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold gradient-text">
                  {isLoading ? "..." : `${(stats?.totalWinnersPaid || 0).toFixed(1)}`}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">SOL Prizes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className="px-4 py-12 sm:py-20 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="mb-4 text-2xl font-bold text-center sm:text-3xl md:text-4xl">
            Choose Your <span className="gradient-text">Path</span>
          </h2>
          <p className="max-w-xl mx-auto mb-8 sm:mb-12 text-center text-muted-foreground text-sm sm:text-base">
            Whether you want to compete for prizes or earn from hosting events, we've got you covered.
          </p>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Participant Path */}
            <div className="glass-card p-5 sm:p-8 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">Join & Predict</h3>
                  <p className="text-blue-400 text-sm">For Participants</p>
                </div>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Pay Entry Fee to Join</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Small entry fee (0.1+ SOL) to compete</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Submit Your Prediction</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Predict the token price at resolution time</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Win SOL Prizes</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Top 3 closest predictions share the prize pool</p>
                  </div>
                </li>
              </ul>

              <div className="p-3 sm:p-4 bg-blue-500/10 rounded-xl mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  <span className="font-semibold text-sm sm:text-base">Prize Distribution</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-yellow-500/10 rounded-lg p-2">
                    <p className="font-bold text-yellow-400">50%</p>
                    <p className="text-xs text-muted-foreground">1st</p>
                  </div>
                  <div className="bg-gray-400/10 rounded-lg p-2">
                    <p className="font-bold text-gray-300">30%</p>
                    <p className="text-xs text-muted-foreground">2nd</p>
                  </div>
                  <div className="bg-orange-500/10 rounded-lg p-2">
                    <p className="font-bold text-orange-400">20%</p>
                    <p className="text-xs text-muted-foreground">3rd</p>
                  </div>
                </div>
              </div>

              <Link to="/dashboard">
                <Button variant="outline" className="w-full border-blue-500/50 hover:bg-blue-500/10">
                  Browse Events
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Creator Path */}
            <div className="glass-card p-5 sm:p-8 border-primary/30 hover:border-primary/50 transition-all duration-300 group">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">Create & Earn</h3>
                  <p className="text-primary text-sm">For Event Creators</p>
                </div>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Stake SYRA to Create</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Stake tokens to unlock event creation</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Deposit Prize Pool</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Your deposit (0.5+ SOL) goes 100% to winners</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Earn from Entry Fees</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Keep 70% of all participant entry fees</p>
                  </div>
                </li>
              </ul>

              <div className="p-3 sm:p-4 bg-primary/10 rounded-xl mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <span className="font-semibold text-sm sm:text-base">Example Earnings</span>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1 text-xs sm:text-sm">With 20 participants @ 0.1 SOL entry:</p>
                  <p className="font-bold text-green-400 text-base sm:text-lg">+1.4 SOL profit</p>
                  <p className="text-xs text-muted-foreground">(70% of 2 SOL entry fees)</p>
                </div>
              </div>

              <Link to="/staking">
                <Button variant="hero" className="w-full">
                  Start Creating
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Flow Diagram */}
      <section className="px-4 py-12 sm:py-20">
        <div className="container mx-auto">
          <h2 className="mb-4 text-2xl font-bold text-center sm:text-3xl md:text-4xl">
            How Events <span className="gradient-text">Work</span>
          </h2>
          <p className="max-w-xl mx-auto mb-8 sm:mb-12 text-center text-muted-foreground text-sm sm:text-base">
            A fair 4-phase system that ensures equal opportunity for all participants.
          </p>

          {/* Phase Timeline */}
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-yellow-500 via-purple-500 to-green-500 hidden md:block" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  {
                    phase: 1,
                    icon: Users,
                    title: "Joining",
                    duration: "24-96h",
                    description: "Pay entry fee to join. Event starts when minimum reached.",
                    color: "blue",
                    features: ["Pay entry fee", "Secure spot"],
                  },
                  {
                    phase: 2,
                    icon: EyeOff,
                    title: "Predicting",
                    duration: "2-8h",
                    description: "Submit your prediction. All predictions hidden.",
                    color: "yellow",
                    features: ["Hidden predictions", "Early bonus"],
                  },
                  {
                    phase: 3,
                    icon: Eye,
                    title: "Waiting",
                    duration: "12-72h",
                    description: "Predictions revealed! Await final price.",
                    color: "purple",
                    features: ["Revealed", "Locked"],
                  },
                  {
                    phase: 4,
                    icon: Trophy,
                    title: "Completed",
                    duration: "Instant",
                    description: "Winners determined. Top 3 share prizes!",
                    color: "green",
                    features: ["Winners", "Prizes sent"],
                  },
                ].map((step, index) => (
                  <div key={step.phase} className="relative">
                    {/* Phase Number Circle */}
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full bg-${step.color}-500/20 border-2 border-${step.color}-500/50 flex items-center justify-center relative z-10 bg-background`}>
                      <step.icon className={`w-7 h-7 sm:w-10 sm:h-10 text-${step.color}-400`} />
                    </div>
                    
                    <div className="text-center">
                      <span className={`inline-block px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-${step.color}-500/20 text-${step.color}-400 mb-1 sm:mb-2`}>
                        Phase {step.phase}
                      </span>
                      <h3 className="text-sm sm:text-lg font-bold mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2 sm:mb-3">{step.duration}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4 hidden sm:block">{step.description}</p>
                      
                      <ul className="text-xs space-y-1 hidden sm:block">
                        {step.features.map((feature, i) => (
                          <li key={i} className="flex items-center justify-center gap-1 text-muted-foreground">
                            <CheckCircle2 className={`w-3 h-3 text-${step.color}-400`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Early Bonus Info */}
          <div className="mt-10 sm:mt-16 glass-card p-4 sm:p-6 max-w-3xl mx-auto border-yellow-500/30">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">Early Prediction Bonus</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Predict early to boost your score!</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4 text-sm hidden sm:block">
              Your final score = Accuracy × Time Bonus. Predicting early shows conviction and earns multipliers!
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 sm:p-3">
                <p className="text-lg sm:text-2xl font-bold text-green-400">1.5x</p>
                <p className="text-xs text-muted-foreground">0-25%</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 sm:p-3">
                <p className="text-lg sm:text-2xl font-bold text-blue-400">1.25x</p>
                <p className="text-xs text-muted-foreground">25-50%</p>
              </div>
              <div className="bg-secondary/50 border border-border rounded-lg p-2 sm:p-3">
                <p className="text-lg sm:text-2xl font-bold">1.0x</p>
                <p className="text-xs text-muted-foreground">50-75%</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3">
                <p className="text-lg sm:text-2xl font-bold text-red-400">0.75x</p>
                <p className="text-xs text-muted-foreground">75-100%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Money Flow Section */}
      <section className="px-4 py-12 sm:py-20 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="mb-4 text-2xl font-bold text-center sm:text-3xl md:text-4xl">
            Transparent <span className="gradient-text">Money Flow</span>
          </h2>
          <p className="max-w-xl mx-auto mb-8 sm:mb-12 text-center text-muted-foreground text-sm sm:text-base">
            Know exactly where every SOL goes. No hidden fees, complete transparency.
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-4 sm:p-8">
              {/* Money Sources */}
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <PiggyBank className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm sm:text-lg">Creator Deposit</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Seed money for prizes</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Where it goes:</span>
                    <span className="font-bold text-yellow-400">100% to Winners</span>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm sm:text-lg">Entry Fees</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Paid by participants</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Creator:</span>
                      <span className="font-bold text-green-400">70%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Platform:</span>
                      <span className="font-bold text-purple-400">30%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="p-4 sm:p-6 bg-secondary/50 rounded-xl">
                <h4 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span className="hidden sm:inline">Example: 1 SOL deposit + 0.1 SOL × 20 participants</span>
                  <span className="sm:hidden">Example with 20 participants</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="p-2 sm:p-4 bg-yellow-500/10 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-yellow-400">1 SOL</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Prize Pool</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-green-500/10 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-green-400">1.4 SOL</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Creator</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-purple-500/10 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-purple-400">0.6 SOL</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SYRA Staking Section */}
      <section className="px-4 py-12 sm:py-20">
        <div className="container mx-auto">
          <h2 className="mb-4 text-2xl font-bold text-center sm:text-3xl md:text-4xl">
            Stake <span className="gradient-text">$SYRA</span> to Create Events
          </h2>
          <p className="max-w-xl mx-auto mb-8 sm:mb-12 text-center text-muted-foreground text-sm sm:text-base">
            Our staking system prevents spam and rewards committed creators with more event slots.
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {Object.entries(STAKING_TIERS).map(([key, tier]) => (
                <div 
                  key={key} 
                  className={`glass-card p-3 sm:p-4 text-center ${
                    key === 'DIAMOND' ? 'border-cyan-500/50 bg-cyan-500/5' : 
                    key === 'GOLD' ? 'border-yellow-500/30' :
                    key === 'SILVER' ? 'border-gray-400/30' :
                    key === 'BRONZE' ? 'border-orange-500/30' :
                    'border-border'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{tier.emoji}</div>
                  <h4 className={`font-bold text-sm sm:text-base ${
                    key === 'DIAMOND' ? 'text-cyan-400' :
                    key === 'GOLD' ? 'text-yellow-400' :
                    key === 'SILVER' ? 'text-gray-300' :
                    key === 'BRONZE' ? 'text-orange-400' :
                    'text-muted-foreground'
                  }`}>{tier.name}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                    {tier.minStake === 0 ? 'No stake' : formatSyraAmount(tier.minStake)}
                  </p>
                  <p className={`text-sm sm:text-lg font-bold ${tier.dailyEvents === 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {tier.dailyEvents === 0 ? 'N/A' : `${tier.dailyEvents}/day`}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/staking">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <Lock className="w-5 h-5 mr-2" />
                  Start Staking
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Active Events Preview */}
      {activeEvents.length > 0 && (
        <section className="px-4 py-12 sm:py-20 bg-secondary/30">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Live <span className="gradient-text">Events</span>
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">Join now and start predicting</p>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {activeEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {activeEvents.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No active events right now</p>
                <Link to="/create">
                  <Button variant="hero">
                    Be the First to Create One
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why SyraPredict */}
      <section className="px-4 py-12 sm:py-20">
        <div className="container mx-auto">
          <h2 className="mb-4 text-2xl font-bold text-center sm:text-3xl md:text-4xl">
            Why <span className="gradient-text">SyraPredict</span>?
          </h2>
          <p className="max-w-xl mx-auto mb-8 sm:mb-12 text-center text-muted-foreground text-sm sm:text-base">
            Built for fairness, transparency, and fun.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="glass-card p-4 sm:p-6 text-center group hover:border-primary/50 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2">Fair Competition</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Hidden predictions prevent copying. Same time window for all.
              </p>
            </div>

            <div className="glass-card p-4 sm:p-6 text-center group hover:border-primary/50 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2">Full Transparency</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Know exactly where money flows. On Solana blockchain.
              </p>
            </div>

            <div className="glass-card p-4 sm:p-6 text-center group hover:border-primary/50 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl bg-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2">Instant Rewards</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Winners receive SOL directly. No waiting required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-12 sm:py-20 bg-secondary/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="mb-8 sm:mb-12 text-2xl sm:text-3xl font-bold text-center">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {[
              {
                q: "How do I join a prediction event?",
                a: "Connect your wallet, browse events in Dashboard, click 'Join', pay the entry fee, then submit your prediction."
              },
              {
                q: "How are winners determined?",
                a: "Winners are ranked by accuracy × time bonus. Top 3 share the prize: 1st gets 50%, 2nd gets 30%, 3rd gets 20%."
              },
              {
                q: "What if minimum participants aren't reached?",
                a: "The event is cancelled and all entry fees are refunded automatically."
              },
              {
                q: "How do I create my own event?",
                a: "Stake SYRA tokens first. Then create events by depositing SOL (goes to winners). You earn 70% of entry fees."
              },
              {
                q: "What is SYRA token used for?",
                a: "SYRA is required for staking to create events. Higher stakes = more daily event slots and lower fees."
              },
              {
                q: "Are predictions really hidden?",
                a: "Yes! All predictions are hidden until the prediction phase ends and waiting phase begins."
              },
            ].map((faq, i) => (
              <div key={i} className="glass-card p-4 sm:p-6">
                <h4 className="font-bold mb-2 flex items-start gap-2 text-sm sm:text-base">
                  <span className="text-primary shrink-0">Q:</span>
                  <span>{faq.q}</span>
                </h4>
                <p className="text-muted-foreground pl-5 sm:pl-6 text-xs sm:text-sm">
                  <span className="text-green-400">A:</span> {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-12 sm:py-20">
        <div className="container mx-auto">
          <div className="relative p-6 sm:p-12 overflow-hidden text-center glass-card border-primary/30">
            <div
              className="absolute inset-0 opacity-30"
              style={{ background: "var(--gradient-hero)" }}
            />
            <div className="relative z-10">
              <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h2 className="mb-3 sm:mb-4 text-xl sm:text-3xl md:text-4xl font-bold">
                Ready to Test Your <span className="gradient-text">Prediction Skills</span>?
              </h2>
              <p className="max-w-lg mx-auto mb-6 sm:mb-8 text-muted-foreground text-sm sm:text-base">
                Join the community of crypto predictors competing for SOL rewards.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:gap-4 sm:flex-row">
                {!isConnected ? (
                  <Button variant="hero" size="lg" onClick={onOpenWalletModal} className="w-full sm:w-auto">
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Link to="/dashboard" className="w-full sm:w-auto">
                    <Button variant="hero" size="lg" className="w-full">
                      <Play className="w-5 h-5 mr-2" />
                      Start Playing
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                )}
                <Link to="/staking" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full">
                    <Lock className="w-5 h-5 mr-2" />
                    Become a Creator
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 sm:py-8 border-t border-border/50 mt-12 sm:mt-20">
        <div className="container flex flex-col items-center justify-between gap-4 mx-auto md:flex-row">
          <div className="flex items-center gap-2 transition-all duration-300 hover:scale-105">
            <img
              src="/images/logo-transparent-notext.png"
              alt="SyraPredict Logo"
              className="rounded-lg w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 hover:rotate-6"
            />
            <span className="font-semibold text-sm sm:text-base">SyraPredict</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Events</Link>
            <Link to="/staking" className="hover:text-foreground transition-colors">Staking</Link>
            <Link to="/create" className="hover:text-foreground transition-colors">Create</Link>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            © 2024 SyraPredict
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
