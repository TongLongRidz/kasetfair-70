"use client";

import { useState, useEffect, useCallback } from "react";
import thTranslations from "../../public/locales/th.json";
import enTranslations from "../../public/locales/en.json";

export type Locale = "th" | "en";

const translations: Record<Locale, any> = {
  th: thTranslations,
  en: enTranslations,
};

const STORAGE_KEY = process.env.NEXT_PUBLIC_LANG_STORAGE_KEY || "kaset_app_lang";

export function useTranslation() {
  const [lang, setLangState] = useState<Locale>("th");

  // Load language preference from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (savedLang === "th" || savedLang === "en") {
        setLangState(savedLang);
      }
    } catch (e) {
      console.error("Failed to read locale from localStorage:", e);
    }
  }, []);

  const changeLanguage = useCallback((newLang: Locale) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      window.dispatchEvent(new Event("languagechange"));
    } catch (e) {
      console.error("Failed to save locale to localStorage:", e);
    }
  }, []);

  // Listen to custom event for multi-component synchronization
  useEffect(() => {
    const handleSync = () => {
      try {
        const current = localStorage.getItem(STORAGE_KEY) as Locale | null;
        if (current === "th" || current === "en") {
          setLangState(current);
        }
      } catch {}
    };
    window.addEventListener("languagechange", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("languagechange", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // t function: support nested keys e.g. "order.total_amount"
  const t = useCallback(
    (key: string, fallback?: string): string => {
      const keys = key.split(".");
      let current: any = translations[lang];

      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = current[k];
        } else {
          // Fallback to th if missing in current lang
          let fallbackVal: any = translations["th"];
          for (const fbKey of keys) {
            if (fallbackVal && typeof fallbackVal === "object" && fbKey in fallbackVal) {
              fallbackVal = fallbackVal[fbKey];
            } else {
              fallbackVal = undefined;
              break;
            }
          }
          return typeof fallbackVal === "string" ? fallbackVal : fallback || key;
        }
      }

      return typeof current === "string" ? current : fallback || key;
    },
    [lang]
  );

  return {
    lang,
    setLang: changeLanguage,
    t,
  };
}

export default useTranslation;
