import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { WorkspaceSetter } from "@/components/providers/WorkspaceSetter";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { slug } = await params;

  // Server-side auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Verify workspace membership
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  return (
    <div className="app-shell">
      <WorkspaceSetter workspace={workspace} />
      <AppSidebar slug={slug} />
      <main className="app-content">{children}</main>
    </div>
  );
}
