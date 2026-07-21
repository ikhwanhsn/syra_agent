"use client";

import { Link } from "@/lib/navigation";
import { Shield } from "lucide-react";
import { LegalDocumentLayout, type LegalSection } from "@/components/legal/LegalDocumentLayout";
import { EMAIL_SUPPORT } from "@/lib/marketing/global";

const SECTIONS: LegalSection[] = [
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p>
          We may collect information you provide directly — for example when you contact us, use our API with an API key, or subscribe to updates — as well as information collected automatically when you use the Services, such as IP address, device type, usage data, and cookies as described in our{" "}
          <Link to="/cookies">Cookie Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your information",
    body: (
      <p>
        We use the information we collect to provide, maintain, and improve the Services; process API requests and authenticate usage; communicate with you; analyze usage and trends; enforce our terms and policies; and comply with applicable law.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Sharing and disclosure",
    body: (
      <p>
        We do not sell your personal information. We may share information with service providers who assist our operations (for example hosting or analytics), when required by law, or to protect our rights and safety. We may share aggregated or de-identified data that cannot reasonably identify you.
      </p>
    ),
  },
  {
    id: "retention-security",
    title: "Data retention and security",
    body: (
      <p>
        We retain information only as long as needed for the purposes in this policy or as required by law. We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or destruction.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <p>
        Depending on your location, you may have the right to access, correct, delete, or port your personal data, or to object to or restrict certain processing. To exercise these rights or ask questions, contact us at{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`}>{EMAIL_SUPPORT}</a>.
      </p>
    ),
  },
  {
    id: "international",
    title: "International transfers",
    body: (
      <p>
        Your information may be transferred to and processed in countries other than your own. Where required by law, we ensure appropriate safeguards are in place.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Our Services are not directed to individuals under 16. We do not knowingly collect personal information from children under 16. If you believe we have collected such information, please contact us.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. We will post the updated policy on this page and revise the “Last updated” date. Continued use of the Services after changes constitutes acceptance of the revised policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        For privacy-related questions or requests, contact us at{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`}>{EMAIL_SUPPORT}</a>.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalDocumentLayout
      icon={Shield}
      kicker="Legal · Privacy"
      title="Privacy Policy"
      updated="March 1, 2025"
      summary="How Syra AI Labs collects, uses, and protects information when you use our website, API, and related services."
      currentPath="/privacy"
      sections={SECTIONS}
    />
  );
}
