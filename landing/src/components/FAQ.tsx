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
    answer:
      "Syra is an AI-powered trading infrastructure layer that provides real-time market intelligence, sentiment analysis, whale tracking, and automated execution. Our platform aggregates data from multiple sources, processes it through advanced ML models, and delivers actionable insights and automated trading capabilities.",
  },
  {
    question: "Is Syra custodial? Do you hold my funds?",
    answer:
      "No, Syra is 100% non-custodial. We never have access to your private keys or funds. All trades are executed through your connected wallet, and you maintain full control at all times. We only read blockchain data and execute transactions you approve.",
  },
  {
    question: "What chains does Syra support?",
    answer:
      "Syra currently supports only Solana. In the future, we plan to expand to Ethereum, Polygon, Arbitrum, Optimism, BSC, Avalanche, and more. We're continuously adding support for new networks based on user demand and ecosystem growth.",
  },
  {
    question: "What is the $SYRA token used for?",
    answer:
      "$SYRA provides governance rights, premium feature access, reduced fees, and staking rewards. Token holders can vote on protocol upgrades, access exclusive modules, and earn a share of protocol revenue. A portion of transaction fees are used for buyback and burn.",
  },
  {
    question: "How do I get started with Syra?",
    answer:
      "Simply connect your wallet to launch the app. You'll get immediate access to basic features. For premium modules like the AI Execution Agent, you'll need to stake $SYRA tokens. Our onboarding flow guides you through setting up your first strategies.",
  },
  {
    question: "Is there an API for developers?",
    answer:
      "Yes, Syra offers a comprehensive REST and WebSocket API for developers. Use x402 protocol for payment fee. Premium API access with higher limits and additional endpoints is available for $SYRA stakers. Full documentation is available at docs.syraa.fun",
  },
  {
    question: "What are the fees?",
    answer:
      "x402 protocol lets you pay for API requests with only pay per request. No hidden fees or upfront costs. You only pay for the requests you make. This makes it a cost-effective solution for developers who want to integrate Syra's powerful features into their applications.",
  },
];

export const FAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary"
          >
            FAQ
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Frequently Asked <span className="neon-text">Questions</span>
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="p-6 glass-card md:p-8 rounded-2xl"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-border"
              >
                <AccordionTrigger className="relative z-10 py-6 text-left transition-colors hover:text-primary">
                  <span className="text-base font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-muted-foreground">
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
