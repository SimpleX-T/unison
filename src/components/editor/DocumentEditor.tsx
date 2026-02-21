"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExt from "@tiptap/extension-underline";
import * as Y from "yjs";
import { SupabaseProvider } from "@/lib/yjs/SupabaseProvider";
import { LanguageAttr } from "@/lib/tiptap/LanguageAttr";
import { useDocumentTranslation } from "@/hooks/useDocumentTranslation";
import { useDocumentSync } from "@/hooks/useDocumentSync";
import { DocumentToolbar } from "./DocumentToolbar";
import { CommentSidebar } from "./CommentSidebar";
import { MergePanel } from "./MergePanel";
import { InviteDocumentModal } from "@/components/modals/InviteDocumentModal";
import { useAppStore } from "@/store/useAppStore";
import { getLanguage } from "@/lib/languages";

interface DocumentEditorProps {
  documentId: string;
  initialTitle?: string;
  userId?: string;
  isOwner?: boolean;
  branchId?: string;
  documentLanguage?: string;
}

export function DocumentEditor({
  documentId,
  initialTitle = "Untitled",
  userId,
  isOwner = true,
  branchId,
  documentLanguage = "en",
}: DocumentEditorProps) {
  const user = useAppStore((s) => s.user);
  const [isTranslatedMode, setIsTranslatedMode] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [providerReady, setProviderReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [showMergePanel, setShowMergePanel] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingMergeCount, setPendingMergeCount] = useState(0);
  const [branchStatus, setBranchStatus] = useState<string>(
    branchId ? "active" : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainHasUpdates, setMainHasUpdates] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const providerRef = useRef<SupabaseProvider | null>(null);

  const ydoc = useMemo(() => new Y.Doc(), [documentId, branchId]);

  // Load pending merge count for owner (initial fetch + called on realtime events)
  const loadMergeCount = useCallback(async () => {
    if (!isOwner) return;
    try {
      const res = await fetch(`/api/documents/${documentId}/merge`);
      const data = await res.json();
      setPendingMergeCount(data.mergeRequests?.length ?? 0);
    } catch {
      /* ignore */
    }
  }, [documentId, isOwner]);

  useEffect(() => {
    loadMergeCount();
  }, [loadMergeCount]);

  // Realtime sync — replaces all polling
  const handleMainUpdated = useCallback(() => {
    setMainHasUpdates(true);
  }, []);

  const handleBranchStatusChanged = useCallback((status: string) => {
    setBranchStatus(status);
    if (status === "active") {
      setMainHasUpdates(false);
    }
  }, []);

  const handleMergeRequestChange = useCallback(() => {
    loadMergeCount();
  }, [loadMergeCount]);

  useDocumentSync({
    documentId,
    branchId,
    isOwner,
    onMainUpdated: handleMainUpdated,
    onBranchStatusChanged: handleBranchStatusChanged,
    onMergeRequestChange: handleMergeRequestChange,
  });

  // Autosave title to DB (debounced 1.5s) — owner only
  useEffect(() => {
    if (!userId || !isOwner || title === initialTitle) return;
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
  }, [title, documentId, userId, initialTitle, isOwner]);

  // Connect the Supabase provider (branch-aware)
  useEffect(() => {
    const provider = new SupabaseProvider(ydoc, documentId, branchId);
    providerRef.current = provider;
    setProviderReady(true);

    return () => {
      provider.destroy();
      ydoc.destroy();
      setProviderReady(false);
    };
  }, [ydoc, documentId, branchId]);

  // Update awareness
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

  const handleSubmitForReview = async () => {
    if (!branchId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", branchId }),
      });
      if (res.ok) {
        setBranchStatus("submitted");
      }
    } catch (err) {
      console.error("Submit failed:", err);
    }
    setIsSubmitting(false);
  };

  const handleSyncFromMain = async () => {
    if (!branchId) return;

    const confirmed = window.confirm(
      "Sync from main will merge the owner's latest changes into your branch. " +
        "Your edits will be preserved alongside the new changes.\n\n" +
        "Continue?",
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId }),
      });
      if (res.ok) {
        setMainHasUpdates(false);
        window.location.reload();
      }
    } catch (err) {
      console.error("Sync failed:", err);
    }
    setIsSyncing(false);
  };

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: branchStatus !== "submitted",
      extensions: [
        StarterKit,
        UnderlineExt,
        LanguageAttr,
        Collaboration.configure({ document: ydoc }),
        Placeholder.configure({
          placeholder: isOwner
            ? "Start writing… your collaborators will see it in their language."
            : "Edit in your language… submit for review when ready.",
        }),
      ],
      editorProps: {
        attributes: {
          class: "document-editor-content",
          dir: "auto",
        },
      },
    },
    [documentId, branchId, branchStatus],
  );

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
        onTitleChange={isOwner ? setTitle : () => {}}
        documentId={documentId}
        isTranslatedMode={isTranslatedMode}
        onToggleTranslation={() => setIsTranslatedMode(!isTranslatedMode)}
        editor={editor}
        saveStatus={saveStatus}
        isOwner={isOwner}
        branchId={branchId}
        branchStatus={branchStatus}
        pendingMergeCount={pendingMergeCount}
        onToggleMergePanel={() => setShowMergePanel(!showMergePanel)}
        onInviteClick={() => setShowInviteModal(true)}
        onSubmitForReview={handleSubmitForReview}
        isSubmitting={isSubmitting}
        mainHasUpdates={mainHasUpdates}
        onSyncFromMain={handleSyncFromMain}
        isSyncing={isSyncing}
      />

      <div className="document-body">
        <div className="document-main" style={{ position: "relative" }}>
          <EditorContent editor={editor} />
        </div>

        {isOwner && showMergePanel ? (
          <MergePanel
            documentId={documentId}
            documentLanguage={documentLanguage}
            onMergeComplete={loadMergeCount}
          />
        ) : (
          <CommentSidebar documentId={documentId} editor={editor} />
        )}
      </div>

      {showInviteModal && (
        <InviteDocumentModal
          documentId={documentId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
