import { NextRequest, NextResponse } from "next/server";

const BATCH_DELIMITER = "\n¶¶¶\n";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fromLanguage, toLanguage } = body;

  // ── Batch mode: texts[] array ──
  if (Array.isArray(body.texts)) {
    const texts: string[] = body.texts;
    if (!toLanguage || texts.length === 0) {
      return NextResponse.json({ translated: texts });
    }

    const joined = texts.join(BATCH_DELIMITER);
    const result = await translateString(joined, fromLanguage, toLanguage);
    const parts = result.split(BATCH_DELIMITER);

    // If the split count doesn't match, fall back to per-item
    if (parts.length !== texts.length) {
      return NextResponse.json({
        translated: parts.length > 0 ? parts : texts,
      });
    }
    return NextResponse.json({ translated: parts.map((p) => p.trim()) });
  }

  // ── Single mode: text string ──
  const { text } = body;
  if (!text || !toLanguage) {
    return NextResponse.json({ translated: text ?? "" });
  }

  const translated = await translateString(text, fromLanguage, toLanguage);
  return NextResponse.json({ translated });
}

/** Translate a string via Lingo.dev → DeepL → fallback */
async function translateString(
  text: string,
  fromLanguage: string | null,
  toLanguage: string,
): Promise<string> {
  // PRIMARY: Lingo.dev SDK
  try {
    const { LingoDotDevEngine } = await import("lingo.dev/sdk");
    const engine = new LingoDotDevEngine({
      apiKey: process.env.LINGODOTDEV_API_KEY!,
    });

    const result = await engine.localizeText(text, {
      sourceLocale: fromLanguage || null,
      targetLocale: toLanguage,
    });

    return result;
  } catch (lingoError) {
    console.warn(
      "Lingo.dev translation failed, falling back to DeepL:",
      lingoError,
    );
  }

  // FALLBACK: DeepL free tier
  if (process.env.DEEPL_API_KEY) {
    try {
      const deeplRes = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          auth_key: process.env.DEEPL_API_KEY,
          text,
          target_lang: toLanguage.toUpperCase(),
        }),
      });

      const deeplData = await deeplRes.json();
      const translated = deeplData.translations?.[0]?.text;
      if (translated) return translated;
    } catch (deeplError) {
      console.warn("DeepL translation also failed:", deeplError);
    }
  }

  // Final graceful fallback
  return text;
}
