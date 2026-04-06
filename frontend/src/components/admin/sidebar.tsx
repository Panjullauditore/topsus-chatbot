// =====================
// file: components/admin/sidebar.tsx
// - Sidebar navigasi admin
// =====================
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquareText,
  MessageSquarePlus,
  User,
  AlertTriangle,
  BookOpen,
  Pen,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/logs", label: "Chat Logs", icon: MessageSquareText },
  { href: "/admin/unanswered", label: "Belum Terjawab", icon: AlertTriangle },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/admin/prompt", label: "Prompt Editor", icon: Pen },
  { href: "/admin/chat-inbox", label: "Chat Inbox", icon: MessageSquarePlus },
  { href: "/admin/users", label: "Users", icon: User },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 border-r bg-card/40 p-3 md:block">
      <div className="mb-4 px-2 text-sm font-semibold">Admin • Chatbot FSM</div>
      <nav className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                active ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
