
import SectionHeader from "@/components/landing/SectionHeader";
import { ExternalLink, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectsShowcaseProps {
  onApplyClick: () => void;
}

const ProjectsShowcase = ({ onApplyClick }: ProjectsShowcaseProps) => {

  const projects = [
    {
      name: "AI Agents",
      category: "AI Agents",
      description: "AI Agents platform with $30K+ revenue in the first month",
      metrics: [
        { icon: DollarSign, label: "Revenue", value: "$30K+" },
        { icon: Users, label: "Users", value: "700+" },
        { icon: TrendingUp, label: "Growth", value: "+300%" },
      ],
      image:
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop",
    },
    {
      name: "Smart Contract Auditor",
      category: "Auditor",
      description: "Smart contract auditing platform with $1K+ revenue in the first week",
      metrics: [
        { icon: DollarSign, label: "Revenue", value: "$1K+" },
        { icon: Users, label: "Followers", value: "210+" },
        { icon: TrendingUp, label: "Growth", value: "100%" },
      ],
      image:
        "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=600&h=400&fit=crop",
    },
    {
      name: "Swarm Protocol",
      category: "Protocol",
      description: "x402 autonomous logic protocol with $35K+ revenue in the first week",
      metrics: [
        { icon: DollarSign, label: "Revenue", value: "$35K+" },
        { icon: Users, label: "Followers", value: "680+" },
        { icon: TrendingUp, label: "MoM Growth", value: "+900%" },
      ],
      image:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    },
  ];

  return (
    <section id="projects" className="section-shell">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow={"Portfolio"}
          title={
            <>
              {"Projects We"}
              <span className="text-gradient block mt-1">
                {"Have Helped"}
              </span>
            </>
          }
          description={"From hackathon winners to revenue-generating products on Solana"}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <article
              key={index}
              className="group card-premium-hover overflow-hidden flex flex-col"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full panel-glass text-xs font-semibold text-foreground">
                    {project.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold mb-2 text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed flex-1">
                  {project.description}
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {project.metrics.map((metric, i) => (
                    <div
                      key={i}
                      className="text-center p-3 rounded-xl bg-muted/30 border border-border/50"
                    >
                      <div className="text-sm font-semibold text-foreground tabular-nums">
                        {metric.value}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            {"Will your project be next?"}
          </p>
          <Button
            variant="hero"
            size="lg"
            className="group btn-premium"
            onClick={onApplyClick}
          >
            {"Apply Your Project"}
            <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProjectsShowcase;
