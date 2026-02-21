"use client";
import { useAppStore } from "@/store/useAppStore";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import {
  Languages,
  Eye,
  EyeOff,
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  CodeSquare,
  Undo2,
  Redo2,
} from "lucide-react";
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
  saveStatus?: "idle" | "saving" | "saved";
}

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`toolbar-btn ${active ? "bg-green" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="toolbar-divider" />;
}

export function DocumentToolbar({
  title,
  onTitleChange,
  isTranslatedMode,
  onToggleTranslation,
  editor,
  saveStatus = "idle",
}: DocumentToolbarProps) {
  const user = useAppStore((s) => s.user);
  const params = useParams();
  const slug = params?.slug as string;
  const lang = getLanguage(user.preferred_language);

  const sz = 14;

  return (
    <div className="document-toolbar">
      {/* Row 1: Title + presence + translate */}
      <div className="doc-toolbar-row doc-toolbar-title-row">
        <Link href={`/workspace/${slug}/docs`} className="doc-toolbar-back">
          <ChevronLeft size={16} />
        </Link>

        <input
          className="doc-title-input"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled document"
        />

        <LanguageBadge languageCode={user.preferred_language} />

        {saveStatus !== "idle" && (
          <span className={`doc-save-indicator ${saveStatus}`}>
            {saveStatus === "saving" ? "Saving…" : "Saved ✓"}
          </span>
        )}

        <div className="doc-toolbar-spacer" />

        {user.id && (
          <div className="doc-presence-pill">
            <span
              className="doc-presence-dot"
              style={{ background: lang.accent }}
            />
            <span>{user.display_name}</span>
            <span>{lang.flag}</span>
          </div>
        )}

        <button
          className={`doc-translate-btn ${isTranslatedMode ? "active" : ""}`}
          onClick={onToggleTranslation}
        >
          {isTranslatedMode ? <Eye size={13} /> : <EyeOff size={13} />}
          <span>{isTranslatedMode ? "Your Language" : "Original"}</span>
          <Languages size={13} />
        </button>
      </div>

      {/* Row 2: Formatting toolbar */}
      {editor && (
        <div className="doc-toolbar-row doc-toolbar-format-row">
          <Btn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={sz} />
          </Btn>

          <Sep />

          <Btn
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={sz} />
          </Btn>
          <Btn
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={sz} />
          </Btn>
          <Btn
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={sz} />
          </Btn>

          <Sep />

          <Btn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline (Ctrl+U)"
          >
            <Underline size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title="Inline Code"
          >
            <Code size={sz} />
          </Btn>

          <Sep />

          <Btn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Ordered List"
          >
            <ListOrdered size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <CodeSquare size={sz} />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus size={sz} />
          </Btn>
        </div>
      )}
    </div>
  );
}
