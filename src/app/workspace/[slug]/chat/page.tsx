import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getChannels } from "@/lib/chat";
import { MessageCircle } from "lucide-react";

interface ChatPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChatListPage({ params }: ChatPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const channels = await getChannels(workspace.id);

  // If there's exactly one channel, redirect straight into it
  if (channels.length === 1) {
    redirect(`/workspace/${slug}/chat/${channels[0].id}`);
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)" }}>Chat</h1>
          <p>Real-time messaging with automatic translation.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {channels.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "64px 0",
              color: "var(--color-text-2)",
            }}
          >
            <MessageCircle
              size={32}
              style={{ marginBottom: 12, opacity: 0.4 }}
            />
            <p>No channels yet. One will be created with your workspace.</p>
          </div>
        ) : (
          channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/workspace/${slug}/chat/${ch.id}`}
              className="dashboard-card"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  background: "rgba(74, 124, 89, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle
                  size={20}
                  style={{ color: "var(--color-sage)" }}
                />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>#{ch.name}</h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "var(--color-text-2)",
                  }}
                >
                  Created {new Date(ch.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
