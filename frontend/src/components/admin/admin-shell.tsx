// =====================
// file: components/admin/admin-shell.tsx
// - Kerangka layout admin: sidebar + content
// =====================
import { AdminSidebar } from "./sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-col">{children}</div>
    </div>
  );
}
