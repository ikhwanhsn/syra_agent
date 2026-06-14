import { useLanguage } from "@/contexts/LanguageContext";
import SectionHeader from "@/components/landing/SectionHeader";
import { Trophy, Rocket, Users, Target } from "lucide-react";

const WhoWeHelp = () => {
  const { t } = useLanguage();

  const criteria = [
    {
      icon: Trophy,
      title: t("Project Pemenang Hackathon", "Hackathon-Winning Projects"),
      description: t(
        "Project yang sudah terbukti di kompetisi hackathon",
        "Projects proven in hackathon competitions",
      ),
    },
    {
      icon: Rocket,
      title: t("MVP Sudah Berjalan", "MVP Live on Devnet/Mainnet"),
      description: t(
        "Produk yang sudah live di Devnet atau Mainnet",
        "Products already deployed on Devnet or Mainnet",
      ),
    },
    {
      icon: Users,
      title: t("Tim yang Solid & Berkomitmen", "Strong and Committed Team"),
      description: t(
        "Founder dan tim yang siap untuk membangun jangka panjang",
        "Founders and teams ready for long-term building",
      ),
    },
    {
      icon: Target,
      title: t("Arah Project yang Jelas", "Clear Business Direction"),
      description: t(
        "Produk Web3 dengan strategi yang tervalidasi",
        "Web3 products with validated strategy",
      ),
    },
  ];

  return (
    <section id="who-we-help" className="section-shell">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow={t("Kriteria", "Criteria")}
          title={
            <>
              {t("Untuk Developer yang", "For Developers Who Are")}
              <span className="text-gradient block mt-1">
                {t("Siap Naik Level", "Ready to Scale")}
              </span>
            </>
          }
          description={t(
            "Kami bekerja dengan project yang sudah memiliki fondasi kuat",
            "We work with projects that already have a strong foundation",
          )}
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
