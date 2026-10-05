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

function getCookie(name: string): Locale | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const val = parts.pop()?.split(";").shift();
    if (val === "th" || val === "en") return val;
  }
  return null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function useTranslation() {
  const [lang, setLangState] = useState<Locale>(() => {
    // Read from cookie during initial client render if available
    const savedCookie = getCookie(STORAGE_KEY);
    return savedCookie === "th" || savedCookie === "en" ? savedCookie : "th";
  });

  // Initial load: sync cookie
  useEffect(() => {
    const savedCookie = getCookie(STORAGE_KEY);
    if (savedCookie === "th" || savedCookie === "en") {
      setLangState(savedCookie);
    } else {
      setCookie(STORAGE_KEY, "th");
    }
  }, []);

  const changeLanguage = useCallback((newLang: Locale) => {
    setLangState(newLang);
    // Save to Cookie (available to both Server & Client)
    setCookie(STORAGE_KEY, newLang);

    // Clean up legacy localStorage if any
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      window.dispatchEvent(new Event("languagechange"));
    }
  }, []);

  // Synchronize language state across components and tabs
  useEffect(() => {
    const handleSync = () => {
      const currentCookie = getCookie(STORAGE_KEY);
      if (currentCookie === "th" || currentCookie === "en") {
        setLangState(currentCookie);
      }
    };
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
