// src/utils/users.ts
// Sesuaikan BASE_URL & auth header sesuai proyekmu.
// Kalau sudah ada helper fetchWithAuth, pakai itu.

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getUsers(params: {
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const res = await fetch(`${BASE_URL}/users?${query.toString()}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(body: {
  username: string;
  email: string;
  role: "admin" | "student";
  password: string;
}) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function updateUser(
  id: number,
  body: {
    username?: string;
    email?: string;
    role?: "admin" | "student";
    password?: string; // opsional
    avatar?: string | null;
  }
) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

export async function deleteUser(id: number) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return true;
}
