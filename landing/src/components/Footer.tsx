import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SyraLogo } from "./SyraLogo";
import { Twitter, Github, MessageCircle, FileText, Mail } from "lucide-react";
import {
  EMAIL_SUPPORT,
  LINK_AGENT,
  LINK_DOCS,
  LINK_PLAYGROUND,
  // LINK_TELEGRAM, // hidden: focus on website
  LINK_X,
} from "../../config/global";

const footerLinks = {
  product: [
    { label: "Agent", href: LINK_AGENT },
    { label: "API Docs", href: LINK_DOCS },
    { label: "Playground", href: LINK_PLAYGROUND },
    { label: "Analytics", href: "/analytics", internal: true },
    { label: "Leaderboard", href: "/leaderboard", internal: true },
  ],
  resources: [
    { label: "Documentation", href: LINK_DOCS },
    { label: "Articles", href: "/articles", internal: true },
  ],
  company: [
    { label: "About", href: "/#product", internal: true },
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
  // { icon: MessageCircle, href: LINK_TELEGRAM, label: "Telegram" }, // hidden: focus on website
  { icon: Github, href: "#", label: "GitHub" },
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
          className="relative p-12 overflow-hidden text-center glass-card rounded-3xl"
        >
          {/* Background glow - theme colors */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-neon-gold/8" />

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Ready to Trade <span className="neon-text">Smarter?</span>
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-muted-foreground">
              Join thousands of traders using Syra to gain an edge in the
              markets. Start today.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a href={LINK_AGENT} target="_blank" className="btn-primary">
                Launch Agent
              </a>
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
              AI-powered trading infrastructure for the next generation of
              traders.
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
                        className="text-sm transition-colors text-muted-foreground hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm transition-colors text-muted-foreground hover:text-primary"
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
            © 2025 Syra AI Labs. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Autonomous Intelligence Since 2024
          </p>
        </div>
      </div>
    </footer>
  );
};
