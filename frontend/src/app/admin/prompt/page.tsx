"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, RotateCcw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEFAULT_PROMPT = `Halo! 👋 Saya **SIMA-BOT**, asisten layanan mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro 🎓
Saya siap membantu kamu mencari informasi akademik berdasarkan dokumen resmi kampus. 📚

Gunakan gaya bahasa yang sopan, ramah, dan mudah dipahami — seperti staf akademik yang senang membantu mahasiswa 😊

**PENTING:**
- Jika dokumen berisi langkah-langkah, prosedur, atau poin-poin detail, sampaikan semuanya secara lengkap dan berurutan agar mahasiswa paham.
- Sampaikan juga persyaratan (seperti dokumen yang harus dibawa) dan estimasi waktu proses (SLA) jika ada di konteks.
- Jika informasi yang kamu tanyakan belum tersedia di konteks, sampaikan dengan jujur bahwa informasi tersebut belum ada ya 🙏

Konteks:
{context}

---

Pertanyaan: {question}

💬 **Jawaban SIMA-BOT:**`;

export default function PromptPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [originalPrompt, setOriginalPrompt] = useState(DEFAULT_PROMPT);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/admin/prompt`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.prompt) {
            setPrompt(data.prompt);
            setOriginalPrompt(data.prompt);
          }
        }
      } catch {
        // use default
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API}/admin/prompt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        setFeedback("✅ Prompt berhasil disimpan!");
        setOriginalPrompt(prompt);
      } else {
        setFeedback("❌ Gagal menyimpan prompt.");
      }
    } catch {
      setFeedback("❌ Tidak bisa terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = prompt !== originalPrompt;

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Memuat prompt…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">✏️ Prompt Engineering Editor</h2>
        <p className="text-xs text-muted-foreground">
          Edit system prompt yang digunakan oleh RAG pipeline untuk menghasilkan jawaban.
          Variabel <code className="rounded bg-muted px-1 text-xs">{"{context}"}</code> dan{" "}
          <code className="rounded bg-muted px-1 text-xs">{"{question}"}</code> akan
          otomatis diisi saat bot menjawab.
        </p>
      </div>

      <Card className="p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[350px] w-full rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-relaxed focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-slate-700 dark:bg-slate-900"
          spellCheck={false}
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Simpan Prompt
            </Button>
            <Button
              variant="outline"
              onClick={() => setPrompt(DEFAULT_PROMPT)}
              disabled={saving}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset ke Default
            </Button>
          </div>

          {feedback && (
            <span className="text-sm">{feedback}</span>
          )}
        </div>
      </Card>

      <Card className="p-3 text-xs text-muted-foreground">
        <strong>Tips:</strong>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>Gunakan <code>{"{context}"}</code> untuk menandai posisi dokumen referensi.</li>
          <li>Gunakan <code>{"{question}"}</code> untuk menandai posisi pertanyaan mahasiswa.</li>
          <li>Ubah gaya bahasa, format jawaban, atau instruksi khusus sesuai kebutuhan.</li>
          <li>Setelah simpan, prompt langsung aktif untuk semua pertanyaan RAG baru.</li>
        </ul>
      </Card>
    </div>
  );
}
