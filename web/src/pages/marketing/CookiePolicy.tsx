"use client";

import { Link } from "@/lib/navigation";
import { Cookie } from "lucide-react";
import { LegalDocumentLayout, type LegalSection } from "@/components/legal/LegalDocumentLayout";
import { EMAIL_SUPPORT } from "@/lib/marketing/global";

const SECTIONS: LegalSection[] = [
  {
    id: "what-are-cookies",
    title: "What are cookies?",
    body: (
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the site remember preferences, keep you signed in, and understand how you use the service. We may also use similar technologies such as local storage, session storage, or pixels where relevant.
      </p>
    ),
  },
  {
    id: "types",
    title: "Types of cookies we use",
    body: (
      <ul>
        <li>
          <strong>Strictly necessary</strong> — Required for the site to function (security, load balancing, remembering consent). These cannot be disabled if you want to use the site.
        </li>
        <li>
          <strong>Functional</strong> — Remember your choices (for example theme or language) to improve your experience.
        </li>
        <li>
          <strong>Analytics and performance</strong> — Help us understand how visitors use our site so we can improve it. We may use first-party or third-party analytics providers.
        </li>
        <li>
          <strong>Marketing (if applicable)</strong> — Used to deliver relevant ads or measure ad effectiveness, where we use such features.
        </li>
      </ul>
    ),
  },
  {
    id: "duration",
    title: "How long cookies last",
    body: (
      <p>
        <strong>Session cookies</strong> are deleted when you close your browser. <strong>Persistent cookies</strong> remain on your device for a set period (for example 30 days or 1 year) or until you delete them. Retention aligns with each cookie’s purpose and applicable law.
      </p>
    ),
  },
  {
    id: "managing",
    title: "Managing cookies",
    body: (
      <p>
        You can control cookies through your browser settings. Most browsers let you block or delete cookies; blocking all cookies may affect site functionality. Where we use optional cookies (analytics or marketing), we will seek your consent where required by law — you can withdraw consent at any time via cookie preferences or by contacting us.
      </p>
    ),
  },
  {
    id: "third-party",
    title: "Third-party cookies",
    body: (
      <p>
        Some cookies are placed by third-party services we use (for example analytics or embedded content). Those parties have their own privacy and cookie policies. We do not control their cookies; review their policies if you want to understand or limit third-party tracking.
      </p>
    ),
  },
  {
    id: "updates",
    title: "Updates",
    body: (
      <p>
        We may update this Cookie Policy to reflect changes in our practices or legal requirements. The “Last updated” date at the top will change when we do. Read this page together with our{" "}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        For questions about our use of cookies, contact us at{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`}>{EMAIL_SUPPORT}</a>.
      </p>
    ),
  },
];

export default function CookiePolicy() {
  return (
    <LegalDocumentLayout
      icon={Cookie}
      kicker="Legal · Cookies"
      title="Cookie Policy"
      updated="March 1, 2025"
      summary="How Syra uses cookies and similar technologies on our website and online services — and how you can control them."
      currentPath="/cookies"
      sections={SECTIONS}
    />
  );
}
