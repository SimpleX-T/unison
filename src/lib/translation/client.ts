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
    writeCacheEntry(contentHash, toLanguage, translated, fromLanguage);

    return translated;
  } catch {
    return text; // Graceful fallback
  }
}

/**
 * Batch-translate multiple texts in a single API round-trip.
 * Checks per-text cache first — only uncached texts are sent to the API.
 */
export async function translateBatch(
  texts: string[],
  fromLanguage: string,
  toLanguage: string,
): Promise<string[]> {
  if (fromLanguage === toLanguage) return texts;

  const results: string[] = new Array(texts.length);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  // Check cache for each text
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text.trim()) {
      results[i] = text;
      continue;
    }

    const hash = await getContentHash(text);
    const cacheKey = `${hash}:${toLanguage}`;

    if (memCache.has(cacheKey)) {
      results[i] = memCache.get(cacheKey)!;
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(text);
    }
  }

  // All cached — done
  if (uncachedTexts.length === 0) return results;

  // Batch API call for uncached texts
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: uncachedTexts,
        fromLanguage,
        toLanguage,
      }),
    });

    if (!res.ok) {
      // Fallback: return originals for uncached
      for (const idx of uncachedIndices) results[idx] = texts[idx];
      return results;
    }

    const { translated } = await res.json();
    const translatedArr: string[] = Array.isArray(translated)
      ? translated
      : [translated];

    for (let j = 0; j < uncachedIndices.length; j++) {
      const idx = uncachedIndices[j];
      const result = translatedArr[j] ?? texts[idx];
      results[idx] = result;

      // Write to L1 cache
      const hash = await getContentHash(texts[idx]);
      const cacheKey = `${hash}:${toLanguage}`;
      memCache.set(cacheKey, result);

      // Write to L2 cache (fire and forget)
      writeCacheEntry(hash, toLanguage, result, fromLanguage);
    }
  } catch {
    // Fallback: return originals for uncached
    for (const idx of uncachedIndices) results[idx] = texts[idx];
  }

  return results;
}

/** Fire-and-forget write to Supabase translation_cache */
function writeCacheEntry(
  contentHash: string,
  targetLanguage: string,
  translatedText: string,
  sourceLanguage: string,
) {
  try {
    const supabase = createClient();
    supabase
      .from("translation_cache")
      .insert({
        content_hash: contentHash,
        target_language: targetLanguage,
        translated_text: translatedText,
        source_language: sourceLanguage,
      })
      .then(() => {});
  } catch {
    // Supabase not configured — skip
  }
}
