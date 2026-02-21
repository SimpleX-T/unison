"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Globe,
  FileText,
  LayoutGrid,
  Pencil,
  ArrowRight,
  Languages,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LANGUAGES_DEMO = [
  { flag: "🇬🇧", name: "English", text: "Collaborate without barriers" },
  { flag: "🇯🇵", name: "日本語", text: "障壁のないコラボレーション" },
  { flag: "🇧🇷", name: "Português", text: "Colaborar sem barreiras" },
  { flag: "🇪🇸", name: "Español", text: "Colaborar sin barreras" },
  { flag: "🇫🇷", name: "Français", text: "Collaborer sans barrières" },
  { flag: "🇩🇪", name: "Deutsch", text: "Zusammenarbeit ohne Barrieren" },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Documents",
    description:
      "Real-time collaborative editing. Each writer sees the document in their own language.",
    color: "var(--color-sage)",
  },
  {
    icon: LayoutGrid,
    title: "Task Boards",
    description:
      "Kanban boards with cards that auto-translate titles and descriptions for every viewer.",
    color: "var(--color-indigo)",
  },
  {
    icon: Pencil,
    title: "Whiteboards",
    description:
      "Infinite canvas for brainstorming. Sticky note labels translate on the fly.",
    color: "var(--color-rust)",
  },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("/auth");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id, workspaces!workspace_id(slug)")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (membership?.workspaces) {
        const ws = membership.workspaces as unknown as { slug: string };
        setDashboardUrl(`/workspace/${ws.slug}`);
      } else {
        setDashboardUrl("/onboarding");
      }
    });
  }, []);

  return (
    <div
      style={{
        background: "var(--color-bg-0)",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* ───── NAV ───── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Globe size={22} style={{ color: "var(--color-sage)" }} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            UNISON
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {isLoggedIn ? (
            <Link href={dashboardUrl} className="btn btn-primary">
              Go to Workspace
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                href="/auth"
                className="btn btn-ghost"
                style={{ fontSize: "14px" }}
              >
                Sign in
              </Link>
              <Link href="/auth" className="btn btn-primary">
                Get Started
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 40px 60px",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 16px",
              borderRadius: "20px",
              background: "rgba(74, 124, 89, 0.08)",
              color: "var(--color-sage)",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "24px",
            }}
          >
            <Languages size={14} />
            <span>Multilingual by default</span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: "0 0 20px",
              maxWidth: "800px",
              marginInline: "auto",
            }}
          >
            Your workspace,{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--color-sage), var(--color-indigo))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              everyone&apos;s language
            </span>
          </h1>

          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.6,
              color: "var(--color-text-1)",
              maxWidth: "600px",
              margin: "0 auto 40px",
            }}
          >
            Documents, task boards, and whiteboards where every collaborator
            sees content in their own language — translated in real time, not
            after the fact.
          </p>

          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            {isLoggedIn ? (
              <Link
                href={dashboardUrl}
                className="btn btn-sage"
                style={{ padding: "14px 28px", fontSize: "16px" }}
              >
                Go to Workspace
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="btn btn-sage"
                  style={{ padding: "14px 28px", fontSize: "16px" }}
                >
                  Open Workspace
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/auth"
                  className="btn btn-secondary"
                  style={{ padding: "14px 28px", fontSize: "16px" }}
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Language ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            marginTop: "60px",
            flexWrap: "wrap",
          }}
        >
          {LANGUAGES_DEMO.map((lang, i) => (
            <motion.div
              key={lang.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              style={{
                padding: "16px 24px",
                background: "var(--color-bg-1)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-bg-2)",
                textAlign: "left",
                minWidth: "170px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "6px",
                  fontSize: "12px",
                  color: "var(--color-text-2)",
                }}
              >
                <span style={{ fontSize: "16px" }}>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--color-text-0)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {lang.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───── DEMO PREVIEW ───── */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 40px 80px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          style={{
            background: "var(--color-bg-1)",
            borderRadius: "16px",
            border: "1px solid var(--color-bg-2)",
            overflow: "hidden",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          {/* Mock editor toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: "1px solid var(--color-bg-2)",
              background: "var(--color-bg-0)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ff5f5680",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ffbd2e80",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#27c93f80",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--color-text-0)",
                }}
              >
                Product Spec — Unison v2.0
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className="presence-user"
                style={{ "--lang-accent": "#4a7c59" } as React.CSSProperties}
              >
                <span className="presence-dot" />
                <span style={{ fontSize: "12px" }}>Alex 🇬🇧</span>
              </div>
              <div
                className="presence-user"
                style={{ "--lang-accent": "#c4522a" } as React.CSSProperties}
              >
                <span className="presence-dot" />
                <span style={{ fontSize: "12px" }}>Yuki 🇯🇵</span>
              </div>
            </div>
          </div>

          {/* Mock editor content: side by side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              minHeight: "320px",
            }}
          >
            {/* English side */}
            <div
              style={{
                padding: "32px",
                borderRight: "1px solid var(--color-bg-2)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-sage)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🇬🇧</span> Alex&apos;s View — English
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 700,
                  margin: "0 0 12px",
                }}
              >
                Product Specification
              </h2>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "var(--color-text-1)",
                }}
              >
                <p style={{ margin: "0 0 12px" }}>
                  Unison is the collaboration platform for global-first teams —
                  where English speakers, Japanese speakers, and Portuguese
                  speakers all work in the same document.
                </p>
                <div
                  className="translated-paragraph"
                  style={{ marginBottom: "12px" }}
                >
                  <p style={{ margin: 0 }}>
                    The API integration must support at least 12 languages at
                    launch, with a translation latency target of under 400ms per
                    paragraph.
                  </p>
                </div>
              </div>
            </div>

            {/* Japanese side */}
            <div
              style={{ padding: "32px", background: "rgba(196, 82, 42, 0.02)" }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-rust)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🇯🇵</span> Yuki&apos;s View — 日本語
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 700,
                  margin: "0 0 12px",
                }}
              >
                製品仕様書
              </h2>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "var(--color-text-1)",
                }}
              >
                <p style={{ margin: "0 0 12px" }}>
                  Unisonは、グローバルファーストチームのためのコラボレーションプラットフォームです。
                  英語、日本語、ポルトガル語のユーザーが同じドキュメントで作業します。
                </p>
                <div
                  className="translated-paragraph"
                  style={{
                    marginBottom: "12px",
                    borderLeftColor: "rgba(196, 82, 42, 0.2)",
                    background: "rgba(196, 82, 42, 0.04)",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    API統合は、ローンチ時に少なくとも12の言語をサポートし、
                    段落あたり400ms以下の翻訳遅延目標を達成する必要があります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ───── FEATURES ───── */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px 80px",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "48px" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "36px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
            }}
          >
            Three surfaces. One platform.
          </h2>
          <p
            style={{
              color: "var(--color-text-1)",
              fontSize: "16px",
              margin: 0,
            }}
          >
            Every surface your team needs, with translation built into the
            infrastructure.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              style={{
                background: "var(--color-bg-1)",
                borderRadius: "var(--radius-lg)",
                padding: "32px",
                border: "1px solid var(--color-bg-2)",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--radius-md)",
                  background: `${feature.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <feature.icon size={22} style={{ color: feature.color }} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: "0 0 8px",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  color: "var(--color-text-1)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px 80px",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "48px" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "36px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
            }}
          >
            How it works
          </h2>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "40px",
          }}
        >
          {[
            {
              step: "01",
              icon: Users,
              title: "Set your language",
              desc: "Each collaborator picks their preferred language. That's the only setup.",
            },
            {
              step: "02",
              icon: FileText,
              title: "Write naturally",
              desc: "Type in your language. Yjs syncs every keystroke across all clients in real-time.",
            },
            {
              step: "03",
              icon: Languages,
              title: "Read in yours",
              desc: "Paragraphs translate with a 400ms debounce. Content-hash caching prevents redundant calls.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-bg-2)",
                  lineHeight: 1,
                  marginBottom: "12px",
                }}
              >
                {item.step}
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--color-bg-1)",
                  border: "1px solid var(--color-bg-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <item.icon size={18} style={{ color: "var(--color-text-1)" }} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "16px",
                  fontWeight: 500,
                  margin: "0 0 6px",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  color: "var(--color-text-1)",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───── THE PITCH ───── */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px 80px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            background: "var(--color-ink)",
            borderRadius: "16px",
            padding: "64px 48px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative gradient */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-20%",
              width: "140%",
              height: "200%",
              background:
                "radial-gradient(ellipse at center, rgba(74, 124, 89, 0.15) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <blockquote
            className="text-gray-500"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "20px",
              lineHeight: 1.6,
              maxWidth: "700px",
              margin: "0 auto 32px",
              fontStyle: "italic",
              position: "relative",
            }}
          >
            &ldquo;Every global startup has two choices today: hire for
            language, or limit who you hire. Unison eliminates that choice. Your
            product spec, your roadmap, your brainstorm — in everyone&apos;s
            language, in real time.&rdquo;
          </blockquote>

          <Link
            href={isLoggedIn ? dashboardUrl : "/auth"}
            className="btn"
            style={{
              background: "var(--color-sage)",
              color: "white",
              padding: "14px 32px",
              fontSize: "16px",
              position: "relative",
            }}
          >
            {isLoggedIn ? "Go to Workspace" : "Get Started"}
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-bg-2)",
          padding: "32px 40px",
          textAlign: "center",
          color: "var(--color-text-2)",
          fontSize: "13px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Globe size={14} />
          <span>UNISON — Every language. One workspace.</span>
        </div>
      </footer>
    </div>
  );
}
