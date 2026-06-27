import { Link } from "react-router-dom";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  Twitter,
  Send,
  Mail,
  Linkedin,
} from "lucide-react";
import { mainNavLinks, otherNavLinks, programNavLinks } from "@/lib/siteNav";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { CampaignNotifySignup } from "@/components/CampaignNotifySignup";

const Footer = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer
      id="contact"
      className="relative pt-16 sm:pt-20 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] overflow-hidden"
    >
      <div className="section-divider" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className={cn(siteShell, "relative z-10")}>
        <div className="panel-glass p-6 sm:p-8 lg:p-12 mb-8 sm:mb-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2.5 mb-5">
                <img
                  src="/images/logo.png"
                  alt="S3 Labs Logo"
                  className="w-8 h-8 rounded-xl ring-1 ring-border/50"
                />
                <span className="font-semibold text-lg tracking-tight">
                  S3 Labs
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-6">
                {
                  "Growth partner for Solana developers. We help projects with MVPs or hackathon winners to scale and generate revenue."
                }
              </p>
              <div className="flex items-center gap-2">
                {[
                  {
                    href: "https://x.com/s3labs_",
                    icon: Twitter,
                    label: "Twitter",
                  },
                  {
                    href: "https://www.linkedin.com/company/s3labs/",
                    icon: Linkedin,
                    label: "LinkedIn",
                  },
                  {
                    href: "https://t.me/s3labs",
                    icon: Send,
                    label: "Telegram",
                  },
                  {
                    href: "mailto:s3labs.company@gmail.com",
                    icon: Mail,
                    label: "Email",
                  },
                ].map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {"Navigation"}
              </h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {[...mainNavLinks, ...programNavLinks, ...otherNavLinks].map(
                  (link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                        {link.soon ? " (Soon)" : ""}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {"Settings"}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="w-full justify-start gap-2 rounded-xl border-border/70"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    {"Light Mode"}
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    {"Dark Mode"}
                  </>
                )}
              </Button>
            </div>

            <div className="lg:col-span-3">
              <CampaignNotifySignup compact source="footer" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted-foreground">
            © 2024 S3 Labs. {"All Rights Reserved."}
          </p>
          <p className="text-xs text-muted-foreground">
            {"Built for the Solana ecosystem"}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
