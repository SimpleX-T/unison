"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import * as Y from "yjs";
import { SupabaseProvider } from "@/lib/yjs/SupabaseProvider";
import { useDocumentTranslation } from "@/hooks/useDocumentTranslation";
import { DocumentToolbar } from "./DocumentToolbar";
import { TranslatedView } from "./TranslatedView";
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
  const providerRef = useRef<SupabaseProvider | null>(null);

  // Create Y.Doc only once per documentId (stable reference)
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);

  // Autosave title to DB (debounced 1.5s)
  useEffect(() => {
    if (!userId || title === initialTitle) return;
    const timer = setTimeout(async () => {
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
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, documentId, userId, initialTitle]);

  // Connect the Supabase provider — only depends on ydoc + documentId
  // NOT on user.preferred_language (that would destroy the doc on language change)
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

  // Update awareness separately — this runs when user or language changes
  // without tearing down the Yjs doc
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

  const translations = useDocumentTranslation(
    editor,
    user.preferred_language,
    isTranslatedMode,
  );

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
      />

      <div className="document-body">
        <div className="document-main">
          {isTranslatedMode ? (
            <TranslatedView
              editor={editor}
              translations={translations}
              userLanguage={user.preferred_language}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>

        <CommentSidebar documentId={documentId} editor={editor} />
      </div>
    </div>
  );
}
