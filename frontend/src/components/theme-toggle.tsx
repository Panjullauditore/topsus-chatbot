// =====================
// file: components/theme-toggle.tsx
// - Tombol toggle tema: light <-> dark
// (Dengan perbaikan untuk hydration mismatch)
// =====================
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect hanya berjalan di client, setelah component ter-mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Jika belum ter-mount, jangan render apa-apa (atau render placeholder)
  // Ini memastikan server dan client render hal yang sama pada awalnya
  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}