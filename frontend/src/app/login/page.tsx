"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/utils/api";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/dist/client/link";

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res: any = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // try to read role from common shapes: { role }, { user: { role } }, or plain string
      const rawRole = res?.role ?? res?.user?.role ?? res;
      const role = String(rawRole ?? "").toLowerCase();

      if (role === "student") {
        r.replace("/chat");
      } else {
        // default to admin/dashboard for any other role
        r.replace("/admin");
      }
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Soft gradient background */}
      <div
        className="absolute inset-0 pointer-events-none
          bg-gradient-to-br
          from-sky-400 via-white to-emerald-100
          dark:from-[#071025] dark:via-[#05304a] dark:to-[#042039] dark:opacity-95"
      />
      {/* HEADER */}
      <header className="relative z-10 w-full bg-white shadow-md py-4 px-6 flex justify-between items-center dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow">
            <Image
              src="/sima-avatar2.png"
              alt="SIMA Bot"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Chatbot FSM
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300 -mt-1">
              Login ke Sistem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild className="h-8 px-4 text-xs font-semibold">
            <Link href="/">BERANDA</Link>
          </Button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-6xl grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-8 items-center">
          {/*SIMA FULL BODY*/}
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64 md:w-[26rem] md:h-[26rem]">
              <Image
                src="/sima-full1.png"
                alt="SIMA Bot"
                fill
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* LOGIN CARD */}
          <Card className="w-full bg-white/95 dark:bg-slate-950/95 rounded-3xl shadow-2xl p-8">
            <div className="w-full max-w-sm mx-auto">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                Masuk
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Silakan login menggunakan akun Anda.
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="mahasiswa@fsm.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {err && (
                  <p className="text-xs text-red-500 text-center">{err}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#459AFF] hover:bg-[#3480e0]"
                >
                  {loading ? "Memproses..." : "Masuk"}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-8">
                © 2025 FSM UNDIP
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
