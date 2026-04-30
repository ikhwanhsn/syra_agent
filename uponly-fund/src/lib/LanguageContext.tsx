import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Language = "en" | "zh";

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
};

const STORAGE_KEY = "uof-language";

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "zh" ? "zh" : "en";
  });

  const setLanguage = (next: Language) => setLanguageState(next);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
