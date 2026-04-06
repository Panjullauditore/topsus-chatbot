"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import ChatWindow from "@/components/chat/ChatWindow";
import HistoryPanel from "@/components/chat/HistoryPanel";
import { useMe } from "@/hooks/useMe";
import { LogOut, Menu, X, MessageCircle } from "lucide-react";
import { API } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const { me, loading } = useMe();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const router = useRouter();

  async function onLogout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      localStorage.removeItem("chatbot_admin_demo");
      router.replace("/login");
    }
  }

  // sinkron dengan event dari ChatWindow
  useEffect(() => {
    const onPicked = (e: any) => setActiveConvId(e.detail ?? null);
    const onNew = () => setActiveConvId(null);
    window.addEventListener("pick-conv", onPicked as any);
    window.addEventListener("new-conv", onNew as any);
    return () => {
      window.removeEventListener("pick-conv", onPicked as any);
      window.removeEventListener("new-conv", onNew as any);
    };
  }, []);

  if (loading) return <div className="p-6">Memuat…</div>;
  if (!me) return <div className="p-6">Silakan login dulu.</div>;

  return (
    <div className="h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 md:px-6">
          {/* Kiri: logo + title */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 border border-sky-200">
              <img src="/sima-avatar3.png" alt="SIMA-BOT" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide">
                SIMA-BOT FSM
              </span>
              <span className="text-[11px] text-slate-500">
                Layanan Akademik • Fakultas Sains dan Matematika
              </span>
            </div>
          </Link>

          {/* Kanan: tombol riwayat (mobile) + theme + logout */}
          <div className="flex items-center gap-2">
            {/* Tombol riwayat hanya di mobile */}
            <button
              type="button"
              onClick={() => setMobileHistoryOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs font-medium text-sky-700 shadow-sm hover:bg-sky-50 md:hidden"
            >
              <Menu className="h-4 w-4" />
              Riwayat
            </button>

            <ThemeToggle />
            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* KONTEN */}
      <main className="flex-1 px-2 py-4 md:px-6 md:py-6">
        <div className="mx-auto flex max-w-6xl gap-6">
          {/* Sidebar history – hanya desktop */}
          <div className="hidden md:block w-[280px] shrink-0">
            <HistoryPanel
              userId={me.id}
              activeId={activeConvId}
              onSelect={(id) => {
                setActiveConvId(id);
                window.dispatchEvent(new CustomEvent("pick-conv", { detail: id }));
              }}
              onNewChat={() => {
                setActiveConvId(null);
                window.dispatchEvent(new CustomEvent("new-conv"));
              }}
            />
          </div>

          {/* Chat window */}
          <div className="flex-1">
            <ChatWindow />
          </div>
        </div>
      </main>

      {/* DRAWER RIWAYAT – MOBILE*/}
      {mobileHistoryOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Panel */}
          <div className="flex h-full w-64 max-w-[80%] flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-sm font-semibold">Riwayat percakapan</span>
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-3">
              <HistoryPanel
                userId={me.id}
                activeId={activeConvId}
                onSelect={(id) => {
                  setActiveConvId(id);
                  window.dispatchEvent(
                    new CustomEvent("pick-conv", { detail: id })
                  );
                  setMobileHistoryOpen(false);
                }}
                onNewChat={() => {
                  setActiveConvId(null);
                  window.dispatchEvent(new CustomEvent("new-conv"));
                  setMobileHistoryOpen(false);
                }}
              />
            </div>
          </div>

          {/* Overlay */}
          <button
            type="button"
            className="flex-1 bg-black/30"
            aria-label="Tutup riwayat"
            onClick={() => setMobileHistoryOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
