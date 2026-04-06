import { api } from "./api";

export type MessageOut = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  source?: "rasa" | "rag" | "rules" | null;
  intent?: string | null;
  confidence?: number | null;
  latency_ms?: number | null;
  meta?: Record<string, unknown>;
};

export type ChatResponse = {
  conversation_id: number;
  reply: string;
  messages_tail: MessageOut[];
};

export async function sendChat({
  conversationId,
  text,
}: {
  conversationId?: number;
  text: string;
}) {
  return api<ChatResponse>("/chat/send", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: conversationId ?? null,
      user_message: text,
    }),
  });
}

/** Ambil daftar percakapan milik user yang login (token/cookie) */
export async function listConversations(userId?: number) {
  const suffix = userId ? `?user_id=${userId}` : "";
  return api<{ id: number; conversation_id?: number }[]>(
    `/chat/conversations${suffix}`
  );
}

export async function listMessages(convId: number, limit = 50) {
  return api<MessageOut[]>(
    `/chat/conversations/${convId}/messages?limit=${limit}`
  );
}

export async function closeConversation(convId: number) {
  return api(`/chat/conversations/${convId}/close`, { method: "POST" });
}

export async function deleteConversation(convId: number) {
  return api(`/chat/conversations/${convId}`, { method: "DELETE" });
}

/* ===========================================
   📊 ADMIN ANALYTICS
   =========================================== */
export type Analytics = {
  total_conversations: number;
  total_messages: number;
  today_conversations: number;
  today_messages: number;
  by_source: { key: string; value: number }[];
  by_role: { key: string; value: number }[];
  messages_per_day: { date: string; count: number }[];
};

/** Ambil ringkasan data analytics untuk dashboard admin */
export async function getAnalytics() {
  return api<Analytics>("/chat/analytics");
}

/* ===========================================
   🧾 ADMIN CHAT LOG
   =========================================== */
export type ChatLogItem = {
  id: number;
  conversation_id: number;
  user_id?: number | null;
  user_email?: string | null;
  role: "user" | "assistant" | "other";
  content: string;
  source?: string | null;
  intent?: string | null;
  confidence?: number | null;
  latency_ms?: number | null;
  created_at: string;
};

export async function getChatlog(params?: {
  limit?: number;
  offset?: number;
  user_id?: number;
  user_email?: string;
  conversation_id?: number;
  role?: "user" | "assistant";
  source?: string;
  intent?: string;
  q?: string;
  date_from?: string; // "YYYY-MM-DD"
  date_to?: string; // "YYYY-MM-DD"
}) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });

  const url = `/chat/chatlog${qs.toString() ? `?${qs.toString()}` : ""}`;
  return api<{ total: number; items: ChatLogItem[] }>(url);
}

/* ===========================================
   👍👎 FEEDBACK
   =========================================== */
export async function submitFeedback(params: {
  message_id: number;
  vote: "up" | "down";
  comment?: string;
}) {
  return api<{
    id: number;
    message_id: number;
    vote: string;
    comment: string | null;
    created_at: string;
  }>("/feedback", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
