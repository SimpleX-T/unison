"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/store/useAppStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { TranslationShimmer } from "@/components/ui/TranslationShimmer";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface Comment {
  id: string;
  content: string;
  original_language: string;
  paragraph_id: string | null;
  resolved: boolean;
  created_at: string;
  author: {
    display_name: string;
    preferred_language: string;
    avatar_url: string | null;
  };
}

function CommentItem({ comment }: { comment: Comment }) {
  const { translated, isLoading, isTranslated } = useTranslation(
    comment.id,
    comment.content,
    comment.original_language,
  );

  const timeAgo = getTimeAgo(comment.created_at);

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
          {timeAgo}
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const user = useAppStore((s) => s.user);

  // Fetch comments from DB
  const loadComments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("document_comments")
      .select(
        `
        id,
        content,
        original_language,
        paragraph_id,
        resolved,
        created_at,
        profiles!author_id (
          display_name,
          preferred_language,
          avatar_url
        )
      `,
      )
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (data) {
      setComments(
        data.map((row: any) => ({
          id: row.id,
          content: row.content,
          original_language: row.original_language,
          paragraph_id: row.paragraph_id,
          resolved: row.resolved,
          created_at: row.created_at,
          author: row.profiles,
        })),
      );
    }
  }, [documentId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Send new comment
  const handleSend = async () => {
    if (!newComment.trim() || !user.id) return;
    setSending(true);

    const supabase = createClient();
    const { error } = await supabase.from("document_comments").insert({
      document_id: documentId,
      author_id: user.id,
      content: newComment.trim(),
      original_language: user.preferred_language,
    });

    if (!error) {
      setNewComment("");
      await loadComments();
    }
    setSending(false);
  };

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
            {comments.length}
          </span>
        </div>
      </div>

      {comments.length === 0 && (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--color-text-2)",
            fontSize: "13px",
          }}
        >
          No comments yet. Start the conversation.
        </div>
      )}

      {comments.map((comment) => (
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
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="btn btn-sage btn-sm"
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              padding: "4px 10px",
            }}
            onClick={handleSend}
            disabled={sending || !newComment.trim()}
          >
            {sending ? (
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}
