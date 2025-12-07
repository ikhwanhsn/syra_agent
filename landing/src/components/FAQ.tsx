import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Syra and how does it work?",
    answer: "Syra is an AI-powered trading infrastructure layer that provides real-time market intelligence, sentiment analysis, whale tracking, and automated execution. Our platform aggregates data from multiple sources, processes it through advanced ML models, and delivers actionable insights and automated trading capabilities.",
  },
  {
    question: "Is Syra custodial? Do you hold my funds?",
    answer: "No, Syra is 100% non-custodial. We never have access to your private keys or funds. All trades are executed through your connected wallet, and you maintain full control at all times. We only read blockchain data and execute transactions you approve.",
  },
  {
    question: "What chains does Syra support?",
    answer: "Syra currently supports 20+ chains including Ethereum, Polygon, Arbitrum, Optimism, BSC, Solana, Avalanche, and more. We're continuously adding support for new networks based on user demand and ecosystem growth.",
  },
  {
    question: "How accurate is the AI sentiment analysis?",
    answer: "Our AI models achieve 94%+ accuracy on sentiment classification and 87%+ on price direction prediction. Models are trained on billions of data points and continuously improved with new market data. Historical backtests show consistent alpha generation across market conditions.",
  },
  {
    question: "What is the $SYRA token used for?",
    answer: "$SYRA provides governance rights, premium feature access, reduced fees, and staking rewards. Token holders can vote on protocol upgrades, access exclusive modules, and earn a share of protocol revenue. A portion of transaction fees are used for buyback and burn.",
  },
  {
    question: "How do I get started with Syra?",
    answer: "Simply connect your wallet to launch the app. You'll get immediate access to basic features. For premium modules like the AI Execution Agent, you'll need to stake $SYRA tokens. Our onboarding flow guides you through setting up your first strategies.",
  },
  {
    question: "Is there an API for developers?",
    answer: "Yes, Syra offers a comprehensive REST and WebSocket API for developers. Free tier includes 1000 requests/day. Premium API access with higher limits and additional endpoints is available for $SYRA stakers. Full documentation is available at docs.syra.io.",
  },
  {
    question: "What are the fees?",
    answer: "Basic analytics and alerts are free. Automated execution has a 0.1% fee per trade (compared to 0.3-0.5% industry average). $SYRA stakers receive up to 50% fee discounts based on their tier. Enterprise custom pricing is available for high-volume traders.",
  },
];

export const FAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-primary text-sm font-medium mb-4 tracking-wider uppercase"
          >
            FAQ
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            Frequently Asked <span className="neon-text">Questions</span>
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card p-6 md:p-8 rounded-2xl"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-border"
              >
                <AccordionTrigger className="text-left hover:text-primary transition-colors py-6">
                  <span className="text-base font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
