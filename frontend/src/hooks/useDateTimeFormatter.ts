"use client";

import { useState, useEffect, useCallback } from "react";

export type DateFormat = "dmy" | "ymd"; // วันเดือนปี (DD/MM/YYYY) vs ปีเดือนวัน (YYYY/MM/DD)
export type EraFormat = "be" | "ce";   // พ.ศ. (Buddhist Era) vs ค.ศ. (Common Era)
export type TimeFormat = "24h" | "12h"; // 24 ชั่วโมง vs 12 ชั่วโมง (AM/PM)

export interface DateTimeSettings {
  dateFormat: DateFormat;
  eraFormat: EraFormat;
  timeFormat: TimeFormat;
}

const DATE_FORMAT_KEY = "kaset_date_format";
const ERA_FORMAT_KEY = "kaset_era_format";
const TIME_FORMAT_KEY = "kaset_time_format";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function useDateTimeFormatter() {
  const [dateFormat, setDateFormatState] = useState<DateFormat>(() => {
    const val = getCookie(DATE_FORMAT_KEY);
    return val === "ymd" ? "ymd" : "dmy";
  });

  const [eraFormat, setEraFormatState] = useState<EraFormat>(() => {
    const val = getCookie(ERA_FORMAT_KEY);
    return val === "ce" ? "ce" : "be";
  });

  const [timeFormat, setTimeFormatState] = useState<TimeFormat>(() => {
    const val = getCookie(TIME_FORMAT_KEY);
    return val === "12h" ? "12h" : "24h";
  });

  // Sync initial cookies
  useEffect(() => {
    const dVal = getCookie(DATE_FORMAT_KEY);
    if (dVal === "dmy" || dVal === "ymd") setDateFormatState(dVal);
    else setCookie(DATE_FORMAT_KEY, "dmy");

    const eVal = getCookie(ERA_FORMAT_KEY);
    if (eVal === "be" || eVal === "ce") setEraFormatState(eVal);
    else setCookie(ERA_FORMAT_KEY, "be");

    const tVal = getCookie(TIME_FORMAT_KEY);
    if (tVal === "24h" || tVal === "12h") setTimeFormatState(tVal);
    else setCookie(TIME_FORMAT_KEY, "24h");
  }, []);

  const setDateFormat = useCallback((format: DateFormat) => {
    setDateFormatState(format);
    setCookie(DATE_FORMAT_KEY, format);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("datetimeformatchange"));
    }
  }, []);

  const setEraFormat = useCallback((format: EraFormat) => {
    setEraFormatState(format);
    setCookie(ERA_FORMAT_KEY, format);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("datetimeformatchange"));
    }
  }, []);

  const setTimeFormat = useCallback((format: TimeFormat) => {
    setTimeFormatState(format);
    setCookie(TIME_FORMAT_KEY, format);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("datetimeformatchange"));
    }
  }, []);

  // Listen to cross-component changes
  useEffect(() => {
    const handleSync = () => {
      const dVal = getCookie(DATE_FORMAT_KEY);
      if (dVal === "dmy" || dVal === "ymd") setDateFormatState(dVal);

      const eVal = getCookie(ERA_FORMAT_KEY);
      if (eVal === "be" || eVal === "ce") setEraFormatState(eVal);

      const tVal = getCookie(TIME_FORMAT_KEY);
      if (tVal === "24h" || tVal === "12h") setTimeFormatState(tVal);
    };

    window.addEventListener("datetimeformatchange", handleSync);
    return () => {
      window.removeEventListener("datetimeformatchange", handleSync);
    };
  }, []);

  /**
   * Format a date string (ISO / MySQL format) or Date object into configured date and time
   */
  const formatDate = useCallback(
    (input?: string | Date | null): string => {
      if (!input) return "-";
      const date = typeof input === "string" ? new Date(input) : input;
      if (isNaN(date.getTime())) return typeof input === "string" ? input : "-";

      let year = date.getFullYear();
      if (eraFormat === "be") {
        year += 543;
      }

      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      if (dateFormat === "ymd") {
        return `${year}-${month}-${day}`;
      }
      return `${day}/${month}/${year}`;
    },
    [dateFormat, eraFormat]
  );

  const formatTime = useCallback(
    (input?: string | Date | null): string => {
      if (!input) return "";
      const date = typeof input === "string" ? new Date(input) : input;
      if (isNaN(date.getTime())) return "";

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      if (timeFormat === "12h") {
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes}:${seconds} ${period}`;
      }

      return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
    },
    [timeFormat]
  );

  const formatDateTime = useCallback(
    (input?: string | Date | null): { datePart: string; timePart: string } => {
      if (!input) return { datePart: "-", timePart: "" };
      return {
        datePart: formatDate(input),
        timePart: formatTime(input),
      };
    },
    [formatDate, formatTime]
  );

  return {
    dateFormat,
    eraFormat,
    timeFormat,
    setDateFormat,
    setEraFormat,
    setTimeFormat,
    formatDate,
    formatTime,
    formatDateTime,
  };
}

export default useDateTimeFormatter;
