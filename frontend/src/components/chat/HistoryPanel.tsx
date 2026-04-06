"use client";

import { useEffect, useState } from "react";
import { listConversations } from "@/utils/chat";

type Conv = {
  id: number;
  title?: string | null;
  started_at: string;
  updated_at?: string | null;
};

export default function HistoryPanel({
  userId,
  activeId,
  onSelect,
  onNewChat,
}: {
  userId: number | null;
  activeId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
}) {
  const [items, setItems] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await listConversations(userId);
      rows.sort(
        (a: Conv, b: Conv) =>
          new Date(b.updated_at ?? b.started_at).getTime() -
          new Date(a.updated_at ?? a.started_at).getTime()
      );
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const onRefresh = () => refresh();
    window.addEventListener("history-refresh", onRefresh);
    window.addEventListener("pick-conv", onRefresh);
    window.addEventListener("new-conv", onRefresh);
    return () => {
      window.removeEventListener("history-refresh", onRefresh);
      window.removeEventListener("pick-conv", onRefresh);
      window.removeEventListener("new-conv", onRefresh);
    };
  }, [userId]);

  return (
    <aside
      className="
        h-full md:h-[calc(100vh-180px)]
        flex flex-col
        rounded-2xl border border-slate-200 bg-white
        dark:border-slate-800 dark:bg-slate-900
        shadow-sm
        text-slate-900 dark:text-slate-50
        p-4
      "
    >
      <button
        onClick={onNewChat}
        className="
          w-full mb-3 rounded-xl
          bg-gradient-to-r from-sky-500 to-teal-500
          text-white py-2 text-sm font-semibold shadow-sm
          hover:opacity-90 active:opacity-80
        "
      >
        + Obrolan Baru
      </button>


      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 dark:text-slate-300">
          RIWAYAT
        </span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
          {items.length} chat
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {loading && (
          <div className="text-xs text-slate-400 dark:text-slate-300">
            Memuat…
          </div>
        )}

        {items.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`
              w-full text-left px-3 py-2 rounded-lg text-xs
              hover:bg-sky-50 dark:hover:bg-slate-800
              border border-transparent
              ${
                activeId === c.id
                  ? "border-sky-400 bg-sky-50/70 dark:border-teal-400 dark:bg-slate-800"
                  : ""
              }
            `}
            title={c.title ?? `Percakapan #${c.id}`}
          >
            <span className="line-clamp-1 text-[13px] font-medium">
              {c.title ?? `Percakapan #${c.id}`}
            </span>
            <span className="block text-[11px] text-slate-400 dark:text-slate-300">
              {new Date(c.updated_at ?? c.started_at).toLocaleString()}
            </span>
          </button>
        ))}

        {!loading && items.length === 0 && (
          <div className="text-xs text-slate-400 dark:text-slate-300">
            Belum ada riwayat.
          </div>
        )}
      </div>
    </aside>
  );
}
