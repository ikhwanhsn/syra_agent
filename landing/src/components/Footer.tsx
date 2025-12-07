import { motion } from "framer-motion";
import { SyraLogo } from "./SyraLogo";
import { Twitter, Github, MessageCircle, FileText, Mail } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Dashboard", href: "#" },
    { label: "API Docs", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "Tutorials", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Status", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press Kit", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const socials = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: MessageCircle, href: "#", label: "Discord" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: FileText, href: "#", label: "Medium" },
];

export const Footer = () => {
  return (
    <footer className="relative border-t border-border">
      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-12 rounded-3xl text-center relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-neon-purple/10" />
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Trade <span className="neon-text">Smarter?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of traders using Syra to gain an edge in the markets. 
              Start with our free tier today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#" className="btn-primary">
                Launch App
              </a>
              <a href="#" className="btn-secondary flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Get Updates
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <SyraLogo className="mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered trading infrastructure for the next generation of traders.
            </p>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
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
              <h4 className="font-semibold mb-4 capitalize">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Syra. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with ♡ for the DeFi community
          </p>
        </div>
      </div>
    </footer>
  );
};
