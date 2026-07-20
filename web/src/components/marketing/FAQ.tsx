import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SYRA_AGENT_DESCRIPTION } from "@/lib/syraBranding";
import {
  SYRA_PLATFORM_FEE_NOTE,
  SYRA_PRICING_BANDS,
  SYRA_PRICING_DOCS_URL,
  SYRA_TOKEN_PAGE_PATH,
  SYRA_VS_DIY,
} from "@/content/syraFocus";

const vsDiySummary = SYRA_VS_DIY.map((b) => b.title).join("; ");

const faqs = [
  {
    question: "What is Syra and how does it work?",
    answer:
      `${SYRA_AGENT_DESCRIPTION} Install MCP or the SDK, fund a USDC wallet, and agents pay per successful API call via HTTP 402 — no per-vendor API keys.`,
  },
  {
    question: "Is Syra custodial? Do you hold my funds?",
    answer:
      "No. Syra is non-custodial: we do not hold your private keys or custody your assets. When you connect a wallet, you approve only what you sign—including Solana payments for x402 API calls. On-chain reads and any swaps or trades you choose go through your wallet and your explicit approvals.",
  },
  {
    question: "What chains does Syra support?",
    answer:
      "Settlement defaults to Solana USDC via x402; Base and Algorand payer rails are also supported in MCP/SDK env. Product focus is Solana-first agent payments.",
  },
  {
    question: "How is pricing set? Why not call Birdeye/Nansen myself?",
    answer:
      `You pay only for successful calls. ${SYRA_PRICING_BANDS.passthrough} ${SYRA_PRICING_BANDS.openRouter} ${SYRA_PRICING_BANDS.firstParty} ${SYRA_PLATFORM_FEE_NOTE} Vs DIY: ${vsDiySummary}. Details: ${SYRA_PRICING_DOCS_URL}`,
  },
  {
    question: "What is the $SYRA token used for?",
    answer:
      `$SYRA is optional utility/governance — mint, staking, and buyback disclosure live on syraa.fun${SYRA_TOKEN_PAGE_PATH}. Growth and day-to-day product use are pay-per-call USDC via x402, not token purchase.`,
  },
  {
    question: "What is Syra's $SPCX / SpaceX IPO feature?",
    answer:
      "Syra tracks tokenized SpaceX shares ($SPCX, SPCXx) on Solana against the Nasdaq listing — surfacing live premium/discount spreads, liquidity context, and agent bias. Ask /spcx in chat or call the x402 API from the playground. Execution via agent wallet requires explicit confirmation; this is probabilistic intelligence, not investment advice.",
  },
  {
    question: "How is Syra related to pay.sh, x402, and agent payments?",
    answer:
      "Ecosystem initiatives like pay.sh highlight how agents can discover services and pay on-chain. Syra leans into the same pattern: HTTP 402 plus x402 / MPP so an agent (or your scripts) can pay per successful API call on Solana instead of juggling subscriptions—useful when the agent needs external data or compute mid-workflow.",
  },
  {
    question: "How do I get started with Syra?",
    answer:
      "Fastest path: install MCP (`npx -y @syra-ai/mcp-server`) or `npm i @syra-ai/sdk`, set a funded USDC payer, call a tool like news. Browse routes at syraa.fun/marketplace; docs at docs.syraa.fun. Token details (optional) are at syraa.fun/token.",
  },
  {
    question: "Is there an API for developers?",
    answer:
      "Yes. Syra exposes Solana x402 / MPP pay-per-request HTTP APIs: call an endpoint, complete payment when you receive 402 Payment Required, then get JSON back—no subscription wall. OpenAPI and discovery live on api.syraa.fun; MCP/SDK guides at docs.syraa.fun.",
  },
  {
    question: "Why does api.syraa.fun ask for a key or payment, but the website works fine?",
    answer:
      "They are different surfaces. api.syraa.fun is the JSON API: non-paid routes expect an API key or Bearer token, and paid routes use x402 micropayments. syraa.fun, docs.syraa.fun, and the marketplace are normal web apps—open them in a browser without pasting keys. Syra frontends never embed API keys; the gateway injects server-side auth only for trusted origins.",
  },
  {
    question: "What are the fees?",
    answer:
      `API access is priced per successful paid request via x402 on Solana—you pay only for calls you make. Exact per-route pricing is in each endpoint’s 402 accepts[]. ${SYRA_PRICING_BANDS.passthrough} See ${SYRA_PRICING_DOCS_URL}. On-chain network fees still apply to your own transactions.`,
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
