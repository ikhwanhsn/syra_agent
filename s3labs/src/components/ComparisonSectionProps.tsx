import { useLanguage } from "@/contexts/LanguageContext";
import SectionHeader from "@/components/landing/SectionHeader";
import StatMetric from "@/components/landing/StatMetric";
import { X, Check, TrendingDown, TrendingUp, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComparisonSectionProps {
  onApplyClick: () => void;
}

const ComparisonSection = ({ onApplyClick }: ComparisonSectionProps) => {
  const { t } = useLanguage();

  const withoutS3Labs = [
    {
      icon: Clock,
      title: t("6-12 Bulan ke Revenue Pertama", "6-12 Months to First Revenue"),
      description: t(
        "Trial & error sendiri, pivot berkali-kali tanpa guidance",
        "Trial & error alone, multiple pivots without guidance",
      ),
    },
    {
      icon: TrendingDown,
      title: t("Burn Rate Tinggi", "High Burn Rate"),
      description: t(
        "Budget habis untuk eksperimen yang tidak efektif",
        "Budget wasted on ineffective experiments",
      ),
    },
    {
      icon: X,
      title: t("Network Terbatas", "Limited Network"),
      description: t(
        "Susah dapat akses ke investor, partners, dan early adopters",
        "Difficult to access investors, partners, and early adopters",
      ),
    },
    {
      icon: X,
      title: t("Marketing Trial & Error", "Marketing Trial & Error"),
      description: t(
        "Spend iklan tanpa tahu channel mana yang work",
        "Ad spend without knowing which channels work",
      ),
    },
    {
      icon: X,
      title: t("GTM Strategy Tidak Jelas", "Unclear GTM Strategy"),
      description: t(
        "Bingung positioning produk dan target market",
        "Confused about product positioning and target market",
      ),
    },
    {
      icon: X,
      title: t("Solo Founder Syndrome", "Solo Founder Syndrome"),
      description: t(
        "Keputusan bisnis tanpa feedback dari expert",
        "Business decisions without expert feedback",
      ),
    },
  ];

  const withS3Labs = [
    {
      icon: Zap,
      title: t("30-90 Hari ke Revenue Pertama", "30-90 Days to First Revenue"),
      description: t(
        "Framework terbukti untuk monetization dan product-market fit",
        "Proven framework for monetization and product-market fit",
      ),
    },
    {
      icon: TrendingUp,
      title: t("Efisiensi Budget 3x Lebih Baik", "3x Better Budget Efficiency"),
      description: t(
        "Focus pada channel dan strategy yang sudah validated",
        "Focus on validated channels and strategies",
      ),
    },
    {
      icon: Check,
      title: t("Akses Network Eksklusif", "Exclusive Network Access"),
      description: t(
        "Direct connection ke VCs, angels, dan 500+ founder community",
        "Direct connection to VCs, angels, and 500+ founder community",
      ),
    },
    {
      icon: Check,
      title: t("Growth Marketing Playbook", "Growth Marketing Playbook"),
      description: t(
        "Strategi marketing yang sudah terbukti work di Solana ecosystem",
        "Marketing strategies proven to work in Solana ecosystem",
      ),
    },
    {
      icon: Check,
      title: t("Clear GTM Roadmap", "Clear GTM Roadmap"),
      description: t(
        "Step-by-step guidance dari MVP ke product-market fit",
        "Step-by-step guidance from MVP to product-market fit",
      ),
    },
    {
      icon: Check,
      title: t("Weekly Mentorship", "Weekly Mentorship"),
      description: t(
        "1-on-1 session dengan expert yang sudah build & exit",
        "1-on-1 sessions with experts who have built & exited",
      ),
    },
  ];

  return (
    <section id="comparison" className="section-shell">
      <div className="section-divider" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative z-10">
        <SectionHeader
          eyebrow={t("Perbandingan", "Comparison")}
          title={
            <>
              {t("Perjalanan Founder:", "The Founder Journey:")}
              <span className="text-gradient block mt-1">
                {t("Dengan vs Tanpa S3 Labs", "With vs Without S3 Labs")}
              </span>
            </>
          }
          description={t(
            "Lihat perbedaan signifikan antara go-to-market sendiri vs dengan mentorship & network kami",
            "See the significant difference between going solo vs having our mentorship & network",
          )}
        />

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-10">
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-5 border-b border-border/60 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {t("Tanpa S3 Labs", "Without S3 Labs")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("Jalan yang lebih panjang & mahal", "Longer & costlier path")}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {withoutS3Labs.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3.5 p-4 rounded-xl bg-muted/20 border border-border/50"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-0.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-premium overflow-hidden ring-1 ring-primary/25 relative">
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                Recommended
              </span>
            </div>
            <div className="px-6 py-5 border-b border-primary/20 bg-gradient-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {t("Dengan S3 Labs", "With S3 Labs")}
                  </h3>
                  <p className="text-xs text-white/80">
                    {t("Jalur cepat ke revenue & growth", "Fast track to revenue & growth")}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {withS3Labs.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3.5 p-4 rounded-xl bg-primary/5 border border-primary/15 hover:border-primary/25 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-0.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-glass max-w-4xl mx-auto px-6 py-8 mb-12">
          <div className="grid md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/60">
            <StatMetric value="3x" label={t("Lebih Cepat ke Revenue", "Faster to Revenue")} />
            <StatMetric value="5x" label={t("ROI dari Marketing", "Marketing ROI")} />
            <StatMetric value="10x" label={t("Network & Opportunities", "Network & Opportunities")} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            {t(
              "Pilih jalan yang lebih cepat dan efisien",
              "Choose the faster and more efficient path",
            )}
          </p>
          <Button
            variant="hero"
            size="xl"
            onClick={onApplyClick}
            className="group btn-premium"
          >
            {t("Mulai Perjalanan dengan S3 Labs", "Start Your Journey with S3 Labs")}
            <TrendingUp className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
