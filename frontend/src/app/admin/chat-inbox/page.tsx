"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getChatlog } from "@/utils/chat";
import MessageBubble from "@/components/chat/MessageBubble";

type LogItem = {
  id: number;
  conversation_id: number;
  user_id?: number | null;
  user_email?: string | null;
  role: "user" | "assistant" | "other";
  content: string;
  source?: string | null;
  confidence?: number | null;
  latency_ms?: number | null;
  created_at: string;
};

type ConversationGroup = {
  conversation_id: number;
  user_email?: string | null;
  last_message: string;
  last_time: string;
  message_count: number;
};

export default function ChatInboxPage() {
  // data mentah dari API
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // filter
  const [q, setQ] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState<"" | "user" | "assistant">("");
  const [source, setSource] = useState<"" | "rasa" | "rag" | "rules" | "unknown">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // inbox selection
  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  // fetch sekali setiap filter berubah
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getChatlog({
      limit: 200,
      offset: 0,
      q,
      role: role || undefined,
      source: source || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      user_email: userEmail || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setLogs((data.items || []) as LogItem[]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, role, source, dateFrom, dateTo, userEmail]);

  // group berdasarkan conversation_id → dipakai untuk panel kiri
  const conversations: ConversationGroup[] = useMemo(() => {
    const map = new Map<number, ConversationGroup>();

    for (const m of logs) {
      const existing = map.get(m.conversation_id);
      const createdAt = new Date(m.created_at);
      if (!existing) {
        map.set(m.conversation_id, {
          conversation_id: m.conversation_id,
          user_email: m.user_email,
          last_message: m.content,
          last_time: m.created_at,
          message_count: 1,
        });
      } else {
        existing.message_count += 1;
        if (createdAt > new Date(existing.last_time)) {
          existing.last_time = m.created_at;
          existing.last_message = m.content;
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime()
    );
  }, [logs]);

  // pesan untuk percakapan yang sedang dipilih (kanan)
  const activeMessages = useMemo(() => {
    if (!activeConvId) return [];
    return logs
      .filter((m) => m.conversation_id === activeConvId)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }, [logs, activeConvId]);

  // auto-select percakapan pertama kalau belum ada yang aktif
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].conversation_id);
    }
  }, [conversations, activeConvId]);

  const renderSourceBadge = (src?: string | null) => {
    if (!src) return null;
    if (src === "rasa") {
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 text-emerald-600"
        >
          rasa
        </Badge>
      );
    }
    if (src === "rag") {
      return (
        <Badge variant="outline" className="border-sky-500/40 text-sky-600">
          rag
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-slate-400/40 text-slate-600">
        {src}
      </Badge>
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] px-4">
      <div className="mx-auto flex h-full max-w-6xl gap-4">
        {/* PANEL KIRI: daftar percakapan */}
        <Card className="flex w-full max-w-xs flex-col overflow-hidden rounded-2xl shadow-sm">
          {/* filter di atas list */}
          <div className="border-b p-3 space-y-2">
            <p className="text-sm font-semibold">Riwayat Chat</p>
            <Input
              placeholder="Cari isi pesan…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Input
              placeholder="Filter Email User"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          {/* list conversation */}
          <div className="flex-1 overflow-y-auto bg-slate-50/40">
            {loading && (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat riwayat percakapan...
              </div>
            )}
            {!loading && conversations.length === 0 && (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                Tidak ada percakapan untuk filter saat ini.
              </div>
            )}
            {!loading && conversations.length > 0 && (
              <div className="p-2 space-y-1">
                {conversations.map((conv) => {
                  const isActive = conv.conversation_id === activeConvId;
                  return (
                    <button
                      key={conv.conversation_id}
                      onClick={() => setActiveConvId(conv.conversation_id)}
                      className={[
                        "w-full rounded-lg px-3 py-2 text-left text-xs transition",
                        "hover:bg-slate-100",
                        isActive ? "bg-slate-100" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#0c4ba9]">
                          {conv.user_email ?? "Anonim"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(conv.last_time).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                        {conv.last_message}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="rounded-full bg-slate-100 px-2 py-[1px] text-[10px] text-slate-500">
                          {conv.message_count} pesan
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* PANEL KANAN: detail percakapan (READ ONLY) */}
        <Card className="flex flex-1 flex-col overflow-hidden rounded-2xl shadow-sm">
          {/* header filter tambahan */}
          <div className="flex flex-wrap items-center gap-2 border-b p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Inbox Percakapan</span>
              {activeConvId && (
                <span className="rounded-full bg-slate-100 px-2 py-[1px] text-[11px] text-slate-500">
                  ID Percakapan #{activeConvId}
                </span>
              )}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <select
                className="rounded-md border bg-background px-2 py-1 text-[11px]"
                value={role}
                onChange={(e) => setRole(e.target.value as "" | "user" | "assistant")}
              >
                <option value="">Role: Semua</option>
                <option value="user">user</option>
                <option value="assistant">assistant</option>
              </select>

              <select
                className="rounded-md border bg-background px-2 py-1 text-[11px]"
                value={source}
                onChange={(e) => setSource(e.target.value as "" | "rasa" | "rag" | "rules" | "unknown")}
              >
                <option value="">Source: Semua</option>
                <option value="rasa">rasa</option>
                <option value="rag">rag</option>
                <option value="rules">rules</option>
                <option value="unknown">unknown</option>
              </select>

              <input
                type="date"
                className="rounded-md border bg-background px-2 py-1 text-[11px]"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <input
                type="date"
                className="rounded-md border bg-background px-2 py-1 text-[11px]"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* isi percakapan */}
          {!activeConvId || activeMessages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <p className="text-sm font-medium mb-1">Inbox Percakapan</p>
              <p className="max-w-sm">
                Pilih salah satu sesi percakapan dari panel sebelah kiri untuk
                melihat detail transkrip chat secara lengkap.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto bg-slate-50/60">
              <div className="flex flex-col gap-3 p-4">
                {activeMessages.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <MessageBubble
                      sender={m.role === "assistant" ? "bot" : "user"}
                      text={m.content}
                    />
                    <div className="flex items-center gap-2 pl-10 text-[10px] text-slate-400">
                      <span>
                        {new Date(m.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {renderSourceBadge(m.source)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* footer kecil */}
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground flex justify-between">
            <span>
              Total log: {logs.length} pesan, {conversations.length} percakapan
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ("");
                setUserEmail("");
                setRole("");
                setSource("");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Reset filter
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
