"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createUser, deleteUser, getUsers, updateUser } from "@/utils/users";


type Role = "admin" | "student";

type UserItem = {
  id: number;
  username: string;
  email: string;
  role: Role;
  // avatar?: string | null; // aktifkan kalau backend return avatar
};

type ListResponse = {
  total: number;
  items: UserItem[];
};

export default function UsersPage() {
  // data
  const [items, setItems] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // filters & pagination
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1); // 1-based

  const offset = (page - 1) * limit;
  const pages = Math.max(1, Math.ceil(total / limit));

  // modal states
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState<null | number>(null);
  const [submitting, setSubmitting] = useState(false);

  // form model
  const [editId, setEditId] = useState<number | null>(null);
  const [fUsername, setFUsername] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fRole, setFRole] = useState<Role>("student");
  const [fPassword, setFPassword] = useState("");

  const hintRange = useMemo(() => {
    if (!total) return "0 dari 0";
    const from = offset + 1;
    const to = Math.min(offset + limit, total);
    return `${from}-${to} dari ${total}`;
  }, [offset, limit, total]);

  // fetcher
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getUsers({ q, limit, offset })
      .then((res: ListResponse) => {
        if (cancelled) return;
        setItems(res.items || []);
        setTotal(res.total || 0);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [q, limit, offset]);

  // reset ke page 1 saat filter/search berubah
  useEffect(() => {
    setPage(1);
  }, [q, limit]);

  // handlers
  const onNew = () => {
    setEditId(null);
    setFUsername("");
    setFEmail("");
    setFRole("student");
    setFPassword("");
    setOpenForm(true);
  };

  const onEdit = (u: UserItem) => {
    setEditId(u.id);
    setFUsername(u.username);
    setFEmail(u.email);
    setFRole(u.role);
    setFPassword(""); // kosong; hanya diisi kalau mau ganti
    setOpenForm(true);
  };

  const onSubmit = async () => {
    if (!fUsername.trim() || !fEmail.trim()) return;
    setSubmitting(true);
    try {
      if (editId === null) {
        // create
        await createUser({
          username: fUsername.trim(),
          email: fEmail.trim(),
          role: fRole,
          password: fPassword || "changeme123!", // aman: backend wajib hash; ganti sesuai kebutuhan
        });
      } else {
        // update (password opsional)
        await updateUser(editId, {
          username: fUsername.trim(),
          email: fEmail.trim(),
          role: fRole,
          password: fPassword || undefined,
        });
      }
      // refresh list
      setOpenForm(false);
      setPage(1); 
      setLoading(true); 
      const res = await getUsers({ q, limit, offset: 0 });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setLoading(false); 
    } catch (error) {
       console.error("Gagal menyimpan user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deleteUser(id);
      setOpenDelete(null);
      // refresh list (tetap di halaman sekarang, adjust kalau kosong)
      const newOffset = Math.min(offset, Math.max(0, (total - 1 - 1) - ((total - 1 - 1) % limit)));
      const newPage = Math.max(1, Math.floor(newOffset / limit) + 1);
      const res = await getUsers({ q, limit, offset: (newPage - 1) * limit });
      setItems(res.items || []);
      setTotal((prev) => Math.max(0, prev - 1));
      setPage(newPage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2">
            <Input
              placeholder="Cari nama/email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="rounded-md border bg-background px-2 py-2 text-sm"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / halaman
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onNew}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah User
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat users...
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 [&>td]:px-3 [&>td]:py-2">
                      <td className="text-xs text-muted-foreground">{u.id}</td>
                      <td className="font-medium">{u.username}</td>
                      <td className="text-muted-foreground">{u.email}</td>
                      <td>
                        <Badge
                          variant="outline"
                          className={
                            u.role === "admin"
                              ? "border-[#0c4ba9]/40 text-[#0c4ba9]"
                              : "border-[#30a7f2]/40 text-[#30a7f2]"
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => onEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setOpenDelete(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada data user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs">
              <div className="text-muted-foreground">{hintRange}</div>
              <div className="flex items-center gap-2">
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

      {/* Create / Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId === null ? "Tambah User" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {editId === null
                ? "Buat akun baru untuk admin/mahasiswa."
                : "Perbarui data user. Kosongkan password jika tidak ingin diganti."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid gap-1.5">
              <Label>Nama</Label>
              <Input
                value={fUsername}
                onChange={(e) => setFUsername(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={fEmail}
                onChange={(e) => setFEmail(e.target.value)}
                placeholder="nama@undip.ac.id"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={fRole}
                onChange={(e) => setFRole(e.target.value as Role)}
              >
                <option value="student">student</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Password {editId !== null && <span className="text-muted-foreground">(opsional)</span>}</Label>
              <Input
                type="password"
                value={fPassword}
                onChange={(e) => setFPassword(e.target.value)}
                placeholder={editId === null ? "Minimal 8 karakter" : "Biarkan kosong kalau tidak diganti"}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button onClick={onSubmit} disabled={submitting || !fUsername || !fEmail}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId === null ? "Simpan" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={openDelete !== null} onOpenChange={() => setOpenDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Aksi ini tidak bisa dibatalkan. Yakin ingin menghapus user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpenDelete(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => openDelete !== null && onDelete(openDelete)}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
