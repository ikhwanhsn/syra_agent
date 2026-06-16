import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Moon, Sun, Twitter, Send, Mail, Linkedin, ArrowUpRight } from "lucide-react";

const TELEGRAM_CONTACTS = [
  { name: "Rara", fullName: "Destriani Rahayu", url: "https://t.me/raraverse" },
  { name: "Ikhwan", fullName: "Ikhwanul Husna", url: "https://t.me/ikhwanhsn" },
];

const Footer = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [telegramOpen, setTelegramOpen] = useState(false);

  const navLinks = [
    { href: "#who-we-help", label: t("Untuk Siapa", "Who We Help") },
    { href: "#mission", label: t("Misi", "Mission") },
    { href: "#benefits", label: t("Manfaat", "Benefits") },
    { href: "#how-it-works", label: t("Cara Kerja", "How It Works") },
    { href: "/events", label: t("Event", "Events") },
    { href: "/post", label: t("Signal Studio", "Signal Studio") },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <footer id="contact" className="relative pt-20 pb-10 overflow-hidden">
      <div className="section-divider" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container relative z-10">
        <div className="panel-glass p-8 sm:p-10 lg:p-12 mb-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5 mb-5">
                <img
                  src="/images/logo.png"
                  alt="S3 Labs Logo"
                  className="w-8 h-8 rounded-xl ring-1 ring-border/50"
                />
                <span className="font-semibold text-lg tracking-tight">S3 Labs</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-6">
                {t(
                  "Mitra pertumbuhan untuk developer Solana. Kami membantu project dengan MVP atau pemenang hackathon untuk scale dan generate revenue.",
                  "Growth partner for Solana developers. We help projects with MVPs or hackathon winners to scale and generate revenue.",
                )}
              </p>
              <div className="flex items-center gap-2">
                {[
                  { href: "https://x.com/s3labs_", icon: Twitter, label: "Twitter" },
                  { href: "https://www.linkedin.com/company/s3labs/", icon: Linkedin, label: "LinkedIn" },
                  { href: "mailto:s3labs.company@gmail.com", icon: Mail, label: "Email" },
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
                <Dialog open={telegramOpen} onOpenChange={setTelegramOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("Telegram", "Telegram")}
                      className="w-10 h-10 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md panel-glass">
                    <DialogHeader>
                      <DialogTitle>
                        {t("Hubungi kami di Telegram", "Contact us on Telegram")}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                      {TELEGRAM_CONTACTS.map((contact) => (
                        <a
                          key={contact.name}
                          href={contact.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                          onClick={() => setTelegramOpen(false)}
                        >
                          <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Send className="w-4 h-4 text-primary" />
                          </span>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-foreground text-sm">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.fullName}</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="lg:col-span-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {t("Navigasi", "Navigation")}
              </h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.href}>
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

            <div className="lg:col-span-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {t("Pengaturan", "Settings")}
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
                    {t("Mode Terang", "Light Mode")}
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    {t("Mode Gelap", "Dark Mode")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted-foreground">
            © 2024 S3 Labs. {t("Hak Cipta Dilindungi.", "All Rights Reserved.")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("Dibangun untuk ekosistem Solana", "Built for the Solana ecosystem")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
