import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Circle } from "lucide-react";

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
        status: "current",
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
        status: "upcoming",
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
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[350px] h-[350px] bg-neon-gold/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary"
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
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

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
                    className={`glass-card p-6 rounded-xl relative border-l-4 ${
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
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                      ) : q.status === "current" ? (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20">
                          <Circle className="w-4 h-4 text-primary animate-pulse" />
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
                      {q.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-1 h-1 mt-2 rounded-full bg-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {q.status === "current" && (
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-bl">
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
