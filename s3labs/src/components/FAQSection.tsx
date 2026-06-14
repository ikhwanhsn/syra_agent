import { useLanguage } from '@/contexts/LanguageContext';
import SectionHeader from '@/components/landing/SectionHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQSection = () => {
  const { t } = useLanguage();

  const faqs = [
    {
      question: t('Apakah program ini berbayar?', 'Is this program paid?'),
      answer: t(
        'Program S3 Labs tidak memungut biaya pendaftaran. Kami bekerja berdasarkan model partnership yang akan didiskusikan secara transparan dengan setiap project.',
        'S3 Labs does not charge registration fees. We work on a partnership model that will be discussed transparently with each project.'
      ),
    },
    {
      question: t('Apakah S3 Labs mengambil equity?', 'Does S3 Labs take equity?'),
      answer: t(
        'Model kerja sama kami fleksibel dan akan disesuaikan dengan kebutuhan masing-masing project. Detailnya akan didiskusikan dalam proses seleksi.',
        'Our collaboration model is flexible and will be tailored to each project\'s needs. Details will be discussed during the selection process.'
      ),
    },
    {
      question: t('Apakah hanya untuk project Solana?', 'Is it only for Solana projects?'),
      answer: t(
        'Ya, S3 Labs fokus secara eksklusif pada ekosistem Solana. Kami memiliki keahlian dan jaringan yang mendalam di ekosistem ini.',
        'Yes, S3 Labs focuses exclusively on the Solana ecosystem. We have deep expertise and network in this ecosystem.'
      ),
    },
    {
      question: t('Apakah ide saja bisa mendaftar?', 'Can I apply with just an idea?'),
      answer: t(
        'Saat ini kami fokus pada project yang sudah memiliki MVP atau setidaknya pernah memenangkan hackathon. Project dengan ide saja belum menjadi fokus kami.',
        'Currently, we focus on projects that already have an MVP or at least have won a hackathon. Projects with just ideas are not our current focus.'
      ),
    },
    {
      question: t('Berapa lama proses seleksi?', 'How long is the selection process?'),
      answer: t(
        'Proses seleksi biasanya memakan waktu 2-4 minggu, tergantung pada kompleksitas project dan ketersediaan tim.',
        'The selection process usually takes 2-4 weeks, depending on the project complexity and team availability.'
      ),
    },
  ];

  return (
    <section id="faq" className="section-shell">
      <div className="section-divider" />
      <div className="container relative z-10">
        <SectionHeader
          eyebrow="FAQ"
          title={t('Pertanyaan yang Sering Diajukan', 'Frequently Asked Questions')}
          description={t(
            'Jawaban untuk pertanyaan umum tentang S3 Labs',
            'Answers to common questions about S3 Labs'
          )}
        />

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="card-premium px-6 border-border/70 data-[state=open]:border-primary/30 transition-colors"
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
