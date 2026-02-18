import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { SyraLogo } from "./SyraLogo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LINK_AGENT, LINK_DOCS } from "../../config/global";

const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "API", href: "/#api" },
  { label: "Token", href: "/#token" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "FAQ", href: "/#faq" },
  { label: "Analytics", href: "/analytics" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
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
            <Link
              to="/"
              className="relative z-10 text-2xl font-bold cursor-pointer text-foreground"
            >
              <SyraLogo />
            </Link>

            {/* Desktop Navigation */}
            <div className="items-center hidden gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="relative z-10 text-sm font-medium transition-colors duration-300 pointer-events-auto text-muted-foreground hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="items-center hidden gap-2 md:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="h-9 w-9 shrink-0"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Switch to {theme === "dark" ? "light" : "dark"} mode
                  </p>
                </TooltipContent>
              </Tooltip>
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
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="relative z-10 font-medium transition-colors duration-300 text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-center gap-2"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    <span className="relative h-4 w-4 shrink-0">
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute inset-0 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </span>
                    {theme === "dark" ? "Light" : "Dark"} mode
                  </Button>
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
