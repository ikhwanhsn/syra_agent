
import SectionHeader from "@/components/landing/SectionHeader";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Calendar, Users } from "lucide-react";

const TELEGRAM_COMMUNITY_URL = "https://t.me/s3labs";

const CommunitySection = () => {

  const perks = [
    {
      icon: MessageCircle,
      title: "Direct Discussions",
      description: "Share ideas and ask questions with other builders in the Solana ecosystem.",
    },
    {
      icon: Calendar,
      title: "Event Updates",
      description: "Get early info on workshops, meetups, and S3Labs events.",
    },
    {
      icon: Users,
      title: "Collaboration Opportunities",
      description: "Discover relevant partners and collaboration opportunities.",
    },
  ];

  return (
    <section id="community" className="section-shell">
      <div className="section-divider" />
      <div className="absolute inset-0 grid-pattern opacity-25 pointer-events-none" />
      <div className="absolute -top-32 right-0 w-80 h-80 bg-primary/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="container relative z-10 max-w-6xl mx-auto">
        <SectionHeader
          eyebrow={"Community"}
          title={
            <>
              {"S3Labs Community"}
              <span className="text-gradient block mt-1">
                {"on Telegram"}
              </span>
            </>
          }
          description={"Join our Telegram group—where Solana developers and founders share, learn, and collaborate."}
        />

        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-12">
          {perks.map((item, index) => (
            <div key={index} className="group card-premium-hover p-6 text-center">
              <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm tracking-tight">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-lg mx-auto">
          <div className="panel-glass p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent pointer-events-none" />
            <div className="relative">
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                {"Open for developers, founders, and anyone interested in building on Solana."}
              </p>
              <Button asChild variant="hero" size="lg" className="btn-premium group">
                <a
                  href={TELEGRAM_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {"Join on Telegram"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
