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

  const changeLanguage = useCallback((newLang: Locale) => {
    setLangState(newLang);
    window.dispatchEvent(new Event("languagechange"));
  }, []);

  // Listen to custom event for multi-component synchronization
  useEffect(() => {
    const handleSync = () => {};
    window.addEventListener("languagechange", handleSync);
    return () => {
      window.removeEventListener("languagechange", handleSync);
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
