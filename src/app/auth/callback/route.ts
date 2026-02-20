import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/workspace/select";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] code exchange failed:", error?.message);
    return NextResponse.redirect(`${origin}/auth?error=exchange_failed`);
  }

  const user = data.user;

  // Check if this user already has a profile
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    // Existing user — send to their workspace (or intended destination)
    return NextResponse.redirect(`${origin}${next}`);
  }

  // New user — create a stub profile and send to onboarding
  // Username derived from email prefix, made unique with a random suffix
  const emailPrefix = (user.email ?? "user")
    .split("@")[0]
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
  const suffix = Math.random().toString(36).slice(2, 6);
  const username = `${emailPrefix}_${suffix}`;

  await supabase.from("profiles").insert({
    id: user.id,
    username,
    display_name: user.user_metadata?.full_name ?? emailPrefix,
    preferred_language: "en",
    avatar_url: user.user_metadata?.avatar_url ?? null,
    timezone: "UTC",
  });

  return NextResponse.redirect(`${origin}/onboarding`);
}
