"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useUITranslation } from "@/hooks/useUITranslation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CreateDocumentModal } from "@/components/modals/CreateDocumentModal";
import { CreateBoardModal } from "@/components/modals/CreateBoardModal";
import { CreateWhiteboardModal } from "@/components/modals/CreateWhiteboardModal";
import { CreateChannelModal } from "@/components/modals/CreateChannelModal";
import { InviteModal } from "@/components/modals/InviteModal";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { NotificationBell } from "./NotificationBell";
import { createClient } from "@/lib/supabase/client";
import { LogOut, UserPlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface AppSidebarProps {
  slug?: string;
}

const NAV_KEYS = [
  { key: "sidebar.home" as const, suffix: "", icon: "◆" },
  { key: "sidebar.documents" as const, suffix: "/docs", icon: "◇" },
  { key: "sidebar.boards" as const, suffix: "/board", icon: "▦" },
  { key: "sidebar.whiteboards" as const, suffix: "/whiteboard", icon: "▢" },
  { key: "sidebar.channels" as const, suffix: "/chat", icon: "◎" },
];

export function AppSidebar({ slug }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const { t } = useUITranslation();
  const { resolved, toggle } = useTheme();
  const [modal, setModal] = useState<
    "doc" | "board" | "whiteboard" | "channel" | "invite" | null
  >(null);
  const [signingOut, setSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const closeModal = useCallback(() => setModal(null), []);

  const base = slug ? `/workspace/${slug}` : "/workspace/select";

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <>
      <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Collapse toggle */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {!collapsed && <WorkspaceSwitcher />}

        {/* Main nav */}
        <div className="sidebar-section">
          {NAV_KEYS.map((item) => {
            const href = `${base}${item.suffix}`;
            const isActive =
              pathname === href || (item.suffix && pathname.startsWith(href));
            return (
              <Link
                key={item.key}
                href={href}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                title={collapsed ? t(item.key) : undefined}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-item-label">{t(item.key)}</span>}
              </Link>
            );
          })}
        </div>

        {/* Quick create */}
        {!collapsed ? (
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              {t("dashboard.quickActions")}
            </div>
            <button className="sidebar-add-btn" onClick={() => setModal("doc")}>
              + {t("sidebar.newDocument")}
            </button>
            <button className="sidebar-add-btn" onClick={() => setModal("board")}>
              + {t("sidebar.newBoard")}
            </button>
            <button
              className="sidebar-add-btn"
              onClick={() => setModal("whiteboard")}
            >
              + {t("sidebar.newWhiteboard")}
            </button>
            <button
              className="sidebar-add-btn"
              onClick={() => setModal("channel")}
            >
              + {t("sidebar.newChannel")}
            </button>
          </div>
        ) : (
          <div className="sidebar-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 0" }}>
            <button className="sidebar-icon-btn" onClick={() => setModal("doc")} title={t("sidebar.newDocument")}>◇</button>
            <button className="sidebar-icon-btn" onClick={() => setModal("board")} title={t("sidebar.newBoard")}>▦</button>
            <button className="sidebar-icon-btn" onClick={() => setModal("whiteboard")} title={t("sidebar.newWhiteboard")}>▢</button>
            <button className="sidebar-icon-btn" onClick={() => setModal("channel")} title={t("sidebar.newChannel")}>◎</button>
          </div>
        )}

        {/* Invite */}
        {!collapsed ? (
          <div className="sidebar-section">
            <button
              className="sidebar-add-btn"
              onClick={() => setModal("invite")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--color-sage)",
              }}
            >
              <UserPlus size={14} />
              {t("sidebar.invitePeople")}
            </button>
          </div>
        ) : (
          <div className="sidebar-section" style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <button
              className="sidebar-icon-btn"
              onClick={() => setModal("invite")}
              title={t("sidebar.invitePeople")}
              style={{ color: "var(--color-sage)" }}
            >
              <UserPlus size={16} />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          {collapsed ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div className="sidebar-user-avatar" title={user.display_name || ""}>
                  {(user.display_name || "U").charAt(0).toUpperCase()}
                </div>
                <NotificationBell />
                <button
                  className="sidebar-icon-btn"
                  onClick={toggle}
                  title={resolved === "dark" ? t("sidebar.lightMode") : t("sidebar.darkMode")}
                >
                  {resolved === "dark" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
                <button
                  className="sidebar-icon-btn"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  title={t("sidebar.signOut")}
                  style={{ color: "var(--color-text-2)" }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-user-info">
                <div className="sidebar-user-avatar">
                  {(user.display_name || "U").charAt(0).toUpperCase()}
                </div>
                <span className="sidebar-user-name">
                  {user.display_name || t("sidebar.loading")}
                </span>
                <NotificationBell />
              </div>

              <button
                className="theme-toggle"
                onClick={toggle}
                style={{ marginBottom: 8 }}
              >
                {resolved === "dark" ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                {resolved === "dark" ? t("sidebar.lightMode") : t("sidebar.darkMode")}
              </button>

              <LanguageSwitcher />

              <button
                className="sidebar-add-btn"
                onClick={handleSignOut}
                disabled={signingOut}
                style={{
                  marginTop: 8,
                  color: "var(--color-text-2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LogOut size={14} />
                {signingOut ? t("sidebar.signingOut") : t("sidebar.signOut")}
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Modals */}
      {modal === "doc" && <CreateDocumentModal onClose={closeModal} />}
      {modal === "board" && <CreateBoardModal onClose={closeModal} />}
      {modal === "whiteboard" && <CreateWhiteboardModal onClose={closeModal} />}
      {modal === "channel" && <CreateChannelModal onClose={closeModal} />}
      {modal === "invite" && <InviteModal onClose={closeModal} />}
    </>
  );
}
