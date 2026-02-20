"use client";
import { getLanguage } from "@/lib/languages";

interface LanguageBadgeProps {
  languageCode: string;
  showName?: boolean;
  className?: string;
}

export function LanguageBadge({
  languageCode,
  showName = true,
  className = "",
}: LanguageBadgeProps) {
  const lang = getLanguage(languageCode);
  return (
    <span
      className={`language-badge ${className}`}
      style={{ borderColor: `${lang.accent}20`, color: lang.accent }}
    >
      <span>{lang.flag}</span>
      {showName && <span>{lang.name}</span>}
    </span>
  );
}
