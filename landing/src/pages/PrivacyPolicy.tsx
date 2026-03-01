import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EMAIL_SUPPORT } from "../../config/global";

export default function PrivacyPolicy() {
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
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="m-0 text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
                <p className="mt-1 text-sm text-muted-foreground">Last updated: March 1, 2025</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              Syra AI Labs (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, API, and related services (collectively, the &quot;Services&quot;).
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We may collect information that you provide directly (e.g., when you contact us, use our API with an API key, or subscribe to updates), as well as information automatically collected when you use our Services (e.g., IP address, device type, usage data, and cookies as described in our Cookie Policy).
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use the information we collect to provide, maintain, and improve our Services; to process API requests and authenticate usage; to communicate with you; to analyze usage and trends; to enforce our terms and policies; and to comply with applicable law.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">3. Sharing and Disclosure</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share your information with service providers who assist our operations (e.g., hosting, analytics), when required by law, or to protect our rights and safety. We may share aggregated or de-identified data that cannot reasonably identify you.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">4. Data Retention and Security</h2>
            <p className="text-muted-foreground">
              We retain your information only as long as necessary to fulfill the purposes described in this policy or as required by law. We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or destruction.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">5. Your Rights</h2>
            <p className="text-muted-foreground">
              Depending on your location, you may have the right to access, correct, delete, or port your personal data, or to object to or restrict certain processing. To exercise these rights or ask questions, contact us at{" "}
              <a href={`mailto:${EMAIL_SUPPORT}`} className="text-primary hover:underline">{EMAIL_SUPPORT}</a>.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">6. International Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place where required by applicable law.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">7. Children</h2>
            <p className="text-muted-foreground">
              Our Services are not directed to individuals under 16. We do not knowingly collect personal information from children under 16. If you believe we have collected such information, please contact us.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">8. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will post the updated policy on this page and update the &quot;Last updated&quot; date. Your continued use of the Services after changes constitutes acceptance of the revised policy.
            </p>

            <h2 className="mt-10 text-xl font-semibold border-b border-border/50 pb-2">9. Contact Us</h2>
            <p className="text-muted-foreground">
              For privacy-related questions or requests, contact us at{" "}
              <a href={`mailto:${EMAIL_SUPPORT}`} className="text-primary hover:underline">{EMAIL_SUPPORT}</a>.
            </p>
          </motion.article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
