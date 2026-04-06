// =====================
// file: components/admin/topbar.tsx
// - Topbar dengan judul halaman + actions (tema, logout)
// =====================
"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { API } from "@/utils/api";

export function AdminTopbar({ title }: { title: string }) {
  const router = useRouter();
  async function onLogout() {
  try {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    // optional: bersih-bersih state lokal
    localStorage.removeItem("chatbot_admin_demo");
    router.replace("/login");
  }
}

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <h1 className="text-sm font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          aria-label="Keluar"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
