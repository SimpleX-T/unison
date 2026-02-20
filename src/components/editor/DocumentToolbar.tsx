"use client";
import { useAppStore } from "@/store/useAppStore";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { Languages, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { getLanguage } from "@/lib/languages";
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
  const lang = getLanguage(user.preferred_language);

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
        {/* Presence — shows current user; real multi-user comes from Yjs awareness */}
        {user.id && (
          <div className="presence-bar">
            <div
              className="presence-user"
              style={{ "--lang-accent": lang.accent } as React.CSSProperties}
            >
              <span className="presence-dot" />
              <span>
                {user.display_name} {lang.flag}
              </span>
            </div>
          </div>
        )}

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
