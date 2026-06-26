
import SectionHeader from '@/components/landing/SectionHeader';
import { Search, CheckCircle, BarChart3, Globe } from 'lucide-react';
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const HowItWorks = () => {

  const steps = [
    {
      number: '01',
      icon: Search,
      title: 'Project Evaluation',
      description: 'We evaluate your project based on strict criteria',
    },
    {
      number: '02',
      icon: CheckCircle,
      title: 'Product & Market Validation',
      description: 'Validate product and market needs alignment',
    },
    {
      number: '03',
      icon: BarChart3,
      title: 'Revenue & Growth Strategy',
      description: 'Develop measured revenue and growth strategies',
    },
    {
      number: '04',
      icon: Globe,
      title: 'Partnerships & Expansion',
      description: 'Build partnerships and expand to broader markets',
    },
  ];

  return (
    <section id="how-it-works" className="section-shell bg-gradient-subtle">
      <div className="section-divider" />
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

      <div className={cn(siteShell, "relative z-10")}>
        <SectionHeader
          eyebrow={'Process'}
          title={'How We Work'}
          description={'A structured process to help your project grow'}
        />

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5">
            {steps.map((step, index) => (
              <div key={index} className="group card-premium-hover p-8 h-full relative">
                <div className="flex items-start justify-between mb-6">
                  <span className="text-4xl font-semibold text-primary/15 group-hover:text-primary/25 transition-colors tabular-nums tracking-tight">
                    {step.number}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                    <step.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2.5 text-foreground tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
