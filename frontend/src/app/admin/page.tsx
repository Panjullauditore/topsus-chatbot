"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getAnalytics, getChatlog } from "@/utils/chat";

const COLORS = {
  primary: "#0c4ba9", // biru FSM
  accent: "#30a7f2",  // biru muda
  teal: "#2dd4bf",
  orange: "#f97316",
  slate: "#94a3b8",
};
const PIE_COLORS = ["#0c4ba9", "#30a7f2", "#2dd4bf", "#f97316", "#94a3b8"];

type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
type Chatlog = Awaited<ReturnType<typeof getChatlog>>;

export default function AdminDashboard() {
  const [ana, setAna] = useState<Analytics | null>(null);
  const [logs, setLogs] = useState<Chatlog["items"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [aJson, lJson] = await Promise.all([
          getAnalytics(),
          getChatlog({ limit: 200, offset: 0 }),
        ]);
        if (!cancelled) {
          setAna(aJson);
          setLogs(Array.isArray(lJson?.items) ? lJson.items : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayChats = ana?.today_conversations ?? 0;

  const topTopics = useMemo(() => {
    const freq = new Map<string, number>();
    for (const it of logs) {
      const key = (it.intent || "").trim();
      if (!key) continue;
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k.replaceAll("_", " "))
      .join(", ") || "—";
  }, [logs]);

  const autoAnsweredPercent = useMemo(() => {
    const assistantMsgs = logs.filter((l) => l.role === "assistant");
    if (!assistantMsgs.length) return 0;
    const auto = assistantMsgs.filter(
      (l) => l.source && ["rasa", "rag", "rules"].includes(String(l.source))
    );
    return Math.round((auto.length / assistantMsgs.length) * 100);
  }, [logs]);

  const last7 = useMemo(() => {
    if (!ana?.messages_per_day?.length) return [];
    return ana.messages_per_day.slice(-7);
  }, [ana]);

  const filteredBySource = useMemo(() => {
  return (ana?.by_source || []).filter((item) => item.key !== "unknown");
  }, [ana]);


  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Memuat dashboard…
      </div>
    );
  }
  if (!ana) return <div className="text-muted-foreground">Gagal memuat data</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Summary cards */}
      <Card className="p-4">
        <div className="text-xs text-muted-foreground">Percakapan hari ini</div>
        <div className="mt-1 text-3xl font-bold text-[#0c4ba9]">{todayChats}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Pesan: <span className="font-medium text-[#30a7f2]">{ana.today_messages}</span>
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-xs text-muted-foreground">Topik populer</div>
        <div className="mt-1 text-sm font-medium text-[#f97316]">{topTopics}</div>
        <div className="mt-2 text-xs text-muted-foreground">Berdasarkan 200 pesan terbaru</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs text-muted-foreground">Answered otomatis</div>
        <div className="mt-1 text-3xl font-bold text-[#2dd4bf]">{autoAnsweredPercent}%</div>
        <div className="mt-1 text-xs text-muted-foreground">(rasa/rag/rules vs total reply)</div>
      </Card>

      {/* Line + Donut side-by-side in same row to look "one analytics" */}
      <Card className="p-4 lg:col-span-2 overflow-visible">
        <div className="text-xs text-muted-foreground">Tren 7 hari terakhir</div>
        <div className="mt-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.accent }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            Total percakapan: <span className="font-medium text-[#0c4ba9]">{ana.total_conversations}</span>
          </div>
          <div>
            Total pesan: <span className="font-medium text-[#30a7f2]">{ana.total_messages}</span>
          </div>
          <div>
            Sumber dominan:{" "}
            <span className="font-medium">
              {[...(ana.by_source || [])].sort((a, b) => b.value - a.value)[0]?.key ?? "—"}
            </span>
          </div>
          <div>
            Rasio role (assistant/user):{" "}
            <span className="font-medium">
              {(() => {
                const a = (ana.by_role || []).find((r) => r.key === "assistant")?.value || 0;
                const u = (ana.by_role || []).find((r) => r.key === "user")?.value || 0;
                return `${a}:${u}`;
              })()}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 overflow-visible">
        <div className="text-xs text-muted-foreground">Distribusi Pesan (Sumber)</div>
        <div className="mt-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 6, right: 12, bottom: 6, left: 12 }}>
              <Pie
                data={filteredBySource}
                dataKey="value"
                nameKey="key"
                innerRadius={20}
                outerRadius={60}
                paddingAngle={3}
                label={(entry: any) =>
                  `${entry.key} ${(Number(entry.percent) * 100).toFixed(0)}%`
                }
                labelLine={false}
                isAnimationActive={false}
              >
                {filteredBySource.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={24}
                formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
