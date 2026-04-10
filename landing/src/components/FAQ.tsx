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
      "Syra is an AI trading intelligence layer for Solana: real-time sentiment, risk scoring, smart-money and whale flow, and on-chain news signals, exposed through the web agent and pay-per-call HTTP APIs (HTTP 402 with x402 and MPP). It aggregates and models market context so traders and builders get structured research and automation-ready data—optional execution-style tooling sits alongside that intelligence stack.",
  },
  {
    question: "Is Syra custodial? Do you hold my funds?",
    answer:
      "No. Syra is non-custodial: we do not hold your private keys or custody your assets. When you connect a wallet, you approve only what you sign—including Solana payments for x402 API calls. On-chain reads and any swaps or trades you choose go through your wallet and your explicit approvals.",
  },
  {
    question: "What chains does Syra support?",
    answer:
      "Syra currently supports only Solana. In the future, we plan to expand to Ethereum, Polygon, Arbitrum, Optimism, BSC, Avalanche, and more. We're continuously adding support for new networks based on user demand and ecosystem growth.",
  },
  {
    question: "What is the $SYRA token used for?",
    answer:
      "$SYRA is the utility and governance token: holders vote on protocol direction, feature prioritization, and treasury use. Staking unlocks premium modules, higher API limits, and exclusive signals. Stakers receive 10% of protocol revenue (distributed weekly in SOL/USDC). A portion of x402-driven fees funds buyback and burn of $SYRA.",
  },
  {
    question: "How do I get started with Syra?",
    answer:
      "Open agent.syraa.fun and connect a wallet to use the AI agent and paid tools. Try the API at playground.syraa.fun, read docs at docs.syraa.fun, and join the community on Telegram (t.me/syra_ai) or X (@syra_agent). For deeper product access, stake $SYRA where premium tiers apply.",
  },
  {
    question: "Is there an API for developers?",
    answer:
      "Yes. Syra exposes Solana x402 / MPP pay-per-request HTTP APIs (REST-style, any HTTP client): call an endpoint, complete payment when you receive 402 Payment Required, then get JSON back—no subscription wall. Higher limits and premium modules align with $SYRA staking tiers. OpenAPI and discovery live on api.syraa.fun; guides and references are at docs.syraa.fun and playground.syraa.fun.",
  },
  {
    question: "What are the fees?",
    answer:
      "API access is priced per successful paid request via x402 and MPP on Solana—you pay only for calls you make, not a flat subscription. Exact per-route pricing comes from each endpoint’s payment requirements. Staking $SYRA can improve tiers and limits; on-chain network fees still apply to your own transactions.",
  },
];

export const FAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[280px] w-[280px] rounded-full bg-neon-gold/8 blur-[90px] pointer-events-none" />
      <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8 relative">
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
          className="glass-card rounded-2xl border border-accent/15 p-6 shadow-[0_0_36px_-12px_hsl(var(--accent)/0.1)] md:p-8"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-border data-[state=open]:border-accent/10"
              >
                <AccordionTrigger className="relative z-10 py-6 text-left transition-colors hover:text-foreground">
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
