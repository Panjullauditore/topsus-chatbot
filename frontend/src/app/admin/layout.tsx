"use client";

import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTopbar } from "@/components/admin/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Pastikan layout tidak berkedip di sisi client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ambil segmen path untuk title dinamis
  const segments = (pathname || "/admin").split("/").filter(Boolean);
  const section = segments[1] || "";

  const titleMap: Record<string, string> = {
    "": "Dashboard",
    logs: "Chat Logs",
    users: "Users",
    unanswered: "Pertanyaan Belum Terjawab",
    knowledge: "Knowledge Base",
    prompt: "Prompt Editor",
    "chat-inbox": "Chat Inbox",
  };
  const title = titleMap[section] ?? "Admin";

  if (!mounted) {
    // Skeleton biar smooth loading waktu hydration
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-muted/20">
        <AdminShell>
          <AdminTopbar title={title} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </AdminShell>
      </div>
    </AdminGuard>
  );
}
