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
    // Add as member
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "member",
    });
  }

  redirect(`/workspace/${workspace.slug}`);
}
