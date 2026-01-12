import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import WalletButton from "./WalletButton";
import { useWallet } from "@/contexts/WalletContext";

interface NavbarProps {
  onOpenWalletModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenWalletModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected } = useWallet();
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Create Event", path: "/create" },
    { name: "Admin", path: "/admin" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-xl border-border/50">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/logo-transparent-notext.png"
              alt="SyraPredict Logo"
              className="rounded-lg w-9 h-9"
            />
            <span className="text-xl font-bold gradient-text">SyraPredict</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="items-center hidden gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:block">
            <WalletButton onOpenModal={onOpenWalletModal} />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="p-2 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="py-4 border-t md:hidden border-border/50">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <WalletButton onOpenModal={onOpenWalletModal} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
