import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { BlogAmbient } from "@/components/blog/BlogAmbient";
import { articles } from "@/data/marketing/articles";

export default function Articles() {
  return (
    <div className="blog-root relative min-h-screen overflow-x-hidden bg-background">
      <BlogAmbient />
      <Navbar />
      <main className="relative pt-28 pb-16">
        <section className="relative py-12 overflow-hidden">
          <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <Link
              to="/home"
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
