"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type MeResponse = {
  id: number;
  username: string;
  email: string;
  role: "admin" | "student";
};

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${API}/auth/me`, { credentials: "include" });
        if (!alive) return;

        if (!res.ok) {
          // belum login → tendang ke login
          if (pathname !== "/login") router.replace("/login");
          return;
        }

        const data: MeResponse = await res.json();

        if (data.role === "admin") {
          setOk(true);
        } else {
          // login tapi bukan admin → arahkan ke halaman biasa (misalnya /)
          router.replace("/");
        }
      } catch {
        if (alive && pathname !== "/login") router.replace("/login");
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, pathname]);

  if (!ready) {
    return <div className="p-4 text-sm text-muted-foreground">Checking session…</div>;
  }

  return ok ? <>{children}</> : null;
}
