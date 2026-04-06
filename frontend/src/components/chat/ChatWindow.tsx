//chatwindow
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send } from "lucide-react";
import MessageBubble from "./MessageBubble";
import SuggestedPrompts from "./SuggestedPrompts";
import ContactStaff from "./ContactStaff";
import { type MessageOut, sendChat, listMessages } from "@/utils/chat";

// Kita pakai shape dari backend
type ChatMessage = MessageOut;

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Halo! Aku Chatbot FSM. Ada yang bisa dibantu? 😊",
      created_at: new Date().toISOString(),
    },
  ]);

  const [convId, setConvId] = useState<number | null>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("convId") : null;
    return saved ? Number(saved) : null;
  });

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [fallbackCount, setFallbackCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track consecutive fallbacks
  const showContactStaff = fallbackCount >= 3;

  // Show suggested prompts only when no real conversation yet
  const showSuggestions = useMemo(() => {
    const realMessages = messages.filter(
      (m) => m.role === "user" || (m.role === "assistant" && m.source)
    );
    return realMessages.length === 0;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Tampilkan bubble user + ghost bubble bot sementara
  function pushUserAndGhost(text: string, ghostLabel = "…") {
    const base = Date.now();
    const userMsg: ChatMessage = {
      id: base,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    const botGhost: ChatMessage = {
      id: base + 1,
      role: "assistant",
      content: ghostLabel,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, botGhost]);
    return botGhost.id;
  }

  async function onSend(text: string) {
    const clean = text.trim();
    if (!clean || pending) return;
    setPending(true);

    const ghostId = pushUserAndGhost(clean);
    setInput("");

    try {
      const res = await sendChat({
        conversationId: convId ?? undefined,
        text: clean,
      });

      // simpan convId baru jika ada
      setConvId(res.conversation_id);
      window.dispatchEvent(new Event("history-refresh"));
      localStorage.setItem("convId", String(res.conversation_id));

      // Track fallback count
      const lastBotMsg = res.messages_tail
        .filter((m) => m.role === "assistant")
        .pop();
      if (lastBotMsg?.source === "rules") {
        setFallbackCount((prev) => prev + 1);
      } else {
        setFallbackCount(0); // reset on successful answer
      }

      // backend sudah kirim tail (termasuk balasan terbaru)
      const sorted = [...res.messages_tail].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sorted);
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === ghostId
            ? { ...m, content: `⚠️ Gagal menghubungi server. ${e?.message ?? ""}` }
            : m
        )
      );
    } finally {
      setPending(false);
    }
  }

  const disableInput = pending;
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // === Load messages for a conversation ===
  async function loadConvMessages(id: number, limit = 20) {
    try {
      const msgs = await listMessages(id, limit);
      msgs.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(msgs);
    } catch {
      setMessages([
        {
          id: Date.now(),
          role: "assistant",
          content: "⚠️ Gagal memuat riwayat percakapan.",
          created_at: new Date().toISOString(),
        },
      ] as MessageOut[]);
    }
  }

  // === ketika convId berubah, muat pesan ===
  useEffect(() => {
    if (convId) loadConvMessages(convId, 20);
  }, [convId]);

  // dengarkan event dari HistoryPanel
  useEffect(() => {
    function onPick(e: any) {
      const id = e.detail ?? null;
      setConvId(id);
      localStorage.setItem("convId", String(id));
      setMessages([]);
      setFallbackCount(0);
      if (id) loadConvMessages(id, 20);
    }
    function onNew() {
      setConvId(null);
      localStorage.removeItem("convId");
      setMessages([]);
      setFallbackCount(0);
    }
    window.addEventListener("pick-conv", onPick as any);
    window.addEventListener("new-conv", onNew as any);
    return () => {
      window.removeEventListener("pick-conv", onPick as any);
      window.removeEventListener("new-conv", onNew as any);
    };
  }, []);

  return (
    <Card
      className="
        mx-auto w-full max-w-2xl overflow-hidden
        border border-slate-200 bg-white
        dark:border-slate-800 dark:bg-slate-900
        shadow-sm
        flex h-full flex-col 
        overflow-hidden
      "
    >
      {/* Strip aksen di atas */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-teal-400 to-amber-400" />

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 border border-sky-200 shadow-sm overflow-hidden">
          <img src="/sima-avatar1.png" alt="SIMA Bot" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Chatbot FSM</span>
          <span className="text-xs text-slate-500">
            Fakultas Sains dan Matematika, UNDIP
          </span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="h-[62vh] px-4 py-4">
        <div className="space-y-3">
          {sortedMessages.map((m) => (
            <div key={m.id}>
              <MessageBubble
                sender={m.role === "assistant" ? "bot" : "user"}
                text={m.content}
                messageId={m.id}
                source={m.source}
              />
            </div>
          ))}

          {/* Contact Staff banner after 3 fallbacks */}
          <ContactStaff show={showContactStaff} />

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Suggested Prompts */}
      {showSuggestions && (
        <SuggestedPrompts
          onSelect={(prompt) => onSend(prompt)}
          disabled={pending}
        />
      )}

      {/* Composer */}
      <div className="space-y-2 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend(input);
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Tulis pesan… mis. 'formulir cuti', 'kalender akademik', 'pedoman skripsi'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            disabled={disableInput}
          />
          <Button
            type="submit"
            aria-label="Kirim"
            disabled={disableInput || !input.trim()}
            className="bg-sky-600 hover:bg-sky-700"
          >
            <Send className="mr-1 h-4 w-4" />
            {pending ? "Mengirim…" : "Kirim"}
          </Button>
        </form>

        <p className="text-center text-[11px] text-slate-400">
          © 2025 by Muthia — IF 22 — FSM
        </p>
      </div>
    </Card>
  );
}
