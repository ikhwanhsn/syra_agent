import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SyraLogo } from "./SyraLogo";
import { LINK_AGENT, LINK_DOCS } from "../../config/global";

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
      className="fixed top-0 left-0 right-0 z-[9999]"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav className="px-6 py-4 mt-4 pointer-events-auto glass-card">
          <div className="flex items-center justify-between">
            <SyraLogo />

            {/* Desktop Navigation */}
            <div className="items-center hidden gap-8 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative z-10 text-sm font-medium transition-colors duration-300 pointer-events-auto text-muted-foreground hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="items-center hidden gap-4 md:flex">
              <a
                href={LINK_DOCS}
                target="_blank"
                className="px-5 py-2 text-sm btn-secondary"
              >
                View Docs
              </a>
              <a
                href={LINK_AGENT}
                target="_blank"
                className="px-5 py-2 text-sm btn-primary"
              >
                Launch Agent
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-10 p-2 md:hidden text-foreground"
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
              className="pt-4 mt-4 border-t md:hidden border-border"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="relative z-10 font-medium transition-colors duration-300 text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-3 mt-4">
                  <a
                    href={LINK_DOCS}
                    target="_blank"
                    className="px-5 py-2 text-sm text-center btn-secondary"
                  >
                    View Docs
                  </a>
                  <a
                    href={LINK_AGENT}
                    target="_blank"
                    className="px-5 py-2 text-sm text-center btn-primary"
                  >
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
