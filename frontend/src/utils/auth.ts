import { api } from "@/utils/api";

export type UserMe = { id: number; username: string; email: string; role: "student"|"admin"; avatar?: string|null };

export async function getMe(): Promise<UserMe> {
  // backend harus punya /auth/me yang baca token cookie dan balikin user
  return api<UserMe>("/auth/me");
}
