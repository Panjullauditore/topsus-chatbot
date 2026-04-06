import { useEffect, useState } from "react";
import { getMe, type UserMe } from "@/utils/auth";

export function useMe() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getMe().then(setMe).catch(() => setMe(null)).finally(()=>setLoading(false));
  }, []);
  return { me, loading };
}
