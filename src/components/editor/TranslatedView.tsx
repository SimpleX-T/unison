"use client";
import type { Editor } from "@tiptap/react";
import type { ParagraphTranslation } from "@/types";
import { TranslationShimmer } from "@/components/ui/TranslationShimmer";

interface TranslatedViewProps {
  editor: Editor | null;
  translations: Map<string, ParagraphTranslation>;
  userLanguage: string;
}

export function TranslatedView({
  editor,
  translations,
  userLanguage,
}: TranslatedViewProps) {
  if (!editor) return null;

  const paragraphs: {
    nodeId: string;
    text: string;
    type: string;
    level?: number;
  }[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "paragraph" || node.type.name === "heading") {
      paragraphs.push({
        nodeId: `node-${pos}`,
        text: node.textContent,
        type: node.type.name,
        level: node.attrs?.level,
      });
    }
  });

  if (paragraphs.length === 0) {
    return (
      <div className="document-editor-content">
        <p style={{ color: "var(--color-text-2)", fontStyle: "italic" }}>
          Start writing… your collaborators will see it in their language.
        </p>
      </div>
    );
  }

  return (
    <div className="document-editor-content">
      {paragraphs.map((para) => {
        const translation = translations.get(para.nodeId);
        const displayText = translation?.translatedText || para.text;
        const isTranslating = translation?.isTranslating ?? false;

        if (!para.text.trim()) {
          return (
            <p key={para.nodeId} style={{ height: "1.8em" }}>
              &nbsp;
            </p>
          );
        }

        const renderContent = () => {
          if (isTranslating && !translation?.translatedText) {
            return <TranslationShimmer lines={1} />;
          }
          if (para.type === "heading") {
            if (para.level === 1) return <h1>{displayText}</h1>;
            if (para.level === 2) return <h2>{displayText}</h2>;
            if (para.level === 3) return <h3>{displayText}</h3>;
            return <h4>{displayText}</h4>;
          }
          return <p>{displayText}</p>;
        };

        return (
          <div
            key={para.nodeId}
            className={`translated-paragraph ${isTranslating ? "is-translating" : ""}`}
            title={`Original: ${para.text}`}
          >
            {renderContent()}
          </div>
        );
      })}
    </div>
  );
}
