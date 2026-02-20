"use client";
import { useAppStore } from "@/store/useAppStore";
import { getUIString, type UIStringKey } from "@/lib/i18n/ui-strings";
import { useCallback } from "react";

/**
 * Hook that returns a translation function `t()` for static UI strings.
 * Reads the user's preferred language from the Zustand store.
 * All translations are pre-bundled — zero API calls.
 */
export function useUITranslation() {
  const lang = useAppStore((s) => s.preferredLanguage);

  const t = useCallback(
    (key: UIStringKey): string => getUIString(key, lang),
    [lang],
  );

  return { t, language: lang };
}
