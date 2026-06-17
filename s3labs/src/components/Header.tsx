import { useState } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Menu, X, ChevronDown } from "lucide-react";

interface HeaderProps {
  onApplyClick: () => void;
}

const Header = ({ onApplyClick }: HeaderProps) => {

  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryNav = [
    { href: "#who-we-help", label: "Who We Help" },
    { href: "#mission", label: "Mission" },
    { href: "#benefits", label: "Benefits" },
    { href: "#how-it-works", label: "How It Works" },
  ];

  const moreNav = [
    { href: "/kol", label: "KOL Marketplace", isRoute: true },
    { href: "#community", label: "Community" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[200] isolate">
      <div className="mx-3 sm:mx-4 lg:mx-6 mt-3 sm:mt-4">
        <div className="container mx-auto panel-glass rounded-2xl border-border/60 px-4 sm:px-6 relative z-[200]">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/images/logo.png"
                alt="S3 Labs Logo"
                className="w-8 h-8 rounded-xl ring-1 ring-border/50 group-hover:ring-primary/30 transition-all"
              />
              <span className="font-semibold text-lg tracking-tight text-foreground">
                S3 Labs
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              {primaryNav.map((item) => (
                <a key={item.href} href={item.href} className="nav-link-premium">
                  {item.label}
                </a>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger className="nav-link-premium flex items-center gap-0.5 outline-none">
                  {"More"}
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[11rem] panel-glass z-[250]">
                  {moreNav.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      {"isRoute" in item && item.isRoute ? (
                        <Link to={item.href}>{item.label}</Link>
                      ) : (
                        <a href={item.href}>{item.label}</a>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full h-9 w-9"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="hero"
                size="sm"
                className="hidden md:flex btn-premium h-9 px-5 text-sm"
                onClick={onApplyClick}
              >
                {"Apply Now"}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-border/60 animate-fade-in">
              <div className="flex flex-col gap-1">
                {primaryNav.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-colors text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {"More"}
                </div>
                {moreNav.map((item) =>
                  "isRoute" in item && item.isRoute ? (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-colors text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-colors text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ),
                )}
                <div className="pt-3 px-1">
                  <Button
                    variant="hero"
                    className="w-full btn-premium"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onApplyClick();
                    }}
                  >
                    {"Apply Now"}
                  </Button>
                </div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
