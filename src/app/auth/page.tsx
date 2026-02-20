"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowRight } from "lucide-react";

function AuthForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/workspace/select";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "missing_code"
      ? "Invalid link. Please try again."
      : errorParam === "exchange_failed"
        ? "Sign-in failed. Please try again."
        : null,
  );

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(74, 124, 89, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Mail size={24} style={{ color: "var(--color-sage)" }} />
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            fontWeight: 700,
            margin: "0 0 8px",
          }}
        >
          Check your email
        </h2>
        <p style={{ color: "var(--color-text-1)", fontSize: "14px" }}>
          We sent a magic link to <strong>{email}</strong>
        </p>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 16 }}
          onClick={() => setSent(false)}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          fontWeight: 700,
          margin: "0 0 4px",
        }}
      >
        Sign in
      </h2>
      <p
        style={{
          color: "var(--color-text-1)",
          fontSize: "14px",
          margin: "0 0 24px",
        }}
      >
        Enter your email to receive a magic link
      </p>

      {error && (
        <div
          style={{
            background: "rgba(196, 82, 42, 0.08)",
            border: "1px solid rgba(196, 82, 42, 0.2)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 13,
            color: "var(--color-rust)",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleMagicLink}>
        <div className="form-group">
          <label className="label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={loading}
        >
          <span>{loading ? "Sending…" : "Continue with email"}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "24px 0",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--color-bg-2)" }} />
        <span style={{ color: "var(--color-text-2)", fontSize: 12 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "var(--color-bg-2)" }} />
      </div>

      <button
        className="btn btn-secondary"
        style={{ width: "100%" }}
        onClick={handleGoogle}
        disabled={loading}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>Continue with Google</span>
      </button>
    </>
  );
}

export default function AuthPage() {
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
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              margin: "0 0 8px",
            }}
          >
            UNISON
          </h1>
          <p
            style={{
              color: "var(--color-text-1)",
              fontSize: "15px",
              margin: 0,
            }}
          >
            Every language. One workspace.
          </p>
        </div>
        {/* Card */}
        <div
          style={{
            background: "var(--color-bg-1)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            border: "1px solid var(--color-bg-2)",
          }}
        >
          <Suspense fallback={<div style={{ height: 200 }} />}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
