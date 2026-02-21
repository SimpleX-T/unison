"use client";
import { useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { translateBatch } from "@/lib/translation/client";

/**
 * Inline document translation hook with back-translation.
 *
 * Architecture:
 *   Yjs  ←→  TipTap  ←→  User sees their language
 *            └─ `lang` = original language (source of truth in Yjs)
 *            └─ `sourceLang` = set when we're DISPLAYING a translation
 *
 * Flow when "Your Language" is ON:
 * 1. Scan for nodes where `lang !== userLanguage`
 * 2. Translate them → display in user's language
 * 3. Set `sourceLang = original lang`, `lang = userLanguage`
 *
 * When user edits a translated paragraph:
 * 4. Detect edit on node with `sourceLang` set
 * 5. Back-translate → original language
 * 6. Write back-translated text + `lang = sourceLang`, clear `sourceLang`
 * 7. Translation hook picks it up → re-translates for display (step 1-3)
 *
 * Result: Yjs always stores the original language.
 */
export function useDocumentTranslation(
  editor: Editor | null,
  userLanguage: string,
  isTranslatedMode: boolean,
) {
  const isTranslating = useRef(false);
  const isBackTranslating = useRef(false);
  const translateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backTranslateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── FORWARD: Translate foreign nodes for display ──
  const translateForeignNodes = useCallback(async () => {
    if (!editor || editor.isDestroyed || isTranslating.current) return;

    const nodesToTranslate: {
      pos: number;
      text: string;
      lang: string;
      nodeType: string;
    }[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== "paragraph" && node.type.name !== "heading")
        return;
      const text = node.textContent;
      if (!text.trim()) return;

      const nodeLang = (node.attrs.lang as string) || "en";
      if (nodeLang === userLanguage) return; // Already in user's language
      // If sourceLang is set, it's already displayed translated — skip
      if (node.attrs.sourceLang) return;

      nodesToTranslate.push({
        pos,
        text,
        lang: nodeLang,
        nodeType: node.type.name,
      });
    });

    if (nodesToTranslate.length === 0) return;

    isTranslating.current = true;

    try {
      const sourceLang = nodesToTranslate[0].lang;
      const translated = await translateBatch(
        nodesToTranslate.map((n) => n.text),
        sourceLang,
        userLanguage,
      );

      if (!editor || editor.isDestroyed) return;

      // Replace in reverse order (preserves positions)
      const items = nodesToTranslate
        .map((n, i) => ({ ...n, translated: translated[i] }))
        .filter((n) => n.translated)
        .sort((a, b) => b.pos - a.pos);

      for (const item of items) {
        if (editor.isDestroyed) break;
        try {
          const currentNode = editor.state.doc.nodeAt(item.pos);
          if (!currentNode || currentNode.type.name !== item.nodeType) continue;

          const newNode = currentNode.type.create(
            {
              ...currentNode.attrs,
              sourceLang: item.lang, // Remember original language
              lang: userLanguage, // Now displaying user's language
            },
            item.translated
              ? editor.state.schema.text(item.translated)
              : undefined,
          );

          const tr = editor.state.tr;
          tr.replaceWith(item.pos, item.pos + currentNode.nodeSize, newNode);
          tr.setMeta("inlineTranslation", true);
          tr.setMeta("addToHistory", false);
          editor.view.dispatch(tr);
        } catch (err) {
          console.warn("[translate] failed at pos", item.pos, err);
        }
      }
    } catch (err) {
      console.error("[translate] batch failed:", err);
    } finally {
      isTranslating.current = false;
    }
  }, [editor, userLanguage]);

  // ── BACK-TRANSLATE: When user edits a translated paragraph ──
  const backTranslateEditedNodes = useCallback(async () => {
    if (!editor || editor.isDestroyed || isBackTranslating.current) return;

    // Find nodes that have sourceLang set (meaning they were display-translated)
    // AND whose content may have been edited by the user
    const nodesToBackTranslate: {
      pos: number;
      text: string;
      sourceLang: string;
      nodeType: string;
    }[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== "paragraph" && node.type.name !== "heading")
        return;
      const text = node.textContent;
      if (!text.trim()) return;

      // sourceLang being set means this paragraph was translated for display
      const origLang = node.attrs.sourceLang as string;
      if (!origLang) return;

      nodesToBackTranslate.push({
        pos,
        text,
        sourceLang: origLang,
        nodeType: node.type.name,
      });
    });

    if (nodesToBackTranslate.length === 0) return;

    isBackTranslating.current = true;

    try {
      // Back-translate from userLanguage → sourceLang (original)
      const origLang = nodesToBackTranslate[0].sourceLang;
      const backTranslated = await translateBatch(
        nodesToBackTranslate.map((n) => n.text),
        userLanguage,
        origLang,
      );

      if (!editor || editor.isDestroyed) return;

      // Replace in reverse order
      const items = nodesToBackTranslate
        .map((n, i) => ({ ...n, backTranslated: backTranslated[i] }))
        .filter((n) => n.backTranslated)
        .sort((a, b) => b.pos - a.pos);

      for (const item of items) {
        if (editor.isDestroyed) break;
        try {
          const currentNode = editor.state.doc.nodeAt(item.pos);
          if (!currentNode || currentNode.type.name !== item.nodeType) continue;

          // Write back in original language, clear sourceLang
          const newNode = currentNode.type.create(
            {
              ...currentNode.attrs,
              lang: item.sourceLang, // Back to original language
              sourceLang: null, // Clear — it's now in original form
            },
            item.backTranslated
              ? editor.state.schema.text(item.backTranslated)
              : undefined,
          );

          const tr = editor.state.tr;
          tr.replaceWith(item.pos, item.pos + currentNode.nodeSize, newNode);
          tr.setMeta("inlineTranslation", true);
          tr.setMeta("addToHistory", false);
          editor.view.dispatch(tr);
        } catch (err) {
          console.warn("[backTranslate] failed at pos", item.pos, err);
        }
      }

      // After back-translating to original, immediately re-translate for display
      // (translateForeignNodes will pick up lang ≠ userLanguage and translate again)
      isTranslating.current = false; // Reset guard
      await translateForeignNodes();
    } catch (err) {
      console.error("[backTranslate] batch failed:", err);
    } finally {
      isBackTranslating.current = false;
    }
  }, [editor, userLanguage, translateForeignNodes]);

  // ── Trigger forward translation on toggle or remote updates ──
  useEffect(() => {
    if (!editor || !isTranslatedMode) return;

    translateForeignNodes();

    const handleUpdate = () => {
      if (translateTimer.current) clearTimeout(translateTimer.current);
      translateTimer.current = setTimeout(() => {
        translateForeignNodes();
      }, 800);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (translateTimer.current) clearTimeout(translateTimer.current);
    };
  }, [editor, isTranslatedMode, translateForeignNodes]);

  // ── Trigger back-translation on user edits in translated mode ──
  useEffect(() => {
    if (!editor || !isTranslatedMode) return;

    const handleTransaction = ({
      transaction,
    }: {
      transaction: { docChanged: boolean; getMeta: (key: string) => unknown };
    }) => {
      // Only respond to user-initiated changes
      if (!transaction.docChanged || transaction.getMeta("inlineTranslation")) {
        return;
      }

      // Debounce back-translation (wait for user to pause typing)
      if (backTranslateTimer.current) clearTimeout(backTranslateTimer.current);
      backTranslateTimer.current = setTimeout(() => {
        backTranslateEditedNodes();
      }, 1500); // Slightly longer debounce — user needs to finish typing
    };

    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
      if (backTranslateTimer.current) clearTimeout(backTranslateTimer.current);
    };
  }, [editor, isTranslatedMode, backTranslateEditedNodes]);

  // ── Clean up on toggle OFF: back-translate any remaining translated nodes ──
  useEffect(() => {
    if (!editor || isTranslatedMode) return;

    // When the user turns off translated mode, ensure everything is in original language
    const cleanup = async () => {
      const hasTranslated = (() => {
        let found = false;
        editor.state.doc.descendants((node) => {
          if (node.attrs.sourceLang) found = true;
        });
        return found;
      })();

      if (hasTranslated) {
        await backTranslateEditedNodes();
      }
    };

    cleanup();
  }, [editor, isTranslatedMode, backTranslateEditedNodes]);
}
