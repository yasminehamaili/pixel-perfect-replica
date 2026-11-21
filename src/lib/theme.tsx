import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const THEME_STORAGE_KEY = "northstar.theme";

/** Inline script for <head>: applies the saved theme before first paint (no flash). */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

type ThemeValue = { dark: boolean; setDark: (dark: boolean) => void };

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    setDarkState(document.documentElement.classList.contains("dark"));
  }, []);

  const setDark = useCallback((next: boolean) => {
    setDarkState(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
  }, []);

  return <ThemeContext.Provider value={{ dark, setDark }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
