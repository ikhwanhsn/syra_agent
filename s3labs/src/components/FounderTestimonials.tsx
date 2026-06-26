
import SectionHeader from "@/components/landing/SectionHeader";
import StatMetric from "@/components/landing/StatMetric";
import { Quote, Star } from "lucide-react";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const FounderTestimonials = () => {

  const testimonials = [
    {
      quote: "S3 Labs helped us build an AI Agents platform with extremely fast growth. In the first month, our revenue passed $30K+ thanks to S3 Labs guidance on roadmap, distribution, and mentorship.",
      author: "Ikhwan Hsn",
      role: "AI Agents Founder",
      project: "AI Agent",
      avatar:
        "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop",
      rating: 5,
    },
    {
      quote: "Our platform started as a small audit service and grew into a professional smart-contract auditing platform. With S3 Labs support, we generated $1K+ revenue in the first week and built strong ecosystem credibility.",
      author: "Febri",
      role: "Smart Contract Auditor Founder",
      project: "Smart Contract Auditor",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      rating: 5,
    },
    {
      quote: "S3 Labs helped us build an x402 autonomous logic protocol and discover the right monetization model. In the first week, we reached $35K+ revenue and achieved over 900% MoM growth.",
      author: "Jokil",
      role: "Swarm Protocol Founder",
      project: "Swarm Protocol",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="section-shell bg-gradient-subtle">
      <div className="section-divider" />
      <div className={cn(siteShell, "relative z-10")}>
        <SectionHeader
          eyebrow={"Testimonials"}
          title={
            <>
              {"What Our"}
              <span className="text-gradient block mt-1">
                {"Founders Say"}
              </span>
            </>
          }
          description={"Hear directly from founders we've helped scale"}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="group card-premium-hover p-8 relative flex flex-col">
              <Quote className="w-8 h-8 text-primary/20 mb-4" />
              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed mb-6 flex-1 text-[15px]">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3.5 pt-5 border-t border-border/60">
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/15">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-foreground text-sm truncate">
                    {testimonial.author}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">{testimonial.role}</p>
                  <p className="text-xs text-primary font-medium truncate">{testimonial.project}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel-glass max-w-4xl mx-auto mt-16 px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/60">
            <StatMetric value="3+" label={"Projects Helped"} />
            <StatMetric value="$65K+" label={"Total Revenue"} />
            <StatMetric value="1K+" label={"Active Users"} />
            <StatMetric value="95%" label={"Success Rate"} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderTestimonials;
