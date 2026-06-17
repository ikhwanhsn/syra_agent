
import SectionHeader from '@/components/landing/SectionHeader';
import { Shield, Users, LineChart } from 'lucide-react';

const WhyUsSection = () => {

  const reasons = [
    {
      icon: Shield,
      title: 'Sustainability Over Hype',
      description: 'We focus on sustainable growth, not fleeting trends',
    },
    {
      icon: Users,
      title: 'Partner, Not Just Advisor',
      description: 'We work alongside you as true partners',
    },
    {
      icon: LineChart,
      title: 'Data-Driven & Outcome-Focused',
      description: 'Data-driven approach focused on real outcomes',
    },
  ];

  return (
    <section className="section-shell bg-gradient-subtle">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow={'Why Us'}
          title={'Why S3 Labs?'}
          description={'What makes us different'}
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
