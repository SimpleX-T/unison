"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, Plus, Users } from "lucide-react";

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_by: string;
  role: string;
  member_count?: number;
}

export function WorkspaceSwitcher() {
  const router = useRouter();
  const workspace = useAppStore((s) => s.workspace);
  const user = useAppStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadWorkspaces = useCallback(async () => {
    if (!user.id) return;
    setLoading(true);
    const supabase = createClient();

    const { data: memberships } = await supabase
      .from("workspace_members")
      .select(
        "role, workspace_id, workspaces(id, name, slug, logo_url, created_by)",
      )
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true });

    if (!memberships) {
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: WorkspaceItem[] = memberships.map((m: any) => ({
      ...m.workspaces,
      role: m.role,
    }));

    const ownerWorkspaces = items.filter((w) => w.role === "owner");
    if (ownerWorkspaces.length > 0) {
      const counts = await Promise.all(
        ownerWorkspaces.map(async (w) => {
          const { count } = await supabase
            .from("workspace_members")
            .select("user_id", { count: "exact", head: true })
            .eq("workspace_id", w.id);
          return { id: w.id, count: count ?? 0 };
        }),
      );

      for (const c of counts) {
        const ws = items.find((w) => w.id === c.id);
        if (ws) ws.member_count = c.count;
      }
    }

    setWorkspaces(items);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    if (open) loadWorkspaces();
  }, [open, loadWorkspaces]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSwitch = (slug: string) => {
    setOpen(false);
    router.push(`/workspace/${slug}`);
  };

  const initial = (workspace?.name || "W").charAt(0).toUpperCase();

  return (
    <div className="ws-switcher" ref={dropdownRef}>
      <button
        className="ws-switcher-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="ws-switcher-avatar">{initial}</span>
        <div className="ws-switcher-info">
          <span className="ws-switcher-name">
            {workspace?.name || "Workspace"}
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{
            marginLeft: "auto",
            color: "var(--color-text-2)",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "none",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div className="ws-switcher-dropdown">
          <div className="ws-switcher-dropdown-label">Workspaces</div>

          {loading ? (
            <div className="ws-switcher-empty">Loading...</div>
          ) : workspaces.length === 0 ? (
            <div className="ws-switcher-empty">No workspaces found</div>
          ) : (
            workspaces.map((ws) => {
              const isActive = ws.id === workspace?.id;
              return (
                <button
                  key={ws.id}
                  className={`ws-switcher-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSwitch(ws.slug)}
                >
                  <span className="ws-switcher-item-avatar">
                    {ws.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="ws-switcher-item-info">
                    <span className="ws-switcher-item-name">{ws.name}</span>
                    <span className="ws-switcher-item-meta">
                      {ws.role === "owner" ? "Owner" : ws.role === "admin" ? "Admin" : "Member"}
                      {ws.role === "owner" && ws.member_count != null && (
                        <>
                          {" "}
                          <span className="ws-switcher-member-count">
                            <Users size={10} />
                            {ws.member_count}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  {isActive && (
                    <span className="ws-switcher-active-dot" />
                  )}
                </button>
              );
            })
          )}

          <div className="ws-switcher-dropdown-divider" />

          <button
            className="ws-switcher-item"
            onClick={() => {
              setOpen(false);
              router.push("/workspaces/new");
            }}
          >
            <span
              className="ws-switcher-item-avatar"
              style={{
                background: "transparent",
                border: "1.5px dashed var(--color-text-2)",
                color: "var(--color-text-2)",
              }}
            >
              <Plus size={14} />
            </span>
            <span
              className="ws-switcher-item-name"
              style={{ color: "var(--color-text-1)" }}
            >
              Create Workspace
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
