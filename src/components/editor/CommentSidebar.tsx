"use client";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/store/useAppStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { TranslationShimmer } from "@/components/ui/TranslationShimmer";
import { MessageSquare, Send } from "lucide-react";
import type { Editor } from "@tiptap/react";

// Demo comments
const DEMO_COMMENTS = [
  {
    id: "c1",
    author: { display_name: "Yuki Tanaka", preferred_language: "ja" },
    content:
      "この仕様書はとても良くまとまっています。第3セクションにもう少し詳細を追加できますか？",
    original_language: "ja",
    created_at: "5 minutes ago",
  },
  {
    id: "c2",
    author: { display_name: "Maria Silva", preferred_language: "pt" },
    content:
      "Concordo com a Yuki. Também precisamos discutir a integração da API.",
    original_language: "pt",
    created_at: "3 minutes ago",
  },
];

interface CommentItemProps {
  comment: (typeof DEMO_COMMENTS)[0];
}

function CommentItem({ comment }: CommentItemProps) {
  const { translated, isLoading, isTranslated } = useTranslation(
    comment.id,
    comment.content,
    comment.original_language,
  );

  return (
    <div className="comment-item">
      <div className="comment-author">
        <UserAvatar
          name={comment.author.display_name}
          languageCode={comment.author.preferred_language}
          size="sm"
        />
        <span>{comment.author.display_name}</span>
        <LanguageBadge
          languageCode={comment.original_language}
          showName={false}
        />
        <span
          style={{
            color: "var(--color-text-2)",
            fontSize: "11px",
            marginLeft: "auto",
          }}
        >
          {comment.created_at}
        </span>
      </div>
      {isLoading ? (
        <TranslationShimmer lines={2} />
      ) : (
        <div className="comment-text">
          {translated}
          {isTranslated && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--color-text-2)",
                marginTop: "6px",
                fontStyle: "italic",
              }}
            >
              Translated from {comment.original_language.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentSidebar({
  documentId,
  editor,
}: {
  documentId: string;
  editor: Editor | null;
}) {
  const [newComment, setNewComment] = useState("");
  const user = useAppStore((s) => s.user);

  return (
    <div className="comment-sidebar">
      <div className="comment-sidebar-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare size={16} />
          <span>Comments</span>
          <span
            style={{
              background: "var(--color-bg-2)",
              padding: "1px 8px",
              borderRadius: "10px",
              fontSize: "11px",
              color: "var(--color-text-2)",
            }}
          >
            {DEMO_COMMENTS.length}
          </span>
        </div>
      </div>

      {DEMO_COMMENTS.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}

      <div className="comment-input-area">
        <div style={{ position: "relative" }}>
          <textarea
            className="comment-input"
            placeholder={`Comment in ${user.preferred_language.toUpperCase()}…`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <button
            className="btn btn-sage btn-sm"
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              padding: "4px 10px",
            }}
            onClick={() => setNewComment("")}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
