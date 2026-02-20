import { createClient } from "@/lib/supabase/client";
import { getContentHash } from "./cache";

// L1: In-memory session-scoped cache
const memCache = new Map<string, string>();

export { getContentHash };

export async function translateText(
  contentHash: string,
  text: string,
  fromLanguage: string,
  toLanguage: string,
): Promise<string> {
  if (fromLanguage === toLanguage) return text;
  if (!text.trim()) return text;

  const cacheKey = `${contentHash}:${toLanguage}`;

  // L1: Memory cache hit
  if (memCache.has(cacheKey)) return memCache.get(cacheKey)!;

  // L2: Supabase translation_cache table
  try {
    const supabase = createClient();
    const { data: cached } = await supabase
      .from("translation_cache")
      .select("translated_text")
      .eq("content_hash", contentHash)
      .eq("target_language", toLanguage)
      .single();

    if (cached) {
      memCache.set(cacheKey, cached.translated_text);
      return cached.translated_text;
    }
  } catch {
    // Supabase not configured — skip L2 cache
  }

  // L3: Translation API via server-side route
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fromLanguage, toLanguage, contentHash }),
    });

    if (!res.ok) return text;

    const { translated } = await res.json();
    memCache.set(cacheKey, translated);

    // Write-through to L2 cache (fire and forget)
    try {
      const supabase = createClient();
      supabase
        .from("translation_cache")
        .insert({
          content_hash: contentHash,
          target_language: toLanguage,
          translated_text: translated,
          source_language: fromLanguage,
        })
        .then(() => {});
    } catch {
      // Supabase not configured — skip L2 write
    }

    return translated;
  } catch {
    return text; // Graceful fallback
  }
}
