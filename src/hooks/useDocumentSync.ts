"use client";
import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseDocumentSyncOptions {
  documentId: string;
  branchId?: string;
  isOwner: boolean;
  onMainUpdated?: (updatedAt: string) => void;
  onBranchStatusChanged?: (status: string) => void;
  onMergeRequestChange?: () => void;
}

/**
 * Subscribes to Supabase Realtime for instant sync of document,
 * branch, and merge request changes. Replaces polling entirely.
 */
export function useDocumentSync({
  documentId,
  branchId,
  isOwner,
  onMainUpdated,
  onBranchStatusChanged,
  onMergeRequestChange,
}: UseDocumentSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const branchUpdatedAtRef = useRef<string | null>(null);

  const setupSubscription = useCallback(() => {
    const supabase = createClient();
    const channelName = `doc-sync:${documentId}:${branchId || "main"}`;

    const channel = supabase.channel(channelName);

    // Listen for main document updates (relevant for collaborators)
    if (!isOwner && branchId) {
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          const updatedAt = (payload.new as { updated_at: string }).updated_at;
          if (
            branchUpdatedAtRef.current &&
            new Date(updatedAt).getTime() >
              new Date(branchUpdatedAtRef.current).getTime()
          ) {
            onMainUpdated?.(updatedAt);
          }
        },
      );
    }

    // Listen for branch status changes (relevant for collaborators)
    if (branchId) {
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "document_branches",
          filter: `id=eq.${branchId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string; updated_at: string }).status;
          const newUpdatedAt = (payload.new as { updated_at: string }).updated_at;
          branchUpdatedAtRef.current = newUpdatedAt;
          onBranchStatusChanged?.(newStatus);
        },
      );
    }

    // Listen for merge request changes (relevant for owner)
    if (isOwner) {
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "merge_requests",
            filter: `document_id=eq.${documentId}`,
          },
          () => onMergeRequestChange?.(),
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "merge_requests",
            filter: `document_id=eq.${documentId}`,
          },
          () => onMergeRequestChange?.(),
        );
    }

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [documentId, branchId, isOwner, onMainUpdated, onBranchStatusChanged, onMergeRequestChange]);

  // Fetch initial branch updated_at for comparison
  useEffect(() => {
    if (!branchId) return;
    const supabase = createClient();
    supabase
      .from("document_branches")
      .select("updated_at")
      .eq("id", branchId)
      .single()
      .then(({ data }) => {
        if (data) branchUpdatedAtRef.current = data.updated_at;
      });
  }, [branchId]);

  useEffect(() => {
    const cleanup = setupSubscription();
    return cleanup;
  }, [setupSubscription]);
}
