import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SyraLogo } from "./SyraLogo";
import { Twitter, Send, FileText, Mail } from "lucide-react";
import {
  EMAIL_SUPPORT,
  LINK_AGENT,
  LINK_DOCS,
  LINK_PLAYGROUND,
  LINK_STAKING,
  LINK_TELEGRAM,
  LINK_X,
} from "@/lib/marketing/global";
import { SYRA_META_DESCRIPTION } from "@/lib/syraBranding";

const footerLinks = {
  product: [
    { label: "Agent", href: LINK_AGENT, internal: true },
    { label: "Staking", href: LINK_STAKING, internal: true },
    { label: "API Docs", href: LINK_DOCS },
    { label: "Marketplace", href: LINK_PLAYGROUND, internal: true },
    { label: "Partners", href: "/partner", internal: true },
    { label: "Leaderboard", href: "/leaderboard", internal: true },
  ],
  resources: [
    { label: "Documentation", href: LINK_DOCS },
    { label: "Articles", href: "/articles", internal: true },
    { label: "Brand", href: "/brand", internal: true },
    { label: "Identity", href: "/identity", internal: true },
  ],
  company: [
    { label: "About", href: "/about", internal: true },
    { label: "Team", href: "/teams", internal: true },
    { label: "Contact", href: `mailto:${EMAIL_SUPPORT}` },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy", internal: true },
    { label: "Terms of Service", href: "/terms", internal: true },
    { label: "Cookie Policy", href: "/cookies", internal: true },
  ],
};

const socials = [
  { icon: Twitter, href: LINK_X, label: "Twitter" },
  { icon: Send, href: LINK_TELEGRAM, label: "Telegram" },
  { icon: FileText, href: LINK_DOCS, label: "Docs" },
];

export const Footer = () => {
  return (
    <footer className="relative border-t border-border">
      {/* CTA Section */}
      <div className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-6 text-center glass-card sm:p-10 lg:p-12"
        >
          {/* Background glow - theme colors */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/[0.04] via-muted/50 to-foreground/[0.04]" />

          <div className="relative z-10">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
              Fund your stack. <span className="neon-text">Run the agent.</span>
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-muted-foreground">
              Give Syra a mandate—research, risk, flow, execution—and let it
              work with pay-per-call tools on Solana while you keep custody of
              the keys.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link to={LINK_AGENT} className="btn-primary">
                Launch Agent
              </Link>
              <a
                href={`mailto:${EMAIL_SUPPORT}`}
                className="flex items-center justify-center gap-2 btn-secondary"
              >
                <Mail className="w-4 h-4" />
                Get Updates
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Links */}
      <div className="px-4 pb-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 mb-12 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <SyraLogo className="mb-4" />
            <p className="mb-4 text-sm text-muted-foreground">
              {SYRA_META_DESCRIPTION}
            </p>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 font-semibold capitalize">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {"internal" in link && link.internal ? (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 border-t border-border md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 Syra AI Labs. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Autonomous Intelligence Since 2024
          </p>
        </div>
      </div>
    </footer>
  );
};
