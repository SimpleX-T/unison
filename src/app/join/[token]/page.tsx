import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not signed in → send to auth, then bounce back
    redirect(`/auth?next=/join/${token}`);
  }

  // Find workspace by token
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, slug")
    .eq("invite_token", token)
    .single();

  if (!workspace) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "var(--font-ui)",
          color: "var(--color-text-2)",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2>Invalid or expired invite link</h2>
        <a href="/workspace/select" style={{ color: "var(--color-sage)" }}>
          Go to workspaces →
        </a>
      </div>
    );
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    // Add as member
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "member",
    });
  }

  redirect(`/workspace/${workspace.slug}`);
}
