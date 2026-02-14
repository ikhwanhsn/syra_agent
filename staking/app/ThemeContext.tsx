"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "staking-theme";

function getStored(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark") return v;
  return null;
}

function getSystemDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(stored: Theme | null): Theme {
  return stored ?? (getSystemDark() ? "dark" : "light");
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = getStored();
  if (stored) return stored;
  return getSystemDark() ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStored();
    const resolved = resolveTheme(stored);
    setThemeState(resolved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const stored = getStored();
    if (stored !== null) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = () => setThemeState(mq.matches ? "dark" : "light");
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, [mounted]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved: theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
