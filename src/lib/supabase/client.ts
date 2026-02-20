import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton — one client per browser context.
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        auth: {
          // The default Web Locks API lock causes timeouts when multiple
          // callers (SessionProvider + form submit) hit getUser() concurrently.
          // This no-op lock is safe in a single-tab browser context.
          lock: async (_name, _timeout, fn) => fn(),
        },
      },
    );
  }
  return browserClient;
}
