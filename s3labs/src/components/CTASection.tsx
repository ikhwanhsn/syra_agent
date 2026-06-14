import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface CTASectionProps {
  onApplyClick: () => void;
}

const CTASection = ({ onApplyClick }: CTASectionProps) => {
  const { t } = useLanguage();

  return (
    <section className="section-shell relative overflow-hidden">
      <div className="section-divider" />
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative z-10">
        <div className="panel-glass max-w-4xl mx-auto px-8 sm:px-12 py-14 sm:py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative">
            <p className="eyebrow mb-5">{t('Mulai Sekarang', 'Get Started')}</p>
            <h2 className="heading-section text-foreground mb-5">
              {t('Siap Mengembangkan Project Anda', 'Ready to Grow Your Project')}
              <span className="text-gradient block mt-1">
                {t('di Ekosistem Solana?', 'in the Solana Ecosystem?')}
              </span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              {t(
                'Jika tim Anda siap bertumbuh dan berkomitmen, kami ingin bekerja bersama Anda.',
                'If your team is ready to grow and committed, we want to work with you.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="cta" size="xl" onClick={onApplyClick} className="group btn-premium min-w-[220px]">
                {t('Ajukan Project Sekarang', 'Apply Your Project Now')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="xl" asChild className="rounded-full min-w-[220px]">
                <a href="#contact">
                  <MessageCircle className="w-5 h-5" />
                  {t('Tanyakan Lebih Lanjut', 'Contact Us')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
