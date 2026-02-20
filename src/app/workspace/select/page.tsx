import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Workspace select page — resolves which workspace to send the user to.
 * - If they have exactly one workspace → redirect to it
 * - If they have multiple → show a picker (future: /workspaces page)
 * - If they have none → redirect to onboarding
 */
export default async function WorkspaceSelectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Fetch workspaces this user belongs to
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(slug, name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (!memberships || memberships.length === 0) {
    // New user with no workspace yet — shouldn't happen after onboarding, but handle it
    redirect("/onboarding");
  }

  if (memberships.length === 1) {
    const ws = memberships[0].workspaces as unknown as { slug: string } | null;
    if (ws?.slug) redirect(`/workspace/${ws.slug}`);
  }

  // Multiple workspaces — show a simple picker (will be replaced by full workspaces page)
  const workspaces = memberships
    .map(
      (m) => m.workspaces as unknown as { slug: string; name: string } | null,
    )
    .filter(Boolean);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-0)",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Choose a workspace
        </h1>
        <p
          style={{
            color: "var(--color-text-1)",
            fontSize: 14,
            marginBottom: 32,
          }}
        >
          You are a member of multiple workspaces.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {workspaces.map(
            (ws) =>
              ws && (
                <a
                  key={ws.slug}
                  href={`/workspace/${ws.slug}`}
                  style={{
                    display: "block",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-bg-2)",
                    background: "var(--color-bg-1)",
                    color: "var(--color-text-0)",
                    textDecoration: "none",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    transition: "border-color 0.15s",
                  }}
                >
                  {ws.name}
                </a>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
