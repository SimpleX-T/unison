import { createClient } from "@/lib/supabase/server";

export async function createBranch(
  documentId: string,
  userId: string,
  language: string,
  userName: string,
) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("document_branches")
    .select("id")
    .eq("document_id", documentId)
    .eq("owner_id", userId)
    .in("status", ["active", "submitted"])
    .single();

  if (existing) return existing;

  const { data: doc } = await supabase
    .from("documents")
    .select("yjs_state")
    .eq("id", documentId)
    .single();

  const { data: branch, error } = await supabase
    .from("document_branches")
    .insert({
      document_id: documentId,
      owner_id: userId,
      name: `${userName}'s edits`,
      language,
      yjs_state: doc?.yjs_state ?? null,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("[createBranch]", error);
    return null;
  }
  return branch;
}

export async function getBranchesForDocument(documentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_branches")
    .select(
      `
      *,
      profiles!owner_id (
        id,
        display_name,
        preferred_language,
        avatar_url
      )
    `,
    )
    .eq("document_id", documentId)
    .order("updated_at", { ascending: false });

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.map((row: any) => ({
      ...row,
      owner: row.profiles,
    })) ?? []
  );
}

export async function getUserBranch(documentId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_branches")
    .select("*")
    .eq("document_id", documentId)
    .eq("owner_id", userId)
    .in("status", ["active", "submitted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data ?? null;
}

export async function submitBranchForMerge(branchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: branch } = await supabase
    .from("document_branches")
    .select("document_id, owner_id")
    .eq("id", branchId)
    .single();

  if (!branch) return { error: "Branch not found" };
  if (branch.owner_id !== user.id) return { error: "Not your branch" };

  const { error: branchError } = await supabase
    .from("document_branches")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", branchId);

  if (branchError) return { error: branchError.message };

  const { error: mrError } = await supabase.from("merge_requests").insert({
    branch_id: branchId,
    document_id: branch.document_id,
    submitted_by: user.id,
    status: "pending",
  });

  if (mrError) return { error: mrError.message };
  return { success: true };
}

export async function getPendingMergeRequests(documentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("merge_requests")
    .select(
      `
      *,
      document_branches!branch_id (
        id,
        name,
        language,
        yjs_state,
        status,
        owner_id,
        profiles!owner_id (
          id,
          display_name,
          preferred_language,
          avatar_url
        )
      )
    `,
    )
    .eq("document_id", documentId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.map((row: any) => ({
      ...row,
      branch: {
        ...row.document_branches,
        owner: row.document_branches?.profiles,
      },
    })) ?? []
  );
}

export async function approveMerge(
  mergeRequestId: string,
  _translatedContent: string,
) {
  const supabase = await createClient();

  const { data: mr } = await supabase
    .from("merge_requests")
    .select("branch_id, document_id")
    .eq("id", mergeRequestId)
    .single();

  if (!mr) return { error: "Merge request not found" };

  const { error: mrError } = await supabase
    .from("merge_requests")
    .update({
      status: "merged",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", mergeRequestId);

  if (mrError) return { error: mrError.message };

  const { error: branchError } = await supabase
    .from("document_branches")
    .update({ status: "merged", updated_at: new Date().toISOString() })
    .eq("id", mr.branch_id);

  if (branchError) return { error: branchError.message };

  return { success: true, documentId: mr.document_id, branchId: mr.branch_id };
}

export async function rejectMerge(mergeRequestId: string, note?: string) {
  const supabase = await createClient();

  const { data: mr } = await supabase
    .from("merge_requests")
    .select("branch_id")
    .eq("id", mergeRequestId)
    .single();

  if (!mr) return { error: "Merge request not found" };

  const { error: mrError } = await supabase
    .from("merge_requests")
    .update({
      status: "rejected",
      owner_note: note ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", mergeRequestId);

  if (mrError) return { error: mrError.message };

  const { error: branchError } = await supabase
    .from("document_branches")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", mr.branch_id);

  if (branchError) return { error: branchError.message };

  return { success: true };
}
