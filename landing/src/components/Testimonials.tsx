import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, TrendingUp } from "lucide-react";

const testimonials = [
  {
    quote: "Syra's whale tracking saved my portfolio multiple times. The alerts are incredibly accurate and timely.",
    author: "Alex Chen",
    role: "DeFi Trader",
    metric: "+340%",
    metricLabel: "ROI in 6 months",
  },
  {
    quote: "Finally, an all-in-one platform that actually delivers on its promises. The AI execution is flawless.",
    author: "Sarah Martinez",
    role: "Crypto Fund Manager",
    metric: "$12M",
    metricLabel: "AUM tracked",
  },
  {
    quote: "The sentiment analysis API powers our entire research desk. Couldn't operate without it now.",
    author: "Michael Park",
    role: "Hedge Fund Analyst",
    metric: "50+",
    metricLabel: "Daily signals",
  },
];

const partners = [
  "Chainlink",
  "Polygon",
  "Arbitrum",
  "Optimism",
  "Alchemy",
  "The Graph",
];

export const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-primary text-sm font-medium mb-4 tracking-wider uppercase"
          >
            Testimonials
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            Trusted by <span className="neon-text">Professionals</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="glass-card p-6 rounded-2xl flex flex-col"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              
              <p className="text-muted-foreground mb-6 flex-1">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="font-bold neon-text">{testimonial.metric}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{testimonial.metricLabel}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partners */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-8 uppercase tracking-wider">
            Integrated With Leading Protocols
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {partners.map((partner, index) => (
              <motion.div
                key={partner}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="text-xl font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-default"
              >
                {partner}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
