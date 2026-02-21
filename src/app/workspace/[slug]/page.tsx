import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getDocuments } from "@/lib/documents";
import { getBoards } from "@/lib/boards";
import { getChannels } from "@/lib/chat";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

interface DashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceDashboard({ params }: DashboardProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const [docs, boards, channels] = await Promise.all([
    getDocuments(workspace.id),
    getBoards(workspace.id),
    getChannels(workspace.id),
  ]);

  return (
    <DashboardClient
      slug={slug}
      docs={docs}
      boards={boards}
      channels={channels}
    />
  );
}
