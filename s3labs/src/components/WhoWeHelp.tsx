
import SectionHeader from "@/components/landing/SectionHeader";
import { Trophy, Rocket, Users, Target } from "lucide-react";

const WhoWeHelp = () => {

  const criteria = [
    {
      icon: Trophy,
      title: "Hackathon-Winning Projects",
      description: "Projects proven in hackathon competitions",
    },
    {
      icon: Rocket,
      title: "MVP Live on Devnet/Mainnet",
      description: "Products already deployed on Devnet or Mainnet",
    },
    {
      icon: Users,
      title: "Strong and Committed Team",
      description: "Founders and teams ready for long-term building",
    },
    {
      icon: Target,
      title: "Clear Business Direction",
      description: "Web3 products with validated strategy",
    },
  ];

  return (
    <section id="who-we-help" className="section-shell">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow={"Criteria"}
          title={
            <>
              {"For Developers Who Are"}
              <span className="text-gradient block mt-1">
                {"Ready to Scale"}
              </span>
            </>
          }
          description={"We work with projects that already have a strong foundation"}
        />

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {criteria.map((item, index) => (
            <div
              key={index}
              className="group card-premium-hover p-7 lg:p-8"
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-md group-hover:shadow-glow transition-shadow">
                  <item.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-primary/80 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold mt-1 mb-2 text-foreground tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoWeHelp;
