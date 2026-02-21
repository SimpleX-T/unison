import { create } from "zustand";
import type { Profile, Workspace } from "@/types";

interface AppState {
  user: Profile;
  workspace: Workspace | null;
  preferredLanguage: string;
  sidebarOpen: boolean;

  setUser: (user: Profile) => void;
  setWorkspace: (workspace: Workspace | null) => void;
  setPreferredLanguage: (lang: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// Empty default — real data loaded by SessionProvider on mount
const DEFAULT_USER: Profile = {
  id: "",
  username: "",
  display_name: "",
  preferred_language: "en",
  avatar_url: null,
  timezone: "UTC",
  created_at: "",
  updated_at: "",
};

export const useAppStore = create<AppState>((set) => ({
  user: DEFAULT_USER,
  workspace: null,
  preferredLanguage: "en",
  sidebarOpen: true,

  setUser: (user) => set({ user, preferredLanguage: user.preferred_language }),
  setWorkspace: (workspace) => set({ workspace }),
  setPreferredLanguage: (lang) => {
    set((state) => ({
      preferredLanguage: lang,
      user: { ...state.user, preferred_language: lang },
    }));
    // Persist to DB (fire-and-forget)
    const userId = useAppStore.getState().user.id;
    if (userId) {
      import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient();
        supabase
          .from("profiles")
          .update({
            preferred_language: lang,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .then(() => {});
      });
    }
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
