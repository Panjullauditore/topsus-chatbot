"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const PROMPTS = [
  "Cara pengajuan cuti akademik?",
  "Syarat proposal kegiatan ormawa?",
  "Kalender akademik semester ini",
  "Pedoman skripsi terbaru",
  "Cara bayar UKT terlambat?",
  "Formulir dispensasi kuliah",
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export default function SuggestedPrompts({ onSelect, disabled }: SuggestedPromptsProps) {
  return (
    <div className="space-y-2 px-1 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span>Coba tanya:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PROMPTS.map((p) => (
          <Button
            key={p}
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(p)}
            className="h-auto whitespace-normal rounded-full border-sky-200 px-3 py-1.5 text-xs text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950"
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}
