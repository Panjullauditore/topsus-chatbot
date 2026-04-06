"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getChatlog } from "@/utils/chat";

type LogItem = {
  id: number;
  conversation_id: number;
  user_id?: number | null;
  user_email?: string | null;
  role: string;
  content: string;
  source?: string | null;
  confidence?: number | null;
  latency_ms?: number | null;
  created_at: string;
};

export default function LogsPage() {
  // data
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // search & filters
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | "user" | "assistant">("");
  const [source, setSource] = useState<"" | "rasa" | "rag" | "rules" | "unknown">("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [userId, setUserId] = useState<string>(""); // NEW
  const [userEmail, setUserEmail] = useState<string>("");

  // pagination
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1); // 1-based

  const offset = (page - 1) * limit;
  const pages = Math.max(1, Math.ceil(total / limit));

  // fetcher
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getChatlog({
      limit,
      offset,
      q,
      role: role || undefined,
      source: source || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      user_email: userEmail || undefined, // NEW
      })
      .then((data) => {
        if (cancelled) return;
        setLogs(data.items || []);
        setTotal(data.total || 0);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [limit, offset, q, role, source, dateFrom, dateTo, userEmail]);


  // reset ke page 1 kalau filter berubah
  useEffect(() => {
    setPage(1);
  }, [q, role, source, dateFrom, dateTo, limit, userEmail]);

  const hintRange = useMemo(() => {
    if (!total) return "0 dari 0";
    const from = offset + 1;
    const to = Math.min(offset + limit, total);
    return `${from}-${to} dari ${total}`;
  }, [offset, limit, total]);

  // helper kecil buat badge sumber
  const renderSourceBadge = (src?: string | null) => {
    if (!src) return <span>-</span>;
    if (src === "rasa") {
      return (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
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
    <div className="space-y-3">
      {/* Filters */}
      <Card className="p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <Input
            placeholder="Cari isi pesan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <Input
            placeholder="Email User (opsional)"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />

          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="">Role: Semua</option>
            <option value="user">user</option>
            <option value="assistant">assistant</option>
          </select>

          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value as any)}
          >
            <option value="">Source: Semua</option>
            <option value="rasa">rasa</option>
            <option value="rag">rag</option>
            <option value="rules">rules</option>
            <option value="unknown">unknown</option>
          </select>

          <input
            type="date"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <input
            type="date"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat data log...
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Email User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Isi Pesan</TableHead>
                  <TableHead>Sumber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm font-medium text-[#0c4ba9]">
                      {r.user_email ?? (r.user_id ? `ID ${r.user_id}` : "Anon")}
                    </TableCell>


                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.role === "assistant"
                            ? "border-[#0c4ba9]/40 text-[#0c4ba9]"
                            : "border-[#f97316]/40 text-[#f97316]"
                        }
                      >
                        {r.role}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm whitespace-normal break-words">
                      {r.content}
                    </TableCell>


                    <TableCell className="text-xs">
                      {renderSourceBadge(r.source)}
                    </TableCell>
                  </TableRow>
                ))}

                {!logs.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Tidak ada data untuk filter saat ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs">
              <div className="text-muted-foreground">{hintRange}</div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border bg-background px-2 py-1"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} / halaman
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <span className="min-w-[4rem] text-center">
                  {page} / {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
