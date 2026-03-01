import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Cookie } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EMAIL_SUPPORT } from "../../config/global";

export default function CookiePolicy() {
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
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="m-0 text-3xl font-bold sm:text-4xl">Cookie Policy</h1>
                <p className="mt-1 text-sm text-muted-foreground">Last updated: March 1, 2025</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              This Cookie Policy explains how Syra AI Labs (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and similar technologies when you visit our website or use our online services. This policy should be read together with our Privacy Policy.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">1. What Are Cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you signed in, and understand how you use the service. We may also use similar technologies such as local storage, session storage, or pixels where relevant.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">2. Types of Cookies We Use</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Strictly necessary:</strong> Required for the website to function (e.g., security, load balancing, remembering consent). These cannot be disabled if you want to use the site.</li>
              <li><strong className="text-foreground">Functional:</strong> Remember your choices (e.g., theme, language) to improve your experience.</li>
              <li><strong className="text-foreground">Analytics and performance:</strong> Help us understand how visitors use our site (e.g., pages viewed, traffic sources) so we can improve it. We may use first-party or third-party analytics providers.</li>
              <li><strong className="text-foreground">Marketing (if applicable):</strong> Used to deliver relevant ads or measure ad effectiveness, where we use such features.</li>
            </ul>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">3. How Long Cookies Last</h2>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Session cookies</strong> are deleted when you close your browser. <strong className="text-foreground">Persistent cookies</strong> remain on your device for a set period (e.g., 30 days, 1 year) or until you delete them. We set retention periods in line with the purpose of each cookie and applicable law.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">4. Managing Cookies</h2>
            <p className="text-muted-foreground">
              You can control cookies through your browser settings. Most browsers let you block or delete cookies; note that blocking all cookies may affect site functionality. Where we use optional cookies (e.g., analytics or marketing), we will seek your consent where required by law—you can withdraw consent at any time via our cookie preferences or by contacting us.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">5. Third-Party Cookies</h2>
            <p className="text-muted-foreground">
              Some cookies are placed by third-party services we use (e.g., analytics, embedding content). These parties have their own privacy and cookie policies. We do not control their cookies; we recommend reviewing their policies if you want to understand or limit third-party tracking.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">6. Updates</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time to reflect changes in our practices or legal requirements. The &quot;Last updated&quot; date at the top will be revised when we do. We encourage you to review this page periodically.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">7. Contact</h2>
            <p className="text-muted-foreground">
              For questions about our use of cookies, contact us at{" "}
              <a href={`mailto:${EMAIL_SUPPORT}`} className="text-primary hover:underline">{EMAIL_SUPPORT}</a>.
            </p>
          </motion.article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
