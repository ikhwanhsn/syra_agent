import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Circle } from "lucide-react";

const roadmapData = [
  {
    year: "2025",
    quarters: [
      {
        quarter: "Q1",
        title: "Foundation",
        items: ["Core infrastructure deployment", "Sentiment Analysis API v1", "Beta access program"],
        status: "completed",
      },
      {
        quarter: "Q2",
        title: "Expansion",
        items: ["Whale Tracker launch", "Risk Scoring Engine", "Multi-chain support (10+ chains)"],
        status: "current",
      },
      {
        quarter: "Q3",
        title: "Automation",
        items: ["AI Execution Agent v1", "Strategy marketplace", "Mobile app beta"],
        status: "upcoming",
      },
      {
        quarter: "Q4",
        title: "Scale",
        items: ["Enterprise API tier", "Institutional partnerships", "$SYRA staking v2"],
        status: "upcoming",
      },
    ],
  },
  {
    year: "2026",
    quarters: [
      {
        quarter: "Q1-Q2",
        title: "Advanced AI",
        items: ["GPT-powered trading assistant", "Predictive analytics suite", "Cross-chain execution"],
        status: "upcoming",
      },
      {
        quarter: "Q3-Q4",
        title: "Ecosystem",
        items: ["DAO governance launch", "Third-party integrations", "Global expansion"],
        status: "upcoming",
      },
    ],
  },
  {
    year: "2027",
    quarters: [
      {
        quarter: "Full Year",
        title: "Dominance",
        items: ["Industry standard adoption", "Regulatory compliance suite", "Next-gen AI models"],
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-primary text-sm font-medium mb-4 tracking-wider uppercase"
          >
            Roadmap
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
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
              <h3 className="text-2xl font-bold neon-text mb-8 text-center lg:text-left">
                {year.year}
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {year.quarters.map((q, qIndex) => (
                  <div
                    key={q.quarter}
                    className={`glass-card p-6 rounded-xl relative ${
                      q.status === "current" ? "border-primary/50" : ""
                    }`}
                  >
                    {/* Status indicator */}
                    <div className="flex items-center gap-2 mb-3">
                      {q.status === "completed" ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                      ) : q.status === "current" ? (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <Circle className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-muted-foreground">
                        {q.quarter}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-semibold mb-3">{q.title}</h4>
                    
                    <ul className="space-y-2">
                      {q.items.map((item) => (
                        <li
                          key={item}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {q.status === "current" && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded">
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
