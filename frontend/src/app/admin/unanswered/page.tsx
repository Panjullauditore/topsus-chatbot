"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import { getChatlog, type ChatLogItem } from "@/utils/chat";

export default function UnansweredPage() {
  const [items, setItems] = useState<ChatLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Fetch user messages that resulted in "rules" source (fallback)
        const res = await getChatlog({ limit: 200, offset: 0, source: "rules" });
        setItems(Array.isArray(res?.items) ? res.items : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group by intent and count frequency
  const grouped = useMemo(() => {
    const freq = new Map<
      string,
      { intent: string; count: number; examples: string[]; lastDate: string }
    >();

    for (const it of items) {
      const key = it.intent || "unknown";
      const existing = freq.get(key);
      if (existing) {
        existing.count += 1;
        if (existing.examples.length < 3) {
          existing.examples.push(it.content);
        }
        if (it.created_at > existing.lastDate) {
          existing.lastDate = it.created_at;
        }
      } else {
        freq.set(key, {
          intent: key,
          count: 1,
          examples: [it.content],
          lastDate: it.created_at,
        });
      }
    }

    return Array.from(freq.values())
      .sort((a, b) => b.count - a.count)
      .filter(
        (g) =>
          !search ||
          g.intent.toLowerCase().includes(search.toLowerCase()) ||
          g.examples.some((e) => e.toLowerCase().includes(search.toLowerCase()))
      );
  }, [items, search]);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Memuat data…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Pertanyaan Belum Terjawab
          </h2>
          <p className="text-xs text-muted-foreground">
            Pertanyaan yang masuk fallback (source: rules) — peluang untuk menambah dokumen RAG
            atau intent Rasa baru.
          </p>
        </div>
        <Input
          placeholder="Cari intent atau teks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
      </div>

      {grouped.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          Tidak ada pertanyaan yang belum terjawab. 🎉
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map((g) => (
            <Card key={g.intent} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      {g.intent.replaceAll("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {g.count}× muncul
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {g.examples.map((ex, i) => (
                      <p
                        key={i}
                        className="text-sm text-muted-foreground italic"
                      >
                        &ldquo;{ex}&rdquo;
                      </p>
                    ))}
                    {g.count > 3 && (
                      <p className="text-xs text-muted-foreground">
                        …dan {g.count - 3} pertanyaan serupa lainnya
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Terakhir:{" "}
                  {new Date(g.lastDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
