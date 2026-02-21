"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExt from "@tiptap/extension-underline";
import * as Y from "yjs";
import { SupabaseProvider } from "@/lib/yjs/SupabaseProvider";
import { LanguageAttr } from "@/lib/tiptap/LanguageAttr";
import { useDocumentTranslation } from "@/hooks/useDocumentTranslation";
import { DocumentToolbar } from "./DocumentToolbar";
import { CommentSidebar } from "./CommentSidebar";
import { useAppStore } from "@/store/useAppStore";
import { getLanguage } from "@/lib/languages";

interface DocumentEditorProps {
  documentId: string;
  initialTitle?: string;
  userId?: string;
}

export function DocumentEditor({
  documentId,
  initialTitle = "Untitled",
  userId,
}: DocumentEditorProps) {
  const user = useAppStore((s) => s.user);
  const [isTranslatedMode, setIsTranslatedMode] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [providerReady, setProviderReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const providerRef = useRef<SupabaseProvider | null>(null);

  // Create Y.Doc only once per documentId (stable reference)
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);

  // Autosave title to DB (debounced 1.5s)
  useEffect(() => {
    if (!userId || title === initialTitle) return;
    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase
          .from("documents")
          .update({
            title,
            last_edited_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", documentId);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, documentId, userId, initialTitle]);

  // Connect the Supabase provider
  useEffect(() => {
    const provider = new SupabaseProvider(ydoc, documentId);
    providerRef.current = provider;
    setProviderReady(true);

    return () => {
      provider.destroy();
      ydoc.destroy();
      setProviderReady(false);
    };
  }, [ydoc, documentId]);

  // Update awareness separately
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider || !user.id) return;

    const lang = getLanguage(user.preferred_language);
    provider.setAwarenessUser({
      id: user.id,
      name: user.display_name,
      language: user.preferred_language,
      color: lang.accent,
      flag: lang.flag,
    });
  }, [user.id, user.display_name, user.preferred_language]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit,
        UnderlineExt,
        LanguageAttr,
        Collaboration.configure({ document: ydoc }),
        Placeholder.configure({
          placeholder:
            "Start writing… your collaborators will see it in their language.",
        }),
      ],
      editorProps: {
        attributes: {
          class: "document-editor-content",
          dir: "auto",
        },
      },
    },
    [documentId],
  );

  // Inline translation — modifies editor content directly
  useDocumentTranslation(editor, user.preferred_language, isTranslatedMode);

  if (!providerReady) {
    return (
      <div className="document-shell">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            color: "var(--color-text-2)",
            fontFamily: "var(--font-ui)",
          }}
        >
          Loading editor…
        </div>
      </div>
    );
  }

  return (
    <div className="document-shell">
      <DocumentToolbar
        title={title}
        onTitleChange={setTitle}
        documentId={documentId}
        isTranslatedMode={isTranslatedMode}
        onToggleTranslation={() => setIsTranslatedMode(!isTranslatedMode)}
        editor={editor}
        saveStatus={saveStatus}
      />

      <div className="document-body">
        <div className="document-main" style={{ position: "relative" }}>
          <EditorContent editor={editor} />
        </div>

        <CommentSidebar documentId={documentId} editor={editor} />
      </div>
    </div>
  );
}
