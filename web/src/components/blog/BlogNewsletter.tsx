import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className={cn(overviewCardShell, "p-6 sm:p-8")}
      aria-labelledby="blog-newsletter-heading"
    >
      <p className={overviewKickerClass}>Newsletter</p>
      <h2
        id="blog-newsletter-heading"
        className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        Intelligence in your inbox
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
        API updates, agent economy insights, and release notes — no spam, unsubscribe anytime.
      </p>

      {submitted ? (
        <p className="mt-6 text-sm font-medium text-foreground">
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl border-border/55 bg-background/60 pl-10"
              aria-label="Email address"
            />
          </div>
          <Button type="submit" className="h-11 gap-2 rounded-xl px-5">
            Subscribe
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}
    </motion.section>
  );
}
