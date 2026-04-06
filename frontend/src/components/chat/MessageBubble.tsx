"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { submitFeedback } from "@/utils/chat";

interface MessageBubbleProps {
  sender: "bot" | "user";
  text: string;
  messageId?: number;
  source?: string | null;
  /** Opsional: path avatar bot, default: /sima.png */
  avatarSrc?: string;
}

export default function MessageBubble({
  sender,
  text,
  messageId,
  source,
  avatarSrc = "/sima-avatar5.png",
}: MessageBubbleProps) {
  const isUser = sender === "user";
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [sending, setSending] = useState(false);

  async function handleVote(v: "up" | "down") {
    if (!messageId || sending) return;
    setSending(true);
    try {
      await submitFeedback({ message_id: messageId, vote: v });
      setVote(v);
    } catch (e) {
      console.error("Feedback error:", e);
    } finally {
      setSending(false);
    }
  }

  const CommonMD = ({ children }: { children: string }) => (
    <ReactMarkdown
      components={{
        // paragraf lebih rapat
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        // list lebih rapat
        li: ({ children }) => <li className="ml-4 list-disc">{children}</li>,
        // link: putus di mana saja biar ga overflow
        a: (props) => (
          <a
            {...props}
            target="_blank"
            rel="noreferrer"
            className="underline hover:opacity-80 break-all"
          />
        ),
        // code inline/blocks tetap wrap
        code: ({ children }) => (
          <code className="rounded bg-black/10 px-1 py-0.5 text-[12px] whitespace-pre-wrap break-words">
            {children}
          </code>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="
            max-w-[80%] rounded-2xl rounded-br-none px-4 py-2 shadow-sm
            bg-blue-600 text-white
            whitespace-pre-wrap break-words [overflow-wrap:anywhere]
          "
        >
          <CommonMD>{text}</CommonMD>
        </div>
      </div>
    );
  }

  // BOT
  return (
    <div className="group flex items-start gap-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={avatarSrc} alt="Chatbot FSM" />
        <AvatarFallback className="text-xs">🤖</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div
          className="
            max-w-[80%] rounded-2xl rounded-bl-none px-4 py-2 shadow-sm
            bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200
            whitespace-pre-wrap break-words [overflow-wrap:anywhere]
            prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
          "
        >
          <CommonMD>{text}</CommonMD>
        </div>

        {/* Source label + Feedback buttons */}
        <div className="flex items-center gap-2">
          {source && (
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              source: {source}
            </span>
          )}
          {messageId && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => handleVote("up")}
                disabled={sending || vote !== null}
                className={`rounded p-1 transition-colors ${
                  vote === "up"
                    ? "text-green-500"
                    : "text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                }`}
                title="Jawaban membantu"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleVote("down")}
                disabled={sending || vote !== null}
                className={`rounded p-1 transition-colors ${
                  vote === "down"
                    ? "text-red-500"
                    : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                }`}
                title="Jawaban kurang tepat"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
