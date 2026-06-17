import { Link } from "react-router-dom";
import { Quote } from "lucide-react";

import { Button } from "@/components/ui/button";

const featuredQuote = {
  quote:
    "S3 Labs helped us build an x402 autonomous logic protocol and discover the right monetization model. In the first week, we reached $35K+ revenue and achieved over 900% MoM growth.",
  author: "Jokil",
  role: "Swarm Protocol Founder",
};

const FounderQuoteStrip = () => (
  <section className="section-shell">
    <div className="section-divider" />
    <div className="container relative z-10">
      <div className="panel-glass max-w-4xl mx-auto px-8 sm:px-12 py-10 sm:py-12">
        <Quote className="w-8 h-8 text-primary/25 mb-4" />
        <blockquote className="text-lg sm:text-xl text-foreground/90 leading-relaxed mb-6">
          &ldquo;{featuredQuote.quote}&rdquo;
        </blockquote>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">{featuredQuote.author}</p>
            <p className="text-sm text-muted-foreground">{featuredQuote.role}</p>
          </div>
          <Button variant="heroOutline" size="sm" className="rounded-full w-fit" asChild>
            <Link to="/portfolio">More founder stories</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default FounderQuoteStrip;
