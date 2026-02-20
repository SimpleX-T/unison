export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  accent: string;
}

export const LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    accent: "#4a7c59",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    accent: "#c4522a",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇧🇷",
    accent: "#3d4fa1",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    accent: "#c49a3c",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    accent: "#7a3d6b",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    accent: "#2a7c7c",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    accent: "#b85c3a",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    accent: "#5a6abf",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    accent: "#8a6d3b",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    accent: "#c75f2a",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    accent: "#5a3d8a",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    accent: "#3a7a5a",
  },
];

export const LANGUAGE_MAP = new Map(LANGUAGES.map((l) => [l.code, l]));

export function getLanguage(code: string): Language {
  return (
    LANGUAGE_MAP.get(code) ?? {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      flag: "🌐",
      accent: "#6b6560",
    }
  );
}

export const LANGUAGE_COLORS: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.accent]),
);
