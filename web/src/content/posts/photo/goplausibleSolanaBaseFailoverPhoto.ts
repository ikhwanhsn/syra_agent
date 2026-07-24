import { GOPLAUSIBLE_SOLANA_BASE_FAILOVER_POST } from "../goplausibleSolanaBaseFailoverUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO_SHARE_COPIES } from "./shareCopies/goplausibleSolanaBaseFailoverShareCopies";

const copies = GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO_SHARE_COPIES;

/** Photo-format content for GoPlausible Solana/Base Labs failover. */
export const GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO = definePhotoUpdate(
  GOPLAUSIBLE_SOLANA_BASE_FAILOVER_POST.meta,
  [
    {
      role: "cover",
      layout: "photo-cover-type-hero",
      shareCopy: copies.cover,
      content: photoContent({
        eyebrow: "Ship log",
        badge: "Failover · Solana · Base",
        title: "GoPlausible × Syra",
        subtitle:
          "Labs x402 fails over Dexter → GoPlausible → PayAI. Algorand still settles on AVM.",
      }),
    },
    {
      role: "thesis",
      layout: "photo-statement-gold-frame",
      shareCopy: copies.thesis,
      content: photoContent({
        kicker: "The gap",
        headline: "One dry fee payer should not kill Labs.",
        body: "Exact SVM needs a funded sponsor. When Dexter is underfunded, GoPlausible now takes Solana and Base before PayAI.",
      }),
    },
    {
      role: "quote",
      layout: "photo-quote-centered",
      shareCopy: copies.quote,
      content: photoContent({
        quote: "Healthy first. Then the next rail.",
        narrative: "Dexter → GoPlausible → PayAI. Same merchant payTo. Zero client changes.",
      }),
    },
    {
      role: "flow",
      layout: "photo-flow-arrow-chain",
      shareCopy: copies.flow,
      content: photoContent({
        kicker: "Failover",
        headline: "Probe. Offer. Fall through.",
        steps: [
          { step: "01", title: "Probe Dexter", description: "Fee payer or Base /supported." },
          { step: "02", title: "Offer Dexter", description: "Primary when healthy." },
          { step: "03", title: "GoPlausible", description: "Solana + Base mid-rail." },
          { step: "04", title: "PayAI", description: "Last resort checkout." },
        ],
      }),
    },
    {
      role: "timeline",
      layout: "photo-flow-zigzag",
      shareCopy: copies.timeline,
      content: photoContent({
        kicker: "Shipped",
        headline: "From Algorand-only to multi-rail.",
        steps: [
          { step: "01", title: "AVM", description: "Algorand via GoPlausible (existing)." },
          { step: "02", title: "Networks", description: "Solana + Base profile." },
          { step: "03", title: "Health", description: "Fee payer + /supported caches." },
          { step: "04", title: "Labs chain", description: "Dexter → GP → PayAI." },
        ],
      }),
    },
    {
      role: "pillars",
      layout: "photo-cards-bento",
      shareCopy: copies.pillars,
      content: photoContent({
        headline: "What stays up when Dexter dips.",
        cards: [
          {
            title: "Solana",
            subtitle: "Exact SVM",
            detail: "GoPlausible fee payer sponsors gas.",
            accent: "gold",
          },
          {
            title: "Base",
            subtitle: "eip155:8453",
            detail: "Exact USDC when Base drops on Dexter.",
            accent: "gold",
          },
          {
            title: "Algorand",
            subtitle: "AVM",
            detail: "USDC ASA verify + settle unchanged.",
          },
          {
            title: "Automatic",
            subtitle: "Offer-time",
            detail: "No new headers. Accepts rotate.",
          },
        ],
      }),
    },
    {
      role: "checklist",
      layout: "photo-hero-numbered",
      shareCopy: copies.checklist,
      content: photoContent({
        headline: "What ships with this update.",
        highlights: [
          "Dexter primary for Labs Solana/Base",
          "GoPlausible mid-rail on unhealthy Dexter",
          "PayAI last resort",
          "Boot-warmed health probes",
          "Merchant payTo wallets unchanged",
        ],
      }),
    },
    {
      role: "metrics",
      layout: "photo-stat-orbit",
      shareCopy: copies.metrics,
      content: photoContent({
        headline: "Uptime is a payment feature.",
        stats: [
          { value: "3", label: "Facilitator rails" },
          { value: "2", label: "New GP chains" },
          { value: "0", label: "Client changes" },
        ],
        narrative: "Labs keeps accepting Solana and Base payments when Dexter is dry.",
      }),
    },
    {
      role: "featured",
      layout: "photo-stat-monolith",
      shareCopy: copies.featured,
      content: photoContent({
        headline: "GoPlausible beyond Algorand.",
        stats: [{ value: "3", label: "Chains on one partner" }],
        narrative: "Algorand AVM + Solana + Base Exact — one facilitator brand, broader Syra rails.",
      }),
    },
    {
      role: "comparison",
      layout: "photo-compare-gradient",
      shareCopy: copies.comparison,
      content: photoContent({
        headline: "Two-rail vs three-rail Labs checkout.",
        compareLeft: {
          title: "Before",
          body: "Dexter unhealthy → jump to PayAI (or fail).",
        },
        compareRight: {
          title: "Now",
          body: "Dexter → GoPlausible → PayAI. Spare tire for Solana and Base.",
        },
      }),
    },
    {
      role: "launch",
      layout: "photo-partnership-beacon",
      shareCopy: copies.launch,
      content: photoContent({
        eyebrow: "Integration",
        badge: "Now live · Solana · Base failover",
        partnerName: "GoPlausible",
        partnerLogo: "/images/partners/goplausible.png",
        partnerLogoSolidBg: true,
        headline: "Syra × GoPlausible",
        subtitle:
          "Algorand settle plus Labs Solana/Base failover — resilience without client changes.",
      }),
    },
    {
      role: "deepDive",
      layout: "photo-statement-lattice",
      shareCopy: copies.deepDive,
      content: photoContent({
        kicker: "Under the hood",
        headline: "Offer-time only — by design.",
        items: [
          "goplausibleX402Networks — Solana + Base",
          "Fee payer 8a8fFNfk… (env override)",
          "GET /supported for Base exact",
          "Settle stays on the offered rail",
          "Local Solana settle still last resort",
        ],
      }),
    },
    {
      role: "split",
      layout: "photo-hero-frost",
      shareCopy: copies.split,
      content: photoContent({
        badge: "Dual role",
        headline: "One partner. Two jobs.",
        body: "AVM for Algorand. Mid-rail failover for Labs Solana and Base. Machine money that keeps working.",
        highlights: [
          "Algorand: AVM verify/settle",
          "Solana: Exact SVM mid-rail",
          "Base: Exact EVM mid-rail",
          "PayAI: final fallback",
        ],
      }),
    },
    {
      role: "terminal",
      layout: "photo-terminal",
      shareCopy: copies.terminal,
      content: photoContent({
        headline: "Failover in the request path.",
        terminalLines: [
          "$ GET /insights/...  x-lab-x402-chain=solana",
          "→ Dexter fee payer underfunded",
          "→ profile = goplausible",
          "→ 402 Exact SVM (GP feePayer)",
          "→ pay USDC → unlock payload",
        ],
      }),
    },
    {
      role: "cta",
      layout: "photo-closing-banner",
      shareCopy: copies.cta,
      content: photoContent({
        headline: "One partner. Three chains. Failover built in.",
        subtitle: "Hit Labs on Solana or Base — payment rails choose themselves.",
        links: [
          { label: "Labs", value: "syraa.fun/labs", href: "https://www.syraa.fun/labs" },
          {
            label: "GoPlausible",
            value: "facilitator docs",
            href: "https://facilitator.goplausible.xyz/docs",
          },
          {
            label: "Supported",
            value: "live networks",
            href: "https://facilitator.goplausible.xyz/supported",
          },
        ],
      }),
    },
  ],
);
