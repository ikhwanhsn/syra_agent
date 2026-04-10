import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { articles } from "@/data/articles";

export default function Articles() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="pt-28 pb-16">
        <section className="relative py-12 overflow-hidden">
          <div className="absolute top-1/3 right-0 w-[350px] h-[350px] bg-accent/6 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-1/3 left-0 w-[300px] h-[300px] bg-primary/6 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 mb-8 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <span className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary">
                Articles
              </span>
              <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                Insights & <span className="neon-text">Updates</span>
              </h1>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  titleAs="h2"
                  motionTransition={{ duration: 0.5, delay: index * 0.08 }}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
