
import SectionHeader from '@/components/landing/SectionHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQSection = () => {

  const faqs = [
    {
      question: 'Is this program paid?',
      answer: 'S3 Labs does not charge registration fees. We work on a partnership model that will be discussed transparently with each project.',
    },
    {
      question: 'Does S3 Labs take equity?',
      answer: 'Our collaboration model is flexible and will be tailored to each project\'s needs. Details will be discussed during the selection process.',
    },
    {
      question: 'Is it only for Solana projects?',
      answer: 'Yes, S3 Labs focuses exclusively on the Solana ecosystem. We have deep expertise and network in this ecosystem.',
    },
    {
      question: 'Can I apply with just an idea?',
      answer: 'Currently, we focus on projects that already have an MVP or at least have won a hackathon. Projects with just ideas are not our current focus.',
    },
    {
      question: 'How long is the selection process?',
      answer: 'The selection process usually takes 2-4 weeks, depending on the project complexity and team availability.',
    },
  ];

  return (
    <section id="faq" className="section-shell">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow="FAQ"
          title={'Frequently Asked Questions'}
          description={'Answers to common questions about S3 Labs'}
        />

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="card-premium px-4 sm:px-6 border-border/70 data-[state=open]:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5 text-foreground font-medium text-[15px] tracking-tight">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
