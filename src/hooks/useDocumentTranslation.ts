"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { translateText, getContentHash } from "@/lib/translation/client";
import type { ParagraphTranslation } from "@/types";

export function useDocumentTranslation(
  editor: Editor | null,
  targetLanguage: string,
  isTranslatedMode: boolean,
) {
  const [translations, setTranslations] = useState<
    Map<string, ParagraphTranslation>
  >(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const translateParagraph = useCallback(
    async (nodeId: string, text: string, sourceLang: string) => {
      if (!text.trim() || sourceLang === targetLanguage) return;

      const hash = await getContentHash(text);

      setTranslations((prev) => {
        const next = new Map(prev);
        next.set(nodeId, {
          nodeId,
          originalText: text,
          translatedText: prev.get(nodeId)?.translatedText ?? text,
          isTranslating: true,
        });
        return next;
      });

      try {
        const translated = await translateText(
          hash,
          text,
          sourceLang,
          targetLanguage,
        );

        setTranslations((prev) => {
          const next = new Map(prev);
          next.set(nodeId, {
            nodeId,
            originalText: text,
            translatedText: translated,
            isTranslating: false,
          });
          return next;
        });
      } catch {
        setTranslations((prev) => {
          const next = new Map(prev);
          next.set(nodeId, {
            nodeId,
            originalText: text,
            translatedText: text,
            isTranslating: false,
          });
          return next;
        });
      }
    },
    [targetLanguage],
  );

  useEffect(() => {
    if (!editor || !isTranslatedMode) return;

    const handleUpdate = () => {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== "paragraph" && node.type.name !== "heading")
          return;

        const text = node.textContent;
        if (!text.trim()) return;

        const nodeId = `node-${pos}`;
        const sourceLang =
          (node.attrs as Record<string, string>)?.language || "en";

        // Debounce per paragraph — wait 400ms after last change
        const existing = debounceTimers.current.get(nodeId);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
          translateParagraph(nodeId, text, sourceLang);
        }, 400);

        debounceTimers.current.set(nodeId, timer);
      });
    };

    editor.on("update", handleUpdate);
    // Translate initial content
    handleUpdate();

    return () => {
      editor.off("update", handleUpdate);
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, [editor, isTranslatedMode, translateParagraph]);

  return translations;
}
