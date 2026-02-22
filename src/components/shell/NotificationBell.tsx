"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  FileText,
  GitMerge,
  Check,
  UserPlus,
  Users,
} from "lucide-react";
import { useUITranslation } from "@/hooks/useUITranslation";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const { t } = useUITranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user.id) loadNotifications();
  }, [user.id, loadNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  // Position the fixed dropdown relative to the bell button
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setDropdownStyle({
      left: rect.left,
      bottom: window.innerHeight - rect.top + 8,
    });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      );
    }
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "document_invite":
        return <FileText size={14} />;
      case "merge_request":
      case "merge_approved":
      case "merge_rejected":
      case "branch_rebased":
        return <GitMerge size={14} />;
      case "workspace_join":
        return <Users size={14} />;
      case "collaborator_invited":
        return <UserPlus size={14} />;
      default:
        return <Bell size={14} />;
    }
  };

  return (
    <div className="notif-bell-wrapper" ref={wrapperRef}>
      <button
        ref={btnRef}
        className="notif-bell-btn"
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications();
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notif-bell-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" style={dropdownStyle}>
          <div className="notif-dropdown-header">
            <span>{t("notifications.title")}</span>
            {unreadCount > 0 && (
              <button
                className="notif-mark-all"
                onClick={handleMarkAllRead}
              >
                <Check size={12} />
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">{t("notifications.loading")}</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">{t("notifications.empty")}</div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <button
                  key={notif.id}
                  className={`notif-item ${notif.read ? "read" : "unread"}`}
                  onClick={() => handleClick(notif)}
                >
                  <span className="notif-item-icon">
                    {getIcon(notif.type)}
                  </span>
                  <div className="notif-item-content">
                    <div className="notif-item-title">{notif.title}</div>
                    {notif.body && (
                      <div className="notif-item-body">{notif.body}</div>
                    )}
                    <div className="notif-item-time">
                      {getTimeAgo(notif.created_at, t)}
                    </div>
                  </div>
                  {!notif.read && <span className="notif-unread-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTimeAgo(dateStr: string, t: (key: any) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("time.justNow");
  if (diffMin < 60) return `${diffMin}${t("time.minutesAgo")}`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}${t("time.hoursAgo")}`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}${t("time.daysAgo")}`;
}
