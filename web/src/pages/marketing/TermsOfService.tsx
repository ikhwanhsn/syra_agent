"use client";

import { FileText } from "lucide-react";
import { LegalDocumentLayout, type LegalSection } from "@/components/legal/LegalDocumentLayout";
import { EMAIL_SUPPORT } from "@/lib/marketing/global";

const SECTIONS: LegalSection[] = [
  {
    id: "eligibility",
    title: "Eligibility and account",
    body: (
      <p>
        You must be at least 18 years old and capable of forming a binding contract to use our Services. You are responsible for keeping API keys and credentials confidential, and for all activity under your account.
      </p>
    ),
  },
  {
    id: "use-of-services",
    title: "Use of Services",
    body: (
      <p>
        You may use our Services only in compliance with these Terms and applicable laws. You may not: (a) use the Services for any illegal purpose; (b) attempt unauthorized access to our systems or other users’ data; (c) interfere with or disrupt the Services; (d) resell or sublicense the Services without our written consent; or (e) use the Services to build a competing product.
      </p>
    ),
  },
  {
    id: "api-paid-usage",
    title: "API and paid usage",
    body: (
      <p>
        Use of our API may be subject to usage limits, fees, or payment terms described in our documentation or pricing. You are responsible for charges incurred through your API key. We may modify pricing or limits with reasonable notice where practicable.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <p>
        All content, software, trademarks, and materials provided through the Services are owned by Syra AI Labs or our licensors. We grant you a limited, non-exclusive, non-transferable license to access and use the Services for their intended purpose under these Terms.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE ACCURACY, RELIABILITY, OR UNINTERRUPTED ACCESS. TRADING AND FINANCIAL DECISIONS INVOLVE RISK; NOTHING IN OUR SERVICES CONSTITUTES INVESTMENT, LEGAL, OR TAX ADVICE.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SYRA AI LABS AND ITS AFFILIATES, OFFICERS, AND EMPLOYEES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
      </p>
    ),
  },
  {
    id: "indemnification",
    title: "Indemnification",
    body: (
      <p>
        You agree to indemnify and hold harmless Syra AI Labs and its affiliates from any claims, damages, losses, or expenses (including reasonable attorneys’ fees) arising from your use of the Services or violation of these Terms.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <p>
        We may suspend or terminate your access at any time for violation of these Terms or for any other reason. You may stop using the Services at any time. Provisions that by their nature should survive — including disclaimers, limitation of liability, and indemnification — survive termination.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        We may modify these Terms from time to time. We will post the updated Terms on this page and revise the “Last updated” date. Continued use after changes constitutes acceptance. Material changes may be communicated by email or a notice on our website where required by law.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law and disputes",
    body: (
      <p>
        These Terms are governed by the laws of the jurisdiction in which Syra AI Labs operates, without regard to conflict of law principles. Any dispute shall be resolved in the courts of that jurisdiction, unless otherwise required by mandatory law.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        For questions about these Terms, contact us at{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`}>{EMAIL_SUPPORT}</a>.
      </p>
    ),
  },
];

export default function TermsOfService() {
  return (
    <LegalDocumentLayout
      icon={FileText}
      kicker="Legal · Terms"
      title="Terms of Service"
      updated="March 1, 2025"
      summary="The rules for using Syra’s website, API, agent, and related services. By using the Services, you agree to these Terms."
      currentPath="/terms"
      sections={SECTIONS}
    />
  );
}
