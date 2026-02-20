"use client";
import { getLanguage } from "@/lib/languages";

interface UserAvatarProps {
  name: string;
  languageCode?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  avatarUrl?: string | null;
}

export function UserAvatar({
  name,
  languageCode,
  size = "md",
  color,
  avatarUrl,
}: UserAvatarProps) {
  const lang = languageCode ? getLanguage(languageCode) : null;
  const bgColor = color || lang?.accent || "#4a7c59";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="user-avatar">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`user-avatar-circle ${size}`}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <div
          className={`user-avatar-circle ${size}`}
          style={{ background: bgColor }}
        >
          {initials}
        </div>
      )}
      {lang && <span className="user-avatar-flag">{lang.flag}</span>}
    </div>
  );
}
