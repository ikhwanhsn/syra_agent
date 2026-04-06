import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// const roadmapData = [
//   {
//     year: "2025",
//     quarters: [
//       {
//         quarter: "Q1",
//         title: "Foundation",
//         items: ["Core infrastructure deployment", "Sentiment Analysis API v1", "Beta access program"],
//         status: "completed",
//       },
//       {
//         quarter: "Q2",
//         title: "Expansion",
//         items: ["Whale Tracker launch", "Risk Scoring Engine", "Multi-chain support (10+ chains)"],
//         status: "current",
//       },
//       {
//         quarter: "Q3",
//         title: "Automation",
//         items: ["AI Execution Agent v1", "Strategy marketplace", "Mobile app beta"],
//         status: "upcoming",
//       },
//       {
//         quarter: "Q4",
//         title: "Scale",
//         items: ["Enterprise API tier", "Institutional partnerships", "$SYRA staking v2"],
//         status: "upcoming",
//       },
//     ],
//   },
//   {
//     year: "2026",
//     quarters: [
//       {
//         quarter: "Q1-Q2",
//         title: "Advanced AI",
//         items: ["GPT-powered trading assistant", "Predictive analytics suite", "Cross-chain execution"],
//         status: "upcoming",
//       },
//       {
//         quarter: "Q3-Q4",
//         title: "Ecosystem",
//         items: ["DAO governance launch", "Third-party integrations", "Global expansion"],
//         status: "upcoming",
//       },
//     ],
//   },
//   {
//     year: "2027",
//     quarters: [
//       {
//         quarter: "Full Year",
//         title: "Dominance",
//         items: ["Industry standard adoption", "Regulatory compliance suite", "Next-gen AI models"],
//         status: "upcoming",
//       },
//     ],
//   },
// ];

const roadmapData = [
  {
    year: "2025",
    quarters: [
      {
        quarter: "Q1",
        title: "Foundation",
        items: [
          "Core infrastructure deployment",
          "Team formation & partnerships",
          "Market research",
        ],
        status: "completed",
      },
      {
        quarter: "Q2",
        title: "Development",
        items: [
          "Protocol architecture design",
          "Smart contract development",
          "Security audits",
        ],
        status: "completed",
      },
      {
        quarter: "Q3",
        title: "Pre-Launch",
        items: [
          "Testnet deployment",
          "Community building",
          "Agent onboarding program",
        ],
        status: "completed",
      },
      {
        quarter: "Q4",
        title: "Launch & Integration",
        items: [
          "Sentiment Analysis & Risk Scoring APIs",
          "Whale Tracker & News Aggregator APIs",
          "x402 payment integration & directory launch",
          "Onboard first 10-20 autonomous agents",
        ],
        status: "completed",
      },
    ],
  },
  {
    year: "2026",
    quarters: [
      {
        quarter: "Q1",
        title: "Advanced Analytics",
        items: [
          "Market Regime Detection & Correlation Matrix APIs",
          "Exit Timing & Liquidation Prediction APIs",
          "$SYRA staking for API discounts",
          "Token buyback & burn program launch",
        ],
        status: "completed",
      },
      {
        quarter: "Q2",
        title: "AI & Multi-chain",
        items: [
          "Custom Model Training & Backtesting APIs",
          "Agent Reputation Scoring system",
          "Multi-chain expansion (Base, Arbitrum, Polygon)",
          "Cross-agent learning network",
        ],
        status: "current",
      },
      {
        quarter: "Q3",
        title: "Enterprise & Compliance",
        items: [
          "Compliance-aware Intelligence APIs",
          "Portfolio Optimization & Explainable AI",
          "Institutional hedge fund tier with SLAs",
          "Sports betting & prediction markets expansion",
        ],
        status: "upcoming",
      },
      {
        quarter: "Q4",
        title: "Scale & Innovation",
        items: [
          "Advanced ML models with feedback loops",
          "Traditional markets expansion (forex, commodities)",
          "x402 Intelligence Grant Program",
          "Scale to 1,000+ autonomous agents",
        ],
        status: "upcoming",
      },
    ],
  },
  {
    year: "2027",
    quarters: [
      {
        quarter: "Full Year",
        title: "Market Leadership",
        items: [
          "Industry standard adoption",
          "Global regulatory compliance suite",
          "Next-gen AI models deployment",
        ],
        status: "upcoming",
      },
    ],
  },
];

export const Roadmap = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="roadmap" className="relative py-24 overflow-hidden">
      <div className="absolute top-1/4 right-0 w-[420px] h-[420px] bg-accent/11 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[380px] h-[380px] bg-neon-gold/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-success/8 rounded-full blur-[90px] pointer-events-none" />
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-eyebrow-gradient mb-4 inline-block text-sm font-medium tracking-wider uppercase"
          >
            Roadmap
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Building the <span className="neon-text">Future</span>
          </motion.h2>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block" />

          {roadmapData.map((year, yearIndex) => (
            <motion.div
              key={year.year}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + yearIndex * 0.2 }}
              className="mb-12 last:mb-0"
            >
              <h3 className="mb-8 text-2xl font-bold text-center neon-text lg:text-left">
                {year.year}
              </h3>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {year.quarters.map((q, qIndex) => (
                  <div
                    key={q.quarter}
                    className={`glass-card relative rounded-xl border-l-4 p-4 sm:p-6 ${
                      q.status === "completed"
                        ? "border-l-success/40"
                        : q.status === "current"
                          ? "border-l-accent/50"
                          : "border-l-primary/20"
                    }`}
                  >
                    {/* Status indicator */}
                    <div className="flex items-center gap-2 mb-3">
                      {q.status === "completed" ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
                          <Check className="h-4 w-4 text-success" />
                        </div>
                      ) : q.status === "current" ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                          <Circle className="h-4 w-4 animate-pulse text-primary" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-muted-foreground">
                        {q.quarter}
                      </span>
                    </div>

                    <h4 className="mb-3 text-lg font-semibold">{q.title}</h4>

                    <ul className="space-y-2">
                      {q.items.map((item, li) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span
                            className={cn(
                              "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                              (li + qIndex) % 3 === 0
                                ? "bg-accent"
                                : (li + qIndex) % 3 === 1
                                  ? "bg-neon-gold"
                                  : "bg-success",
                            )}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {q.status === "current" && (
                      <div className="absolute right-0 top-0 rounded-bl bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground shadow-[0_0_12px_hsl(var(--accent)/0.35)]">
                        Now
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
