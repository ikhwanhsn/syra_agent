import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import HowItWorks from "@/components/HowItWorks";
import FAQSection from "@/components/FAQSection";
import { Button } from "@/components/ui/button";

const APPLY_FORM_URL = "https://forms.gle/LVLszMvQ1PZFB78X9";

const requirements = [
  "MVP live on Devnet/Mainnet, or",
  "On-going product with a solid team",
  "Committed & growth-focused founders",
  "Web3 ecosystem oriented",
];

function ApplyContent() {
  return (
    <>
      <section className="container relative z-[1] pt-28 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="eyebrow mb-3">Apply</p>
          <h1 className="heading-display">
            Join the{" "}
            <span className="text-gradient">S3 Labs program</span>
          </h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            If your team has a live MVP or hackathon win and is ready to scale on Solana, we
            want to hear from you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mt-12 panel-glass rounded-2xl border border-border/60 p-8 sm:p-10">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Project requirements
          </h2>
          <ul className="space-y-4 mb-8">
            {requirements.map((req) => (
              <li key={req} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">{req}</span>
              </li>
            ))}
          </ul>

          <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-8">
            <p className="text-sm text-muted-foreground">
              We focus on projects that are ready to execute and have a clear direction.
              Partnership terms are discussed transparently with each team.
            </p>
          </div>

          <Button
            variant="hero"
            size="xl"
            className="w-full btn-premium group"
            onClick={() => window.open(APPLY_FORM_URL, "_blank")}
          >
            Continue to submission form
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Prefer to learn more first?{" "}
            <Link to="/programs" className="text-primary hover:underline">
              View our programs
            </Link>
          </p>
        </div>
      </section>

      <HowItWorks />
      <FAQSection />
    </>
  );
}

const Apply = () => (
  <SitePageShell>
    <ApplyContent />
  </SitePageShell>
);

export default Apply;
