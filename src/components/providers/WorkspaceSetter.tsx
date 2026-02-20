"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Workspace } from "@/types";

interface WorkspaceSetterProps {
  workspace: Workspace;
}

/**
 * Invisible client component that syncs the workspace from
 * the server-component layout into the Zustand store.
 */
export function WorkspaceSetter({ workspace }: WorkspaceSetterProps) {
  const setWorkspace = useAppStore((s) => s.setWorkspace);

  useEffect(() => {
    setWorkspace(workspace);
  }, [workspace, setWorkspace]);

  return null;
}
