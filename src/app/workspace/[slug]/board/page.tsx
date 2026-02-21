import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getBoards } from "@/lib/boards";
import { BoardsListClient } from "@/components/dashboard/BoardsListClient";

interface BoardsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BoardsListPage({ params }: BoardsPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const boards = await getBoards(workspace.id);

  return <BoardsListClient slug={slug} boards={boards} />;
}
