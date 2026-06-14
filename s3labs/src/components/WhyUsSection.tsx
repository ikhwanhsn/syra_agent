import { useLanguage } from '@/contexts/LanguageContext';
import SectionHeader from '@/components/landing/SectionHeader';
import { Shield, Users, LineChart } from 'lucide-react';

const WhyUsSection = () => {
  const { t } = useLanguage();

  const reasons = [
    {
      icon: Shield,
      title: t('Keberlanjutan, Bukan Hype', 'Sustainability Over Hype'),
      description: t(
        'Kami fokus pada pertumbuhan yang berkelanjutan, bukan tren sesaat',
        'We focus on sustainable growth, not fleeting trends'
      ),
    },
    {
      icon: Users,
      title: t('Partner, Bukan Advisor', 'Partner, Not Just Advisor'),
      description: t(
        'Kami bekerja bersama Anda sebagai partner sejati',
        'We work alongside you as true partners'
      ),
    },
    {
      icon: LineChart,
      title: t('Data-Driven & Outcome', 'Data-Driven & Outcome-Focused'),
      description: t(
        'Pendekatan berbasis data dengan fokus pada hasil nyata',
        'Data-driven approach focused on real outcomes'
      ),
    },
  ];

  return (
    <section className="section-shell bg-gradient-subtle">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow={t('Keunggulan', 'Why Us')}
          title={t('Mengapa S3 Labs?', 'Why S3 Labs?')}
          description={t(
            'Apa yang membuat kami berbeda',
            'What makes us different'
          )}
        />

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {reasons.map((reason, index) => (
            <div key={index} className="text-center group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-5 group-hover:shadow-glow transition-shadow">
                <reason.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-foreground tracking-tight">
                {reason.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
