"use client";
import { useState, useCallback, useEffect, useRef } from "react";
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
import {
  LogOut,
  UserPlus,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Plus,
  Home,
  FileText,
  LayoutGrid,
  PenTool,
  MessageCircle,
} from "lucide-react";

interface AppSidebarProps {
  slug?: string;
}

const NAV_ITEMS = [
  { key: "sidebar.home" as const, suffix: "", Icon: Home },
  { key: "sidebar.documents" as const, suffix: "/docs", Icon: FileText },
  { key: "sidebar.boards" as const, suffix: "/board", Icon: LayoutGrid },
  { key: "sidebar.whiteboards" as const, suffix: "/whiteboard", Icon: PenTool },
  { key: "sidebar.channels" as const, suffix: "/chat", Icon: MessageCircle },
];

const QUICK_ACTIONS = [
  { key: "sidebar.newDocument" as const, modal: "doc" as const },
  { key: "sidebar.newBoard" as const, modal: "board" as const },
  { key: "sidebar.newWhiteboard" as const, modal: "whiteboard" as const },
  { key: "sidebar.newChannel" as const, modal: "channel" as const },
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
  const [quickOpen, setQuickOpen] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!quickOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [quickOpen]);

  const closeModal = useCallback(() => setModal(null), []);
  const base = slug ? `/workspace/${slug}` : "/workspace/select";

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const ThemeIcon = resolved === "dark" ? Sun : Moon;

  return (
    <>
      <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Top: workspace + collapse toggle */}
        <div className="sidebar-top">
          {!collapsed ? (
            <>
              <WorkspaceSwitcher />
              <button
                className="sidebar-collapse-toggle"
                onClick={() => { setCollapsed(true); setQuickOpen(false); }}
                title="Collapse sidebar"
              >
                <ChevronsLeft size={16} />
              </button>
            </>
          ) : (
            <button
              className="sidebar-collapse-toggle centered"
              onClick={() => { setCollapsed(false); setQuickOpen(false); }}
              title="Expand sidebar"
            >
              <ChevronsRight size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const href = `${base}${item.suffix}`;
            const isActive =
              pathname === href || (item.suffix && pathname.startsWith(href));
            return (
              <Link
                key={item.key}
                href={href}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                title={collapsed ? t(item.key) : undefined}
              >
                <item.Icon size={18} strokeWidth={1.8} />
                {!collapsed && <span>{t(item.key)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="sidebar-divider" />

        {/* Quick create */}
        {!collapsed ? (
          <div className="sidebar-quick-section">
            <div className="sidebar-section-title">
              {t("dashboard.quickActions")}
            </div>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.key}
                className="sidebar-add-btn"
                onClick={() => setModal(action.modal)}
              >
                <Plus size={12} />
                {t(action.key)}
              </button>
            ))}
            <button
              className="sidebar-add-btn sidebar-invite-btn"
              onClick={() => setModal("invite")}
            >
              <UserPlus size={13} />
              {t("sidebar.invitePeople")}
            </button>
          </div>
        ) : (
          <div className="sidebar-collapsed-actions" ref={quickRef}>
            <button
              className="sidebar-rail-btn accent"
              onClick={() => setQuickOpen(!quickOpen)}
              title={t("dashboard.quickActions")}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>

            {quickOpen && (
              <div className="sidebar-quick-popover">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.key}
                    className="sidebar-quick-popover-item"
                    onClick={() => {
                      setModal(action.modal);
                      setQuickOpen(false);
                    }}
                  >
                    {t(action.key)}
                  </button>
                ))}
              </div>
            )}

            <button
              className="sidebar-rail-btn"
              onClick={() => setModal("invite")}
              title={t("sidebar.invitePeople")}
            >
              <UserPlus size={16} />
            </button>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div className={`sidebar-footer ${collapsed ? "collapsed" : ""}`}>
          {!collapsed ? (
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
                <ThemeIcon size={15} />
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
          ) : (
            <>
              <div
                className="sidebar-user-avatar"
                title={user.display_name || ""}
              >
                {(user.display_name || "U").charAt(0).toUpperCase()}
              </div>
              <NotificationBell />
              <button
                className="sidebar-rail-btn"
                onClick={toggle}
                title={resolved === "dark" ? t("sidebar.lightMode") : t("sidebar.darkMode")}
              >
                <ThemeIcon size={16} />
              </button>
              <button
                className="sidebar-rail-btn"
                onClick={handleSignOut}
                disabled={signingOut}
                title={t("sidebar.signOut")}
              >
                <LogOut size={16} />
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
