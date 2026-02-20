import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, fromLanguage, toLanguage } = await req.json();

  if (!text || !toLanguage) {
    return NextResponse.json({ translated: text ?? "" });
  }

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

    return NextResponse.json({ translated: result });
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
      if (translated) {
        return NextResponse.json({ translated });
      }
    } catch (deeplError) {
      console.warn("DeepL translation also failed:", deeplError);
    }
  }

  // Final graceful fallback: return original text
  return NextResponse.json({ translated: text });
}
