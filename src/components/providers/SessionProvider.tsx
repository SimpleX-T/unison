"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Profile } from "@/types";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        // Dynamic import to guarantee singleton is used
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (cancelled || !user || error) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!cancelled && profile) {
          setUser(profile as Profile);
        }
      } catch (err) {
        // Silently handle — user is not logged in or Supabase is unreachable
        console.warn("[SessionProvider] Could not load user:", err);
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  // Don't subscribe to onAuthStateChange — it causes lock contention.
  // Session changes are handled by page navigation (proxy.ts + server components).

  return <>{children}</>;
}
