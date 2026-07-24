"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { animateThemeTransition } from "@/lib/theme-transition";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: (e?: React.MouseEvent<HTMLElement>) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if ((stored || "system") !== theme) {
      setThemeState(stored || "system");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", theme);

    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
    if (resolvedTheme !== resolved) {
      setResolved(resolvedTheme);
    }
    const wantsDark = resolvedTheme === "dark";
    if (document.documentElement.classList.contains("dark") !== wantsDark) {
      document.documentElement.classList.toggle("dark", wantsDark);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolvedTheme = getSystemTheme();
      setResolved(resolvedTheme);
      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const toggleTheme = useCallback(
    (e?: React.MouseEvent<HTMLElement>) => {
      const next = resolved === "dark" ? "light" : "dark";
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

      setThemeState(next);
      setResolved(next);
      animateThemeTransition(x, y, next);
    },
    [resolved]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolved,
        setTheme: setThemeState,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
