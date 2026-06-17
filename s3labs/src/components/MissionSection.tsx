
import SectionHeader from '@/components/landing/SectionHeader';
import { Crosshair, Eye, Compass } from 'lucide-react';

const MissionSection = () => {

  const items = [
    {
      icon: Crosshair,
      label: 'Purpose',
      content: 'S3 Labs helps projects generate real revenue within the Solana ecosystem.',
    },
    {
      icon: Eye,
      label: 'Vision',
      content: 'To become the primary growth partner for Solana projects.',
    },
    {
      icon: Compass,
      label: 'Mission',
      content: 'Empowering projects and the Solana ecosystem through collaboration, validation, and growth acceleration.',
    },
  ];

  return (
    <section id="mission" className="section-shell bg-gradient-subtle">
      <div className="section-divider" />
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="container relative z-10">
        <SectionHeader
          eyebrow={'Vision & Mission'}
          title={'Our Purpose & Mission'}
          description={'Our commitment to the Solana ecosystem'}
        />

        <div className="grid lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {items.map((item, index) => (
            <div key={index} className="group card-premium-hover p-8 h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow">
                <item.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="eyebrow mb-4 text-[10px]">{item.label}</span>
              <p className="text-foreground text-base leading-relaxed flex-1">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
