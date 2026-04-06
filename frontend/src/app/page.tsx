// app/page.tsx atau src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* TOP BAR */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full bg-slate-900 overflow-hidden">
              <Image
                src="/sima-avatar1.png" // pastikan ada di /public
                alt="SIMA Bot"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <p className="font-semibold text-lg">SIMA-BOT</p>
              <p className="text-xs text-muted-foreground">
                Chatbot Layanan informasi akademik FSM UNDIP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </header>

        {/* HERO SECTION */}
        <section>
         <Card
            className="
              relative overflow-hidden border-0 shadow-xl
              text-white bg-transparent
            "
          >
           {/* Background 450.jpg */}
            <div className="absolute inset-0">
              <Image
                src="/450.jpg"
                alt="Background SIMA Bot"
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Overlay gelap kiri untuk kontras teks */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-transparent" /> */}

            {/* Overlay terang kanan untuk mencerahkan area burung */}
            <div className="absolute inset-0 bg-gradient-to-l from-white/50 via-white/30 to-transparent" />

            {/* Konten di atas background */}
            <div className="relative z-10 grid gap-8 items-center p-8 md:p-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* Text */}
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.2em] text-sky-200">
                  Chatbot Layanan akademik FSM UNDIP
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  Siap Melayani Mahasiswa Kapan Saja!
                </h1>
                <p className="text-sm md:text-base text-sky-100 max-w-xl">
                  SIMA-BOT membantu mahasiswa FSM menemukan informasi akademik
                  dengan cepat lewat percakapan interaktif.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  {/* Tombol 1 – Kuning */}
                  <Button
                    asChild
                    className="bg-[#1d2275] text-white hover:bg-[#5f65c2] font-semibold"
                  >
                    <Link href="#features">Jelajahi Fitur</Link>
                  </Button>

                  {/* Tombol 2 – Biru  */}
                 <Button
                    asChild
                    className="bg-orange-400 text-slate-900 hover:bg-orange-300 font-semibold"
                  >

                    <Link href="/login">Mulai Chat</Link>
                  </Button>
                </div>
              </div>

              {/* Maskot */}
              <div className="relative h-64 md:h-72 lg:h-80 flex items-end justify-center">
                <Image
                  src="/sima-full4.png"  
                  alt="SIMA Bot"
                  fill
                  className="object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </Card>
        </section>

        {/* KELEBIHAN TEKNOLOGI */}
        <section id="features" className="space-y-6 pb-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Kelebihan Teknologi Kami
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Di balik tampilan yang sederhana, SIMA Bot menggunakan mesin AI
              hybrid dan analytics untuk menghadirkan jawaban yang tepat dan
              pengalaman yang nyaman bagi mahasiswa maupun admin.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Fitur 1 */}
            <Card className="shadow-sm">
              <CardHeader className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  ⚡
                </div>
                <CardTitle className="text-base md:text-lg">
                  Mesin AI Hybrid RASA + RAG
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Jawaban cepat &amp; akurat dengan kombinasi intent-based
                  (RASA) dan retrieval-based (RAG). Pertanyaan umum ditangani
                  oleh intent, sedangkan kasus kompleks dijawab lewat dokumen
                  resmi FSM.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Fitur 2 */}
            <Card className="shadow-sm">
              <CardHeader className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  💬
                </div>
                <CardTitle className="text-base md:text-lg">
                  Riwayat Percakapan Otomatis
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Semua interaksi dengan SIMA Bot disimpan aman, sehingga kamu
                  bisa melanjutkan percakapan dan meninjau kembali jawaban
                  penting kapan saja tanpa kehilangan konteks.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Fitur 3 */}
            <Card className="shadow-sm">
              <CardHeader className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  📊
                </div>
                <CardTitle className="text-base md:text-lg">
                  Dashboard Analytics (Admin)
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Admin dapat memantau jumlah percakapan, intent terpopuler,
                  sumber jawaban (RASA/RAG), serta tren pertanyaan mahasiswa
                  untuk perbaikan layanan akademik.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="pb-6">
          <Card className="border-0 bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-500 text-white shadow-lg">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-6 md:px-10">
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  Siap Mencoba Layanan Akademik SIMA-BOT ? 
                </h3>
                <p className="text-sm md:text-base text-sky-100 max-w-xl">
                  Masuk dan mulai bertanya apa pun seputar
                  informasi akademik, kapan pun kamu butuh bantuan.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-orange-300 text-slate-900 hover:bg-orange-200 font-semibold"
              >
                <Link href="/login">Coba Sekarang</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <footer className="text-center text-xs text-muted-foreground pb-4">
          © 2025 SIMA-BOT FSM UNDIP. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
