import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, ExternalLink, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { articles } from "@/data/articles";

export const ArticlesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="articles" className="relative py-24 overflow-hidden">
      <div className="absolute top-1/3 right-0 w-[350px] h-[350px] bg-accent/6 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[300px] h-[300px] bg-primary/6 rounded-full blur-[80px] pointer-events-none" />
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-eyebrow-gradient mb-4 inline-block text-sm font-medium tracking-wider uppercase"
          >
            Articles
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Insights & <span className="neon-text">Updates</span>
          </motion.h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => {
            const hoverRing = [
              "hover:border-accent/40 hover:shadow-[0_0_32px_-10px_hsl(var(--accent)/0.2)]",
              "hover:border-neon-gold/40 hover:shadow-[0_0_32px_-10px_hsl(var(--neon-gold)/0.18)]",
              "hover:border-success/40 hover:shadow-[0_0_32px_-10px_hsl(var(--success)/0.18)]",
            ];
            return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={cn(
                "group glass-card overflow-hidden rounded-2xl transition-all duration-300",
                article.comingSoon
                  ? "cursor-default opacity-80"
                  : cn("cursor-pointer border border-transparent", hoverRing[index % hoverRing.length]),
              )}
            >
              {article.comingSoon ? (
                <div className="flex flex-col h-full p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{article.title}</h3>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 shrink-0" />
                    Coming soon
                  </p>
                </div>
              ) : (
                <a
                  href={article.href}
                  target={article.external ? "_blank" : undefined}
                  rel={article.external ? "noopener noreferrer" : undefined}
                  className="flex flex-col h-full p-6"
                >
                  <div
                    className={cn(
                      "mb-4 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors",
                      index % 3 === 0 && "border-accent/25 bg-accent/10 group-hover:bg-accent/20",
                      index % 3 === 1 && "border-neon-gold/25 bg-neon-gold/10 group-hover:bg-neon-gold/20",
                      index % 3 === 2 && "border-success/25 bg-success/10 group-hover:bg-success/20",
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-6 w-6",
                        index % 3 === 0 && "text-primary",
                        index % 3 === 1 && "text-neon-gold",
                        index % 3 === 2 && "text-success",
                      )}
                    />
                  </div>
                  <h3
                    className={cn(
                      "mb-2 text-lg font-semibold transition-colors",
                      index % 3 === 0 && "group-hover:text-primary",
                      index % 3 === 1 && "group-hover:text-neon-gold",
                      index % 3 === 2 && "group-hover:text-success",
                    )}
                  >
                    {article.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground flex-1">
                    {article.description}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 text-sm font-medium",
                      index % 3 === 0 && "text-primary",
                      index % 3 === 1 && "text-neon-gold",
                      index % 3 === 2 && "text-success",
                    )}
                  >
                    Read more
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </a>
              )}
            </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg" asChild className="gap-2 border-accent/30 hover:border-accent/50 hover:bg-accent/5">
            <Link to="/articles">
              See all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
