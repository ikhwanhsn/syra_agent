import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BlogNewsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="blog-newsletter relative my-16 sm:my-20"
      aria-labelledby="blog-newsletter-heading"
    >
      <div className="blog-newsletter-panel relative overflow-hidden rounded-3xl p-8 sm:p-12">
        <div className="blog-newsletter-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="blog-newsletter-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        <div className="relative mx-auto max-w-xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Newsletter
          </div>

          <h2
            id="blog-newsletter-heading"
            className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Intelligence in your inbox
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            API updates, agent economy insights, and release notes — no spam, unsubscribe anytime.
          </p>

          {submitted ? (
            <p className="mt-8 text-sm font-medium text-foreground">
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
            >
              <div className="relative flex-1 sm:max-w-sm">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="blog-newsletter-input h-12 rounded-xl border-border/60 bg-background/60 pl-10 backdrop-blur-sm"
                  aria-label="Email address"
                />
              </div>
              <Button type="submit" className="blog-newsletter-btn h-12 gap-2 rounded-xl px-6">
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </motion.section>
  );
}
