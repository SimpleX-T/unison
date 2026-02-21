"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { MessageRow } from "@/lib/chat";
import { Send, Loader2 } from "lucide-react";

interface ChannelPageProps {
  channelId: string;
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Individual message with auto-translation */
function ChatMessage({ msg }: { msg: MessageRow }) {
  const { translated, isLoading, isTranslated } = useTranslation(
    msg.id,
    msg.content,
    msg.original_language,
  );

  return (
    <div className="chat-message">
      <UserAvatar
        name={msg.sender?.display_name ?? "?"}
        languageCode={msg.original_language}
        size="md"
      />
      <div className="chat-message-content">
        <p className="chat-message-author">
          {msg.sender?.display_name ?? "Unknown"}
          <LanguageBadge
            languageCode={msg.original_language}
            showName={false}
          />
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-2)",
              marginLeft: 8,
            }}
          >
            {formatTime(msg.created_at)}
          </span>
        </p>
        {isLoading ? (
          <p className="chat-message-text" style={{ opacity: 0.5 }}>
            Translating…
          </p>
        ) : (
          <>
            <p className="chat-message-text">{translated}</p>
            {isTranslated && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--color-text-2)",
                  fontStyle: "italic",
                  marginTop: 2,
                }}
                title={msg.content}
              >
                Translated from {msg.original_language.toUpperCase()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ChannelPage({ channelId }: ChannelPageProps) {
  const user = useAppStore((s) => s.user);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelName, setChannelName] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch channel name + initial messages
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Get channel name
      const { data: ch } = await supabase
        .from("channels")
        .select("name")
        .eq("id", channelId)
        .single();
      if (ch) setChannelName(ch.name);

      // Get messages
      const { data } = await supabase
        .from("messages")
        .select(
          "id, channel_id, sender_id, content, original_language, created_at, profiles:sender_id(id, display_name, avatar_url, preferred_language)",
        )
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        const mapped: MessageRow[] = data
          .map((m) => ({
            id: m.id,
            channel_id: m.channel_id,
            sender_id: m.sender_id,
            content: m.content,
            original_language: m.original_language,
            created_at: m.created_at,
            sender: m.profiles as unknown as MessageRow["sender"],
          }))
          .reverse();
        setMessages(mapped);
      }
      setLoading(false);
    };
    load();
  }, [channelId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            original_language: string;
            created_at: string;
            channel_id: string;
          };
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, preferred_language")
            .eq("id", newMsg.sender_id)
            .single();

          const msg: MessageRow = {
            id: newMsg.id,
            channel_id: newMsg.channel_id,
            sender_id: newMsg.sender_id,
            content: newMsg.content,
            original_language: newMsg.original_language,
            created_at: newMsg.created_at,
            sender: profile ?? undefined,
          };
          setMessages((prev) => [...prev, msg]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");

    await supabase.from("messages").insert({
      channel_id: channelId,
      sender_id: user.id,
      content,
      original_language: user.preferred_language ?? "en",
    });

    setSending(false);
  }, [draft, channelId, user.id, user.preferred_language, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-shell">
      <div className="chat-header">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          # {channelName || channelId}
        </span>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 48 }}
          >
            <Loader2
              size={24}
              style={{
                animation: "spin 1s linear infinite",
                color: "var(--color-text-2)",
              }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              color: "var(--color-text-2)",
              fontSize: 14,
            }}
          >
            No messages yet. Say something! 👋
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-compose">
        <textarea
          className="input"
          style={{
            flex: 1,
            resize: "none",
            minHeight: 44,
            maxHeight: 120,
            fontFamily: "var(--font-ui)",
            fontSize: 14,
          }}
          placeholder="Write a message… (Enter to send)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
        />
        <button
          className="btn btn-sage"
          style={{
            flexShrink: 0,
            height: 44,
            width: 44,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={handleSend}
          disabled={!draft.trim() || sending}
        >
          {sending ? (
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
