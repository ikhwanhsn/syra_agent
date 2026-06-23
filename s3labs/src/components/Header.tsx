import { useState } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { NavbarWalletButton } from "@/components/NavbarWalletButton";
import { mainNavLinks } from "@/lib/siteNav";
import { cn } from "@/lib/utils";
import { Moon, Sun, Menu, X } from "lucide-react";

function NavItemLabel({ label, soon }: { label: string; soon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      {soon ? (
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 uppercase tracking-wider border-amber-500/40 text-amber-400 bg-amber-500/10 font-semibold"
        >
          Soon
        </Badge>
      ) : null}
    </span>
  );
}

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[200] isolate">
      <div className="mx-3 sm:mx-4 lg:mx-6 mt-3 sm:mt-4">
        <div className="container mx-auto panel-glass rounded-2xl border-border/60 px-4 sm:px-6 relative z-[200]">
          <div className="flex items-center justify-between h-14 lg:h-16 gap-4">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <img
                src="/images/logo.png"
                alt="S3 Labs Logo"
                className="w-8 h-8 rounded-xl ring-1 ring-border/50 group-hover:ring-primary/30 transition-all"
              />
              <span className="font-semibold text-lg tracking-tight text-foreground">
                S3 Labs
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
              {mainNavLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={cn("nav-link-premium", item.soon && "opacity-80")}
                  activeClassName="text-foreground after:w-full"
                >
                  <NavItemLabel label={item.label} soon={item.soon} />
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full h-9 w-9"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>

              <NavbarWalletButton />
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-border/60 animate-fade-in">
              <div className="flex flex-col gap-1">
                {mainNavLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className="px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-colors text-sm font-medium"
                    activeClassName="text-foreground bg-secondary/60"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <NavItemLabel label={item.label} soon={item.soon} />
                  </NavLink>
                ))}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
