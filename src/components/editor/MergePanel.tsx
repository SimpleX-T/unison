"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import {
  GitMerge,
  X,
  Check,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import * as Y from "yjs";

interface MergeRequestItem {
  id: string;
  branch_id: string;
  document_id: string;
  status: string;
  created_at: string;
  branch: {
    id: string;
    name: string;
    language: string;
    yjs_state: number[] | null;
    owner: {
      id: string;
      display_name: string;
      preferred_language: string;
      avatar_url: string | null;
    };
  };
}

interface MergePanelProps {
  documentId: string;
  documentLanguage: string;
  onMergeComplete?: () => void;
}

function extractTextFromYjs(yjsState: number[] | null): string {
  if (!yjsState || yjsState.length === 0) return "";
  try {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, new Uint8Array(yjsState));
    const xmlFragment = doc.getXmlFragment("default");
    return xmlFragment.toString();
  } catch {
    return "(Unable to preview content)";
  }
}

/**
 * Walk a Y.XmlFragment, collect text from each block node,
 * batch-translate, and write the translations back in place.
 * Returns the updated Yjs state as a number array.
 */
async function translateYjsState(
  yjsState: number[],
  fromLanguage: string,
  toLanguage: string,
): Promise<number[]> {
  if (fromLanguage === toLanguage) return yjsState;

  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(yjsState));
  const fragment = doc.getXmlFragment("default");
  const children = fragment.toArray();

  // Collect text from each block-level element
  const blocks: { index: number; text: string }[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof Y.XmlElement) {
      const text = extractXmlElementText(child);
      if (text.trim()) {
        blocks.push({ index: i, text });
      }
    }
  }

  if (blocks.length === 0) return yjsState;

  // Batch translate all block texts
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: blocks.map((b) => b.text),
      fromLanguage,
      toLanguage,
    }),
  });
  const data = await res.json();
  const translated: string[] = data.translated ?? blocks.map((b) => b.text);

  // Build a fresh Y.Doc with translated content preserving structure
  const newDoc = new Y.Doc();
  const newFragment = newDoc.getXmlFragment("default");

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof Y.XmlElement) {
      const blockIdx = blocks.findIndex((b) => b.index === i);
      const newElement = new Y.XmlElement(child.nodeName);

      // Copy attributes but fix language
      const attrs = child.getAttributes();
      for (const key of Object.keys(attrs)) {
        if (key === "sourceLang") continue;
        if (key === "lang") {
          newElement.setAttribute("lang", toLanguage);
        } else {
          newElement.setAttribute(key, attrs[key] as string);
        }
      }
      if (!attrs["lang"]) {
        newElement.setAttribute("lang", toLanguage);
      }

      const translatedText =
        blockIdx >= 0 ? translated[blockIdx] : extractXmlElementText(child);
      newElement.insert(0, [new Y.XmlText(translatedText)]);
      newFragment.push([newElement]);
    } else if (child instanceof Y.XmlText) {
      newFragment.push([new Y.XmlText(child.toString())]);
    }
  }

  return Array.from(Y.encodeStateAsUpdate(newDoc));
}

function extractXmlElementText(element: Y.XmlElement): string {
  let text = "";
  for (const child of element.toArray()) {
    if (child instanceof Y.XmlText) {
      text += child.toString();
    } else if (child instanceof Y.XmlElement) {
      text += extractXmlElementText(child);
    }
  }
  return text;
}

function MergeRequestCard({
  mr,
  documentLanguage,
  onAction,
}: {
  mr: MergeRequestItem;
  documentLanguage: string;
  onAction: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [translatedPreview, setTranslatedPreview] = useState<string | null>(
    null,
  );
  const [translating, setTranslating] = useState(false);
  const [acting, setActing] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const branchContent = extractTextFromYjs(mr.branch.yjs_state);

  const handleTranslatePreview = async () => {
    if (translatedPreview || mr.branch.language === documentLanguage) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: branchContent,
          fromLanguage: mr.branch.language,
          toLanguage: documentLanguage,
        }),
      });
      const data = await res.json();
      setTranslatedPreview(data.translated);
    } catch {
      setTranslatedPreview("(Translation failed)");
    }
    setTranslating(false);
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await fetch(`/api/documents/${mr.document_id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          mergeRequestId: mr.id,
        }),
      });

      if (mr.branch.yjs_state) {
        // Translate the branch Yjs tree to the document language, then save as main
        const translatedState = await translateYjsState(
          mr.branch.yjs_state,
          mr.branch.language,
          documentLanguage,
        );

        const supabase = createClient();
        await supabase
          .from("documents")
          .update({
            yjs_state: translatedState,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mr.document_id);
      }

      onAction();
    } catch (err) {
      console.error("Merge failed:", err);
    }
    setActing(false);
  };

  const handleReject = async () => {
    setActing(true);
    try {
      await fetch(`/api/documents/${mr.document_id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          mergeRequestId: mr.id,
          note: rejectNote || undefined,
        }),
      });
      onAction();
    } catch (err) {
      console.error("Reject failed:", err);
    }
    setActing(false);
  };

  const timeAgo = getTimeAgo(mr.created_at);

  return (
    <div className="merge-request-card">
      <button
        className="merge-request-header"
        onClick={() => {
          setExpanded(!expanded);
          if (!expanded) handleTranslatePreview();
        }}
      >
        <UserAvatar
          name={mr.branch.owner.display_name}
          languageCode={mr.branch.owner.preferred_language}
          size="sm"
        />
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div
            style={{
              fontWeight: 500,
              fontSize: "13px",
              fontFamily: "var(--font-ui)",
            }}
          >
            {mr.branch.name}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-text-2)",
              fontFamily: "var(--font-ui)",
            }}
          >
            {mr.branch.owner.display_name} &middot; {timeAgo}
          </div>
        </div>
        <LanguageBadge languageCode={mr.branch.language} showName={false} />
        <ChevronRight
          size={14}
          style={{
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 0.15s ease",
            color: "var(--color-text-2)",
          }}
        />
      </button>

      {expanded && (
        <div className="merge-request-body">
          <div className="merge-preview-label">
            {mr.branch.language !== documentLanguage
              ? "Translated Preview"
              : "Content Preview"}
          </div>
          <div className="merge-preview-content">
            {translating ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--color-text-2)",
                  fontSize: "13px",
                }}
              >
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Translating preview...
              </div>
            ) : (
              <div
                style={{ fontSize: "13px", fontFamily: "var(--font-body)" }}
                dangerouslySetInnerHTML={{
                  __html: translatedPreview || branchContent || "(Empty)",
                }}
              />
            )}
          </div>

          {showRejectInput ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <button
                  onClick={() => setShowRejectInput(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--color-text-2)",
                  }}
                >
                  <ArrowLeft size={14} />
                </button>
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                  }}
                >
                  Rejection note (optional)
                </span>
              </div>
              <textarea
                className="input"
                placeholder="Explain why you're sending it back..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                style={{ fontSize: "13px", resize: "none" }}
              />
              <button
                className="btn btn-sm"
                style={{
                  background: "var(--color-rust)",
                  color: "#fff",
                  border: "none",
                }}
                onClick={handleReject}
                disabled={acting}
              >
                {acting ? (
                  <Loader2
                    size={13}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  "Confirm Reject"
                )}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-sage btn-sm"
                style={{ flex: 1 }}
                onClick={handleApprove}
                disabled={acting || translating}
              >
                {acting ? (
                  <Loader2
                    size={13}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <>
                    <Check size={13} />
                    Merge
                  </>
                )}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{
                  flex: 1,
                  color: "var(--color-rust)",
                  borderColor: "var(--color-rust)",
                }}
                onClick={() => setShowRejectInput(true)}
                disabled={acting}
              >
                <X size={13} />
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MergePanel({
  documentId,
  documentLanguage,
  onMergeComplete,
}: MergePanelProps) {
  const [mergeRequests, setMergeRequests] = useState<MergeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMergeRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/merge`);
      const data = await res.json();
      setMergeRequests(data.mergeRequests ?? []);
    } catch (err) {
      console.error("Failed to load merge requests:", err);
    }
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    loadMergeRequests();
  }, [loadMergeRequests]);

  const handleAction = () => {
    loadMergeRequests();
    onMergeComplete?.();
  };

  return (
    <div className="merge-panel">
      <div className="merge-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GitMerge size={16} />
          <span>Merge Requests</span>
          {mergeRequests.length > 0 && (
            <span
              style={{
                background: "var(--color-sage)",
                color: "#fff",
                padding: "1px 8px",
                borderRadius: "10px",
                fontSize: "11px",
                fontFamily: "var(--font-ui)",
              }}
            >
              {mergeRequests.length}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--color-text-2)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Loader2
            size={14}
            style={{ animation: "spin 1s linear infinite" }}
          />
          Loading...
        </div>
      ) : mergeRequests.length === 0 ? (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--color-text-2)",
            fontSize: "13px",
          }}
        >
          No pending merge requests.
        </div>
      ) : (
        mergeRequests.map((mr) => (
          <MergeRequestCard
            key={mr.id}
            mr={mr}
            documentLanguage={documentLanguage}
            onAction={handleAction}
          />
        ))
      )}
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
