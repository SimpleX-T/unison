"use client";
import { useEffect, useCallback, useRef } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import { createClient } from "@/lib/supabase/client";

interface WhiteboardEditorProps {
  whiteboardId: string;
  initialSnapshot: any | null;
}

export function WhiteboardEditor({
  whiteboardId,
  initialSnapshot,
}: WhiteboardEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  const persist = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor || !dirtyRef.current) return;
    try {
      const snapshot = getSnapshot(editor.store);
      const supabase = createClient();
      await supabase
        .from("whiteboards")
        .update({ tldraw_state: snapshot })
        .eq("id", whiteboardId);
      dirtyRef.current = false;
    } catch (err) {
      console.warn("Whiteboard persist failed:", err);
    }
  }, [whiteboardId]);

  const debouncedPersist = useCallback(() => {
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => persist(), 2000);
  }, [persist]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
      if (dirtyRef.current) persist();
    };
  }, [persist]);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Load initial snapshot if available
      if (initialSnapshot) {
        try {
          loadSnapshot(editor.store, initialSnapshot);
        } catch (err) {
          console.warn("Could not load whiteboard snapshot:", err);
        }
      }

      // Listen for changes
      const unsub = editor.store.listen(
        () => {
          dirtyRef.current = true;
          debouncedPersist();
        },
        { scope: "document", source: "user" },
      );

      return () => {
        unsub();
      };
    },
    [initialSnapshot, debouncedPersist],
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Tldraw onMount={handleMount} />
    </div>
  );
}
