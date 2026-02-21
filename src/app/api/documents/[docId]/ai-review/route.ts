import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("created_by, title, title_original_language")
    .eq("id", docId)
    .single();

  if (!doc)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (doc.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the owner can request AI merge" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { mainContent, branchContent, documentLanguage } = body;

  if (!branchContent) {
    return NextResponse.json(
      { error: "Branch content is required" },
      { status: 400 },
    );
  }

  const lang = documentLanguage || doc.title_original_language || "en";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a document merge assistant. Your job is to intelligently combine two versions of a document into one coherent result.

## Rules
- The output MUST be in ${lang} language only.
- Return ONLY the merged document text. No explanations, no commentary, no markdown headers like "## Merged Document".
- Preserve the existing main document content and integrate the collaborator's additions naturally.
- If the collaborator added new paragraphs or sections, place them where they fit best contextually.
- If the collaborator edited existing paragraphs, prefer their updated version if it improves clarity, or blend both if they contain different information.
- If there are contradictions, prefer the collaborator's version but keep any unique information from the main.
- Maintain consistent tone, style, and formatting throughout.
- Do not add any content that doesn't exist in either version.

## Main Document (current version)
${mainContent || "(Empty document)"}

## Collaborator's Contribution
${branchContent}

## Output
Return the merged document text below. Nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const mergedContent = response.text();

    return NextResponse.json({ mergedContent });
  } catch (err) {
    console.error("AI merge failed:", err);
    return NextResponse.json(
      { error: "AI merge failed. Please check your Gemini API key." },
      { status: 500 },
    );
  }
}
