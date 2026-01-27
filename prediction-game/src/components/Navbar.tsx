import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import WalletButton from "./WalletButton";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onOpenWalletModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenWalletModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useWallet();
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Staking", path: "/staking" },
    { name: "Create Event", path: "/create" },
    { name: "Admin", path: "/admin" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-xl border-border/50 transition-all duration-300">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
          >
            <img
              src="/images/logo-transparent-notext.png"
              alt="SyraPredict Logo"
              className="rounded-lg w-9 h-9 transition-transform duration-300 hover:rotate-6"
            />
            <span className="text-xl font-bold gradient-text">SyraPredict</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="items-center hidden gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-300 relative group ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent-blue to-accent rounded-full animate-fade-in-up" />
                )}
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary/0 group-hover:bg-primary/30 rounded-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative overflow-hidden transition-all duration-300 hover:bg-secondary/80 hover:scale-110"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-primary transition-transform duration-300 hover:rotate-180" />
                ) : (
                  <Moon className="h-5 w-5 text-primary transition-transform duration-300 hover:-rotate-12" />
                )}
              </Button>
            )}
            <WalletButton onOpenModal={onOpenWalletModal} />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="p-2 md:hidden transition-all duration-300 hover:bg-secondary/50 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
            ) : (
              <Menu className="w-6 h-6 transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="py-4 border-t md:hidden border-border/50 animate-fade-in-up">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-all duration-300 px-2 py-1 rounded-lg ${
                    isActive(link.path)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                {mounted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex-1 justify-start"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4 mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 mr-2" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                )}
                <WalletButton onOpenModal={onOpenWalletModal} />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
