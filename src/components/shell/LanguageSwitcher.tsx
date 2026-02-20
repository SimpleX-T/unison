"use client";
import { useState, useRef, useEffect } from "react";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import { useAppStore } from "@/store/useAppStore";
import { ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const preferredLanguage = useAppStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useAppStore((s) => s.setPreferredLanguage);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = getLanguage(preferredLanguage);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="language-switcher" ref={ref}>
      <button
        className="language-switcher-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{currentLang.flag}</span>
        <span style={{ flex: 1 }}>{currentLang.name}</span>
        <ChevronDown
          size={14}
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0)",
          }}
        />
      </button>

      {open && (
        <div className="language-switcher-dropdown">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === preferredLanguage ? "selected" : ""}`}
              onClick={() => {
                setPreferredLanguage(lang.code);
                setOpen(false);
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              <span
                style={{
                  color: "var(--color-text-2)",
                  fontSize: "12px",
                  marginLeft: "auto",
                }}
              >
                {lang.nativeName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
