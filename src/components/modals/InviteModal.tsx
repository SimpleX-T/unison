"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, Link2 } from "lucide-react";

interface InviteModalProps {
  onClose: () => void;
}

export function InviteModal({ onClose }: InviteModalProps) {
  const workspaceId = useAppStore((s) => s.workspace?.id);
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const fetchToken = async () => {
      setLoading(true);
      const res = await fetch(
        `/api/workspace/invite?workspaceId=${workspaceId}`,
      );
      const { token } = await res.json();
      const url = `${window.location.origin}/join/${token}`;
      setInviteUrl(url);
      setLoading(false);
    };
    fetchToken();
  }, [workspaceId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 8 }}>
          Invite People
        </h2>
        <p
          style={{
            color: "var(--color-text-2)",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          Share this link with your teammates. Anyone with the link can join
          this workspace.
        </p>

        {loading ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "var(--color-text-2)",
            }}
          >
            Generating link…
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "var(--color-bg-2)",
              borderRadius: 8,
              padding: "10px 14px",
            }}
          >
            <Link2
              size={16}
              style={{ color: "var(--color-sage)", flexShrink: 0 }}
            />
            <input
              readOnly
              value={inviteUrl}
              className="input"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: 13,
                padding: 0,
              }}
              onFocus={(e) => e.target.select()}
            />
            <button
              className="btn btn-sage btn-sm"
              onClick={handleCopy}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}
        >
          <button className="btn btn-ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
