"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, FileText, CheckCircle2 } from "lucide-react";

const RAG_URL = process.env.NEXT_PUBLIC_RAG_URL || "http://localhost:8001";

type Doc = { filename: string; size_kb: number };

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`${RAG_URL}/kb/documents`);
      const data = await res.json();
      setDocs(data.documents || []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setFeedback(null);

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setFeedback(`❌ "${file.name}" bukan file PDF.`);
        continue;
      }
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(`${RAG_URL}/kb/upload`, {
          method: "POST",
          body: form,
        });
        if (res.ok) {
          setFeedback(`✅ "${file.name}" berhasil diupload dan di-index.`);
        } else {
          const err = await res.json();
          setFeedback(`❌ Gagal upload "${file.name}": ${err.detail || "Error"}`);
        }
      } catch {
        setFeedback(`❌ Gagal upload "${file.name}": Tidak bisa terhubung ke RAG service.`);
      }
    }

    setUploading(false);
    fetchDocs();
  }

  async function handleDelete(filename: string) {
    if (!confirm(`Hapus "${filename}" dari knowledge base?`)) return;
    setDeleting(filename);
    try {
      const res = await fetch(`${RAG_URL}/kb/documents/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedback(`✅ "${filename}" berhasil dihapus.`);
        fetchDocs();
      } else {
        setFeedback(`❌ Gagal menghapus "${filename}".`);
      }
    } catch {
      setFeedback(`❌ Tidak bisa terhubung ke RAG service.`);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Memuat dokumen…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">📚 Knowledge Base Manager</h2>
        <p className="text-xs text-muted-foreground">
          Upload PDF pedoman akademik untuk menambah pengetahuan bot. File akan otomatis di-index ke
          Vector Database.
        </p>
      </div>

      {/* Drag & Drop Upload Area */}
      <Card
        className={`relative flex min-h-[120px] cursor-pointer items-center justify-center border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30"
            : "border-slate-300 hover:border-sky-300 dark:border-slate-700"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".pdf";
          input.multiple = true;
          input.onchange = () => handleUpload(input.files);
          input.click();
        }}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sky-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Uploading & Indexing…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8 text-sky-400" />
            <span className="text-sm font-medium">
              Drag & drop PDF di sini, atau klik untuk pilih file
            </span>
            <span className="text-xs">Hanya file .pdf yang diterima</span>
          </div>
        )}
      </Card>

      {/* Feedback message */}
      {feedback && (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-sky-500" />
          {feedback}
        </div>
      )}

      {/* Document List */}
      <Card className="divide-y">
        {docs.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Belum ada dokumen PDF. Upload satu untuk memulai.
          </div>
        ) : (
          docs.map((d) => (
            <div
              key={d.filename}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">{d.filename}</span>
                <span className="text-xs text-muted-foreground">
                  ({d.size_kb} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting === d.filename}
                onClick={() => handleDelete(d.filename)}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                {deleting === d.filename ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
