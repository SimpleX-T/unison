"use client";
import { useEffect, useState } from "react";
import { translateText, getContentHash } from "@/lib/translation/client";
import { useAppStore } from "@/store/useAppStore";

export function useTranslation(
  id: string,
  text: string,
  fromLanguage: string,
  toLanguage?: string,
) {
  const preferredLanguage = useAppStore((s) => s.preferredLanguage);
  const targetLanguage = toLanguage ?? preferredLanguage;
  const [translated, setTranslated] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!text || fromLanguage === targetLanguage) {
      setTranslated(text);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getContentHash(text).then((hash) => {
      translateText(hash, text, fromLanguage, targetLanguage).then((result) => {
        if (!cancelled) {
          setTranslated(result);
          setIsLoading(false);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [text, fromLanguage, targetLanguage, id]);

  return {
    translated,
    isLoading,
    isTranslated: fromLanguage !== targetLanguage,
  };
}
