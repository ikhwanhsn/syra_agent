
import SectionHeader from "@/components/landing/SectionHeader";
import {
  Network,
  Target,
  TrendingUp,
  Handshake,
  Megaphone,
  Lightbulb,
} from "lucide-react";

const BenefitsSection = () => {

  const benefits = [
    {
      icon: Network,
      title: "Ecosystem Network Access",
      description: "Connect with the extensive Solana ecosystem network",
    },
    {
      icon: Target,
      title: "Product & Market Validation",
      description: "Validate product and proper market positioning",
    },
    {
      icon: TrendingUp,
      title: "Go-to-Market Strategy",
      description: "Measured revenue and go-to-market strategy",
    },
    {
      icon: Handshake,
      title: "Partnership & Connections",
      description: "Access to project partners and strategic connections",
    },
    {
      icon: Megaphone,
      title: "Exposure & Brand",
      description: "Exposure and brand credibility reinforcement",
    },
    {
      icon: Lightbulb,
      title: "Strategic Mentoring",
      description: "Guidance from experienced mentors",
    },
  ];

  return (
    <section id="benefits" className="section-shell">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow={"Benefits"}
          title={
            <>
              {"Value & Benefits"}
              <span className="text-gradient block mt-1">
                {"for Founders"}
              </span>
            </>
          }
          description={"What developers gain from S3 Labs"}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="group card-premium-hover p-7">
              <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-foreground tracking-tight">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
