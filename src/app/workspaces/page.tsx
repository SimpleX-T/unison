import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/workspaces";
import { Plus } from "lucide-react";

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const workspaces = await getUserWorkspaces();

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
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 700,
                margin: "0 0 4px",
              }}
            >
              Your workspaces
            </h1>
            <p
              style={{ color: "var(--color-text-1)", fontSize: 14, margin: 0 }}
            >
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/workspaces/new"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-sage)",
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
            }}
          >
            <Plus size={16} />
            New workspace
          </Link>
        </div>

        {workspaces.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 0",
              color: "var(--color-text-2)",
            }}
          >
            <p>You don&apos;t have any workspaces yet.</p>
            <Link
              href="/workspaces/new"
              style={{
                color: "var(--color-sage)",
                textDecoration: "underline",
                fontSize: 14,
              }}
            >
              Create your first workspace →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspace/${ws.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-bg-2)",
                  background: "var(--color-bg-1)",
                  color: "var(--color-text-0)",
                  textDecoration: "none",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    {ws.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-2)",
                      marginTop: 2,
                    }}
                  >
                    /{ws.slug}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 8,
                    background: "var(--color-bg-2)",
                    color: "var(--color-text-1)",
                    fontFamily: "var(--font-ui)",
                    textTransform: "capitalize",
                  }}
                >
                  {ws.role}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
