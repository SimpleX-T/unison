"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { useUITranslation } from "@/hooks/useUITranslation";

interface NewDocumentButtonProps {
  workspaceId: string;
  workspaceSlug: string;
  language: string;
}

export function NewDocumentButton({
  workspaceId,
  workspaceSlug,
  language,
}: NewDocumentButtonProps) {
  const router = useRouter();
  const { t } = useUITranslation();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        workspace_id: workspaceId,
        title: t("doc.untitled"),
        title_original_language: language,
        created_by: user.id,
        last_edited_by: user.id,
      })
      .select()
      .single();

    if (error || !doc) {
      setLoading(false);
      return;
    }

    router.push(`/workspace/${workspaceSlug}/docs/${doc.id}`);
  };

  return (
    <button
      className="btn btn-primary"
      onClick={handleCreate}
      disabled={loading}
    >
      {loading ? (
        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <Plus size={16} />
      )}
      {t("doc.newDocument")}
    </button>
  );
}
