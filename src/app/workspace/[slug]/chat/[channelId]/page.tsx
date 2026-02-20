"use client";
import { use } from "react";
import { ChannelPage } from "@/components/chat/ChannelPage";

interface ChatPageProps {
  params: Promise<{ slug: string; channelId: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { channelId } = use(params);
  return <ChannelPage channelId={channelId} />;
}
