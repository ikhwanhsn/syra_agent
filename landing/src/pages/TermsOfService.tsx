import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EMAIL_SUPPORT } from "../../config/global";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="relative z-10 pt-28 pb-16">
        <div className="absolute inset-0 opacity-50 grid-pattern pointer-events-none" />
        <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-8 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="prose prose-invert prose-neutral max-w-none"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="m-0 text-3xl font-bold sm:text-4xl">Terms of Service</h1>
                <p className="mt-1 text-sm text-muted-foreground">Last updated: March 1, 2025</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              Welcome to Syra AI Labs. By accessing or using our website, API, agent, or related services (the &quot;Services&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use our Services.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">1. Eligibility and Account</h2>
            <p className="text-muted-foreground">
              You must be at least 18 years old and capable of forming a binding contract to use our Services. You are responsible for maintaining the confidentiality of any API keys or credentials and for all activity under your account.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">2. Use of Services</h2>
            <p className="text-muted-foreground">
              You may use our Services only in compliance with these Terms and applicable laws. You may not: (a) use the Services for any illegal purpose or in violation of any laws; (b) attempt to gain unauthorized access to our systems or other users&apos; data; (c) interfere with or disrupt the Services; (d) resell or sublicense the Services without our written consent; or (e) use the Services to build a competing product.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">3. API and Paid Usage</h2>
            <p className="text-muted-foreground">
              Use of our API may be subject to usage limits, fees, or payment terms as described in our documentation or pricing. You are responsible for all charges incurred through your API key. We may modify pricing or limits with reasonable notice where practicable.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, software, trademarks, and materials provided through the Services are owned by Syra AI Labs or our licensors. We grant you a limited, non-exclusive, non-transferable license to access and use the Services for their intended purpose in accordance with these Terms.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">5. Disclaimers</h2>
            <p className="text-muted-foreground">
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE ACCURACY, RELIABILITY, OR UNINTERRUPTED ACCESS. TRADING AND FINANCIAL DECISIONS INVOLVE RISK; NOTHING IN OUR SERVICES CONSTITUTES INVESTMENT, LEGAL, OR TAX ADVICE.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SYRA AI LABS AND ITS AFFILIATES, OFFICERS, AND EMPLOYEES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">7. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless Syra AI Labs and its affiliates from any claims, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising from your use of the Services or violation of these Terms.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">8. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your access to the Services at any time for violation of these Terms or for any other reason. You may stop using the Services at any time. Provisions that by their nature should survive (e.g., disclaimers, limitation of liability, indemnification) will survive termination.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">9. Changes</h2>
            <p className="text-muted-foreground">
              We may modify these Terms from time to time. We will post the updated Terms on this page and update the &quot;Last updated&quot; date. Continued use of the Services after changes constitutes acceptance. Material changes may be communicated via email or a notice on our website where required by law.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">10. Governing Law and Disputes</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of the jurisdiction in which Syra AI Labs operates, without regard to conflict of law principles. Any dispute shall be resolved in the courts of that jurisdiction, unless otherwise required by mandatory law.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">11. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at{" "}
              <a href={`mailto:${EMAIL_SUPPORT}`} className="text-primary hover:underline">{EMAIL_SUPPORT}</a>.
            </p>
          </motion.article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
