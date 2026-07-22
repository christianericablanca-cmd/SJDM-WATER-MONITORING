"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "tl";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Language | null;
    if (stored === "tl" || stored === "en") {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  if (!mounted) {
    return <LanguageContext.Provider value={{ lang: "en", setLang }}>{children}</LanguageContext.Provider>;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
