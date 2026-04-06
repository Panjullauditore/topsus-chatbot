"use client";

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactStaffProps {
  show: boolean;
}

export default function ContactStaff({ show }: ContactStaffProps) {
  if (!show) return null;

  return (
    <div className="mx-auto my-2 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-950/40">
      <p className="mb-2 text-sm text-amber-800 dark:text-amber-200">
        Sepertinya saya belum bisa menjawab pertanyaanmu. 😔
        <br />
        Hubungi Staf TU untuk bantuan langsung:
      </p>
      <Button
        variant="outline"
        size="sm"
        className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300"
        onClick={() => {
          window.open(
            "https://wa.me/6281234567890?text=Halo%20Staf%20TU%2C%20saya%20butuh%20bantuan%20terkait%20layanan%20akademik.",
            "_blank"
          );
        }}
      >
        <Phone className="mr-1.5 h-3.5 w-3.5" />
        Hubungi Staf TU via WhatsApp
      </Button>
    </div>
  );
}
