"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import {
  Search,
  UserPlus,
  X,
  Loader2,
  Check,
  Shield,
  Pencil,
  Eye,
} from "lucide-react";
import { useUITranslation } from "@/hooks/useUITranslation";

interface InviteDocumentModalProps {
  documentId: string;
  onClose: () => void;
}

interface WorkspaceMember {
  user_id: string;
  profile: {
    id: string;
    display_name: string;
    username: string;
    preferred_language: string;
    avatar_url: string | null;
  };
}

interface Collaborator {
  user_id: string;
  role: "editor" | "viewer";
  user: {
    id: string;
    display_name: string;
    username: string;
    preferred_language: string;
    avatar_url: string | null;
  };
}

export function InviteDocumentModal({
  documentId,
  onClose,
}: InviteDocumentModalProps) {
  const workspace = useAppStore((s) => s.workspace);
  const user = useAppStore((s) => s.user);
  const { t } = useUITranslation();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    const supabase = createClient();

    const [membersRes, collabRes] = await Promise.all([
      supabase
        .from("workspace_members")
        .select(
          `
          user_id,
          profiles!user_id (
            id,
            display_name,
            username,
            preferred_language,
            avatar_url
          )
        `,
        )
        .eq("workspace_id", workspace.id),
      fetch(`/api/documents/${documentId}/invite`).then((r) => r.json()),
    ]);

    const allMembers =
      membersRes.data?.map((m: any) => ({
        user_id: m.user_id,
        profile: m.profiles,
      })) ?? [];

    // Exclude current user (owner) from the invite list
    setMembers(allMembers.filter((m: WorkspaceMember) => m.user_id !== user.id));
    setCollaborators(collabRes.collaborators ?? []);
    setLoading(false);
  }, [workspace?.id, documentId, user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isInvited = (userId: string) =>
    collaborators.some((c) => c.user_id === userId);

  const handleInvite = async (
    memberId: string,
    role: "editor" | "viewer",
  ) => {
    setInviting(memberId);
    try {
      await fetch(`/api/documents/${documentId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId, role }),
      });
      await loadData();
    } catch (err) {
      console.error("Invite failed:", err);
    }
    setInviting(null);
  };

  const handleRevoke = async (memberId: string) => {
    setRevoking(memberId);
    try {
      await fetch(`/api/documents/${documentId}/invite`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });
      await loadData();
    } catch (err) {
      console.error("Revoke failed:", err);
    }
    setRevoking(null);
  };

  const filtered = members.filter(
    (m) =>
      m.profile.display_name.toLowerCase().includes(search.toLowerCase()) ||
      m.profile.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              margin: 0,
              fontSize: "20px",
            }}
          >
            {t("doc.shareDocument")}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--color-text-2)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            position: "relative",
            marginBottom: 16,
          }}
        >
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-2)",
            }}
          />
          <input
            className="input"
            placeholder={t("doc.searchMembers")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: 34,
              width: "100%",
              fontSize: 13,
            }}
          />
        </div>

        {/* Current collaborators */}
        {collaborators.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                color: "var(--color-text-2)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              {t("doc.currentCollaborators")}
            </div>
            {collaborators.map((c) => (
              <div
                key={c.user_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid var(--color-bg-2)",
                }}
              >
                <UserAvatar
                  name={c.user.display_name}
                  languageCode={c.user.preferred_language}
                  size="sm"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontFamily: "var(--font-ui)",
                      fontWeight: 500,
                    }}
                  >
                    {c.user.display_name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-2)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    @{c.user.username}
                  </div>
                </div>
                <LanguageBadge
                  languageCode={c.user.preferred_language}
                  showName={false}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-ui)",
                    color: "var(--color-text-2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {c.role === "editor" ? (
                    <Pencil size={11} />
                  ) : (
                    <Eye size={11} />
                  )}
                  {c.role === "editor" ? t("common.editor") : t("common.viewer")}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: "var(--color-rust)",
                  }}
                  onClick={() => handleRevoke(c.user_id)}
                  disabled={revoking === c.user_id}
                >
                  {revoking === c.user_id ? (
                    <Loader2
                      size={12}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    t("common.remove")
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Available members */}
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            color: "var(--color-text-2)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          {t("doc.workspaceMembers")}
        </div>

        {loading ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "var(--color-text-2)",
              fontSize: 13,
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
            {t("common.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "var(--color-text-2)",
              fontSize: 13,
            }}
          >
            {search
              ? t("doc.noMembersMatch")
              : t("doc.noOtherMembers")}
          </div>
        ) : (
          <div
            style={{
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            {filtered.map((m) => {
              const invited = isInvited(m.user_id);
              return (
                <div
                  key={m.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--color-bg-2)",
                  }}
                >
                  <UserAvatar
                    name={m.profile.display_name}
                    languageCode={m.profile.preferred_language}
                    size="sm"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontFamily: "var(--font-ui)",
                        fontWeight: 500,
                      }}
                    >
                      {m.profile.display_name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-2)",
                        fontFamily: "var(--font-ui)",
                      }}
                    >
                      @{m.profile.username}
                    </div>
                  </div>
                  <LanguageBadge
                    languageCode={m.profile.preferred_language}
                    showName={false}
                  />
                  {invited ? (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-sage)",
                        fontFamily: "var(--font-ui)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Check size={13} />
                      {t("doc.invited")}
                    </span>
                  ) : (
                    <button
                      className="btn btn-sage btn-sm"
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      onClick={() => handleInvite(m.user_id, "editor")}
                      disabled={inviting === m.user_id}
                    >
                      {inviting === m.user_id ? (
                        <Loader2
                          size={12}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : (
                        <>
                          <UserPlus size={12} />
                          {t("common.invite")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button className="btn btn-ghost" onClick={onClose}>
            {t("common.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
