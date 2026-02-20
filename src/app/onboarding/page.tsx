"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { LANGUAGES } from "@/lib/languages";
import { ArrowRight, Check, Loader2 } from "lucide-react";

function OnboardingForm() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const user = useAppStore((s) => s.user);
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [selectedLang, setSelectedLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    console.log("authUser 1", authUser);

    if (!authUser) {
      setError("You are not signed in. Please sign in first.");
      setLoading(false);
      return;
    }

    console.log("authUser", authUser);

    // Update profile with name + language
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        preferred_language: selectedLang,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUser.id);

    if (updateError) {
      console.error("[onboarding] profile update error:", updateError);
      setError(`Failed to save profile: ${updateError.message}`);
      setLoading(false);
      return;
    }

    // Fetch updated profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profile) {
      setUser(profile);
    }

    // Create a default workspace for new users
    const workspaceName = `${displayName.trim()}'s Workspace`;
    const workspaceSlug =
      displayName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6);

    const { data: workspace } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName,
        slug: workspaceSlug,
        created_by: authUser.id,
      })
      .select()
      .single();

    if (workspace) {
      await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: authUser.id,
        role: "owner",
      });

      // Seed a #general channel
      await supabase.from("channels").insert({
        workspace_id: workspace.id,
        name: "general",
        created_by: authUser.id,
      });

      router.push(`/workspace/${workspace.slug}`);
    } else {
      router.push("/workspace/select");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="label" htmlFor="name">
          Display name
        </label>
        <input
          id="name"
          type="text"
          className="input"
          placeholder="How should collaborators see you?"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label className="label">Your language</label>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-text-2)",
            marginBottom: 12,
          }}
        >
          Content will be translated into this language for you.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {LANGUAGES.slice(0, 9).map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${selectedLang === lang.code ? lang.accent : "var(--color-bg-2)"}`,
                background:
                  selectedLang === lang.code
                    ? `${lang.accent}10`
                    : "var(--color-bg-0)",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                color: "var(--color-text-0)",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {selectedLang === lang.code && (
                <Check
                  size={14}
                  style={{
                    color: lang.accent,
                    position: "absolute",
                    top: 4,
                    right: 4,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{ color: "var(--color-rust)", fontSize: 13, marginBottom: 16 }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 8 }}
        disabled={!displayName.trim() || loading}
      >
        {loading ? (
          <Loader2
            className="animate-spin"
            size={16}
            style={{ animation: "spin 1s linear infinite" }}
          />
        ) : (
          <>
            <span>Get started</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}

export default function OnboardingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-0)",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            Welcome to Unison
          </h1>
          <p
            style={{
              color: "var(--color-text-1)",
              fontSize: "15px",
              margin: 0,
            }}
          >
            Tell us a little about you.
          </p>
        </div>
        <Suspense fallback={null}>
          <OnboardingForm />
        </Suspense>
      </div>
    </div>
  );
}
