import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, ExternalLink, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary"
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
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`rounded-2xl transition-all duration-300 glass-card overflow-hidden group ${
                article.comingSoon
                  ? "opacity-80 cursor-default"
                  : "hover:border-accent/25 cursor-pointer"
              }`}
            >
              {article.comingSoon ? (
                <div className="flex flex-col h-full p-6">
                  <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-muted/50">
                    <FileText className="w-6 h-6 text-muted-foreground" />
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
                  <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold group-hover:text-accent transition-colors">
                    {article.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground flex-1">
                    {article.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
                    Read more
                    <ExternalLink className="w-4 h-4" />
                  </span>
                </a>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg" asChild className="gap-2">
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
