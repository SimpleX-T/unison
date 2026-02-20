import { createClient } from "@/lib/supabase/server";

export interface ChannelRow {
  id: string;
  workspace_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  original_language: string;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    preferred_language: string;
  };
}

/** Get all channels in a workspace */
export async function getChannels(workspaceId: string): Promise<ChannelRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Get paginated messages for a channel (newest last) */
export async function getMessages(
  channelId: string,
  limit = 50,
): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select(
      "id, channel_id, sender_id, content, original_language, created_at, profiles:sender_id(id, display_name, avatar_url, preferred_language)",
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  // Map to MessageRow with nested sender
  return data
    .map((m) => ({
      id: m.id,
      channel_id: m.channel_id,
      sender_id: m.sender_id,
      content: m.content,
      original_language: m.original_language,
      created_at: m.created_at,
      sender: m.profiles as unknown as MessageRow["sender"],
    }))
    .reverse(); // chronological order
}

/** Send a message */
export async function sendMessage(
  channelId: string,
  content: string,
  language: string,
): Promise<MessageRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      sender_id: user.id,
      content,
      original_language: language,
    })
    .select("id, channel_id, sender_id, content, original_language, created_at")
    .single();

  if (error) {
    console.error("[sendMessage]", error);
    return null;
  }
  return data;
}

/** Create a channel */
export async function createChannel(
  workspaceId: string,
  name: string,
): Promise<ChannelRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("channels")
    .insert({
      workspace_id: workspaceId,
      name: name.toLowerCase().replace(/\s+/g, "-"),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return null;
  return data;
}
