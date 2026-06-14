import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Network,
      title: t("Akses Network Ekosistem", "Ecosystem Network Access"),
      description: t(
        "Terhubung dengan jaringan luas di ekosistem Solana",
        "Connect with the extensive Solana ecosystem network",
      ),
    },
    {
      icon: Target,
      title: t("Validasi Produk & Market", "Product & Market Validation"),
      description: t(
        "Validasi produk dan positioning market yang tepat",
        "Validate product and proper market positioning",
      ),
    },
    {
      icon: TrendingUp,
      title: t("Strategi Go-to-Market", "Go-to-Market Strategy"),
      description: t(
        "Strategi revenue dan go-to-market yang terukur",
        "Measured revenue and go-to-market strategy",
      ),
    },
    {
      icon: Handshake,
      title: t("Partnership & Koneksi", "Partnership & Connections"),
      description: t(
        "Akses ke partner project dan koneksi strategis",
        "Access to project partners and strategic connections",
      ),
    },
    {
      icon: Megaphone,
      title: t("Exposure & Brand", "Exposure & Brand"),
      description: t(
        "Exposure dan penguatan kredibilitas brand",
        "Exposure and brand credibility reinforcement",
      ),
    },
    {
      icon: Lightbulb,
      title: t("Mentoring Strategis", "Strategic Mentoring"),
      description: t(
        "Bimbingan dan guidance dari mentor berpengalaman",
        "Guidance from experienced mentors",
      ),
    },
  ];

  return (
    <section id="benefits" className="section-shell">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow={t("Manfaat", "Benefits")}
          title={
            <>
              {t("Nilai & Manfaat", "Value & Benefits")}
              <span className="text-gradient block mt-1">
                {t("untuk Founder", "for Founders")}
              </span>
            </>
          }
          description={t(
            "Apa yang didapatkan developer dari S3 Labs",
            "What developers gain from S3 Labs",
          )}
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
