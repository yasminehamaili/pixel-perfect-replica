import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "date-fns";
import { enUS, fr } from "date-fns/locale";

import { LANGUAGES, translate, type Language, type TranslationKey } from "./dictionary";

const STORAGE_KEY = "northstar.language";

type I18nValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  dateLocale: Locale;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) {
      setLanguageState(stored as Language);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, dateLocale: language === "fr" ? fr : enUS }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLanguage(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLanguage must be used inside <I18nProvider>");
  return ctx;
}

/** Returns t(key, vars) bound to the current language. */
export function useT() {
  const { language } = useLanguage();
  return useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  );
}
