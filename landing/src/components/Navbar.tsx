import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SyraLogo } from "./SyraLogo";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Token", href: "#token" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "FAQ", href: "#faq" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="glass-card mt-4 px-6 py-4">
          <div className="flex items-center justify-between">
            <SyraLogo />
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <a href="#docs" className="btn-secondary text-sm py-2 px-5">
                View Docs
              </a>
              <a href="#app" className="btn-primary text-sm py-2 px-5">
                Launch App
              </a>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-foreground p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-border"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-3 mt-4">
                  <a href="#docs" className="btn-secondary text-sm py-2 px-5 text-center">
                    View Docs
                  </a>
                  <a href="#app" className="btn-primary text-sm py-2 px-5 text-center">
                    Launch App
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </nav>
      </div>
    </motion.header>
  );
};
