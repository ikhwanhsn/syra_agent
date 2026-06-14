import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import StatMetric from "@/components/landing/StatMetric";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onApplyClick: () => void;
}

const HeroSection = ({ onApplyClick }: HeroSectionProps) => {
  const { t } = useLanguage();

  const stats = [
    { value: "$65K+", label: "Revenue Generated" },
    { value: "3+", label: "Projects Scaled" },
    { value: "95%", label: "Success Rate" },
    { value: "500+", label: "Founder Network" },
  ];

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 grid-pattern opacity-[0.35]" />
      <div className="absolute top-[15%] left-[8%] w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-[100px] animate-float" />
      <div
        className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-accent/10 rounded-full blur-[90px] animate-float"
        style={{ animationDelay: "2.5s" }}
      />

      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full panel-glass mb-8 animate-fade-up">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-wide text-foreground/90 uppercase">
              {t("Ekosistem Solana", "Solana Ecosystem")}
            </span>
          </div>

          <h1
            className="heading-display text-foreground mb-7 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="block">S3 Labs — </span>
            <span className="text-gradient">
              {t("Mitra Pertumbuhan", "Growth Partner")}
            </span>
            <span className="block mt-1 text-foreground/95">
              {t("untuk Developer Solana", "for Solana Developers")}
            </span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            {t(
              "Kami membantu developer yang telah memenangkan hackathon atau memiliki produk MVP untuk mendapatkan revenue, mempercepat adopsi, dan berkembang di ekosistem Solana.",
              "We help developers who have won hackathons or already built an MVP to generate revenue, accelerate adoption, and scale within the Solana ecosystem.",
            )}
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button
              variant="hero"
              size="xl"
              onClick={onApplyClick}
              className="group btn-premium min-w-[220px]"
            >
              {t("Ajukan Project ke S3 Labs", "Apply Your Project to S3 Labs")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="xl" asChild className="rounded-full min-w-[220px]">
              <a href="#how-it-works">
                {t("Pelajari Program Kami", "Explore Our Programs")}
              </a>
            </Button>
          </div>

          <div
            className="panel-glass px-4 sm:px-8 py-6 sm:py-7 max-w-3xl mx-auto animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-2 divide-x-0 md:divide-x divide-border/60">
              {stats.map((stat) => (
                <StatMetric key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          </div>

          <p
            className="text-sm text-muted-foreground/80 mt-8 animate-fade-up"
            style={{ animationDelay: "0.5s" }}
          >
            {t(
              "Fokus pada project yang siap bertumbuh — bukan sekadar ide.",
              "Focused on growth-ready projects — not just ideas.",
            )}
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
