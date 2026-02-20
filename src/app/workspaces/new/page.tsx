"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const handleSlugChange = (v: string) => {
    setSlug(slugify(v));
    setSlugEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      setError("That URL is already taken. Try a different one.");
      setLoading(false);
      return;
    }

    const { data: workspace, error: insertError } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), slug, created_by: user.id })
      .select()
      .single();

    if (insertError || !workspace) {
      setError(insertError?.message ?? "Failed to create workspace.");
      setLoading(false);
      return;
    }

    // Owner membership
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    // Seed #general channel
    await supabase.from("channels").insert({
      workspace_id: workspace.id,
      name: "general",
      created_by: user.id,
    });

    router.push(`/workspace/${workspace.slug}`);
  };

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
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            Create a workspace
          </h1>
          <p style={{ color: "var(--color-text-1)", fontSize: 14, margin: 0 }}>
            A workspace is a shared space for your team's documents, boards, and
            conversations.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="ws-name">
              Workspace name
            </label>
            <input
              id="ws-name"
              type="text"
              className="input"
              placeholder="e.g. Acme Corp, Product Team, Personal"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="ws-slug">
              URL slug
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <span
                style={{
                  padding: "10px 12px",
                  background: "var(--color-bg-2)",
                  border: "1px solid var(--color-bg-2)",
                  borderRight: "none",
                  borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
                  fontSize: 13,
                  color: "var(--color-text-2)",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                }}
              >
                unison.app/workspace/
              </span>
              <input
                id="ws-slug"
                type="text"
                className="input"
                style={{
                  borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                  borderLeft: "none",
                }}
                placeholder="your-workspace"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                color: "var(--color-rust)",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={!name.trim() || !slug || loading}
          >
            {loading ? (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <>
                <span>Create workspace</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
