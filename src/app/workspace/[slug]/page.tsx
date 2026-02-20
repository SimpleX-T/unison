import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getDocuments } from "@/lib/documents";
import { getBoards } from "@/lib/boards";
import { getChannels } from "@/lib/chat";
import {
  FileText,
  LayoutGrid,
  MessageCircle,
  Pencil,
  Globe,
  Users,
  Clock,
} from "lucide-react";

interface DashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceDashboard({ params }: DashboardProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const [docs, boards, channels] = await Promise.all([
    getDocuments(workspace.id),
    getBoards(workspace.id),
    getChannels(workspace.id),
  ]);

  const recentDocs = docs.slice(0, 6);
  const base = `/workspace/${slug}`;

  const QUICK_ACTIONS = [
    {
      icon: FileText,
      label: "Documents",
      href: `${base}/docs`,
      color: "var(--color-sage)",
    },
    {
      icon: LayoutGrid,
      label: "Boards",
      href: `${base}/board`,
      color: "var(--color-indigo)",
    },
    {
      icon: MessageCircle,
      label: "Chat",
      href: `${base}/chat`,
      color: "var(--color-rust)",
    },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontFamily: "var(--font-display)" }}>Dashboard</h1>
        <p>Overview of your workspace activity.</p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          padding: "0 40px 32px",
        }}
      >
        {[
          {
            icon: FileText,
            value: String(docs.length),
            label: "Documents",
            color: "var(--color-sage)",
            bg: "rgba(74, 124, 89, 0.1)",
          },
          {
            icon: LayoutGrid,
            value: String(boards.length),
            label: "Boards",
            color: "var(--color-indigo)",
            bg: "rgba(61, 79, 161, 0.1)",
          },
          {
            icon: MessageCircle,
            value: String(channels.length),
            label: "Channels",
            color: "var(--color-rust)",
            bg: "rgba(196, 82, 42, 0.1)",
          },
        ].map((stat) => (
          <div
            className="dashboard-card"
            key={stat.label}
            style={{ cursor: "default" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: stat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-2)" }}>
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "0 40px 32px" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Quick Actions
        </h2>
        <div style={{ display: "flex", gap: 12 }}>
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="dashboard-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  background: `${action.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      <div style={{ padding: "0 40px 40px" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Recent Documents
        </h2>
        <div className="dashboard-grid">
          {recentDocs.length === 0 ? (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "32px 0",
                color: "var(--color-text-2)",
              }}
            >
              <p>No documents yet.</p>
            </div>
          ) : (
            recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`${base}/docs/${doc.id}`}
                className="dashboard-card"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <FileText
                    size={16}
                    style={{ color: "var(--color-text-2)" }}
                  />
                  <h3 style={{ margin: 0 }}>{doc.title}</h3>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--color-text-2)",
                  }}
                >
                  <Clock size={12} />
                  <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
