"use client";
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Languages, Eye, EyeOff, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Editor } from "@tiptap/react";

interface DocumentToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  documentId: string;
  isTranslatedMode: boolean;
  onToggleTranslation: () => void;
  editor: Editor | null;
}

export function DocumentToolbar({
  title,
  onTitleChange,
  isTranslatedMode,
  onToggleTranslation,
  editor,
}: DocumentToolbarProps) {
  const user = useAppStore((s) => s.user);
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="document-toolbar">
      <div className="document-toolbar-left">
        <Link
          href={`/workspace/${slug}/docs`}
          className="btn btn-ghost btn-icon"
          style={{ marginRight: "4px" }}
        >
          <ChevronLeft size={18} />
        </Link>
        <input
          className="document-title-input"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled document"
        />
        <LanguageBadge languageCode={user.preferred_language} />
      </div>

      <div className="document-toolbar-right">
        {/* Presence avatars — demo users */}
        <div className="presence-bar">
          <div
            className="presence-user"
            style={{ "--lang-accent": "#4a7c59" } as React.CSSProperties}
          >
            <span className="presence-dot" />
            <span>Alex 🇬🇧</span>
          </div>
          <div
            className="presence-user"
            style={{ "--lang-accent": "#c4522a" } as React.CSSProperties}
          >
            <span className="presence-dot" />
            <span>Yuki 🇯🇵</span>
          </div>
        </div>

        {/* Translation toggle */}
        <button
          className={`translation-toggle ${isTranslatedMode ? "active" : ""}`}
          onClick={onToggleTranslation}
        >
          {isTranslatedMode ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>{isTranslatedMode ? "Your Language" : "Original"}</span>
          <Languages size={14} />
        </button>
      </div>
    </div>
  );
}
