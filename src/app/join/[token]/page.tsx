import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

  // Uses a security-definer RPC to bypass RLS — the user isn't a member yet
  const { data: rows } = await supabase.rpc("lookup_workspace_by_invite_token", {
    lookup_token: token,
  });
  const workspace = rows?.[0] ?? null;

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
        <Link href="/workspace/select" className="text-sage hover:underline">
          Go to workspaces →
        </Link>
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
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "member",
    });

    // Get joiner's name for the notification
    const { data: joinerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    // Notify the workspace owner that someone joined
    const { data: ownerMembership } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace.id)
      .eq("role", "owner")
      .single();

    if (ownerMembership) {
      await supabase.from("notifications").insert({
        user_id: ownerMembership.user_id,
        type: "workspace_join",
        title: `${joinerProfile?.display_name || "Someone"} joined your workspace`,
        body: `A new member joined via invite link`,
        link: `/workspace/${workspace.slug}`,
        metadata: { workspace_id: workspace.id, joined_user_id: user.id },
      });
    }
  }

  redirect(`/workspace/${workspace.slug}`);
}
