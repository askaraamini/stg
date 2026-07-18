"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const FAQ_DATA = [
  {
    q: "Apa itu Aksaraa?",
    a: "Aksaraa adalah platform belajar interaktif untuk siswa SD dan SMP. Cukup foto halaman buku pelajaran, dan Aksaraa akan membuat soal-soal seru, memberikan penjelasan dengan AI tutor, serta membantu kamu melacak kemajuan belajar!",
  },
  {
    q: "Berapa biaya menggunakan Aksaraa?",
    a: "Aksaraa GRATIS! Tidak ada biaya berlangganan. Semua fitur bisa kamu nikmati tanpa mengeluarkan uang sepeser pun.",
  },
  {
    q: "Untuk kelas berapa saja Aksaraa?",
    a: "Aksaraa cocok untuk siswa kelas 1 sampai 9 (SD dan SMP). Materi mencakup Matematika, IPA (Sains), Bahasa Indonesia, Bahasa Inggris, IPS (Sejarah), dan Seni & Budaya.",
  },
  {
    q: "Apa yang dibutuhkan untuk mulai menggunakan Aksaraa?",
    a: "Kamu hanya perlu smartphone atau komputer dengan koneksi internet stabil. Kalau mau scan buku, pastikan perangkat punya kamera.",
  },
  {
    q: "Apakah data saya aman di Aksaraa?",
    a: "Tentu! Kami menjaga privasi data pengguna dengan baik. Data kamu hanya digunakan untuk keperluan belajar dan tidak akan disalahgunakan.",
  },
];

const FEATURES = [
  {
    icon: "notifications_active",
    title: "Notifikasi Orang Tua",
    desc: "Setiap selesai sesi belajar, orang tua dapat laporan langsung via WhatsApp. Pantau perkembangan anak secara real-time!",
  },
  {
    icon: "quiz",
    title: "Quiz Interaktif",
    desc: "Jawab soal pilihan ganda seru dengan nilai langsung dan penjelasan lengkap.",
  },
  {
    icon: "smart_toy",
    title: "AI Tutor (Tanya AI)",
    desc: "Tanya apa saja tentang pelajaran, dijawab langsung oleh AI teman belajarmu.",
  },
  {
    icon: "trending_up",
    title: "Pantau Kemajuan",
    desc: "Lihat skor dan perkembangan belajarmu di setiap mata pelajaran.",
  },
  {
    icon: "emoji_events",
    title: "Misi Harian",
    desc: "Kumpulkan XP, naikkan level, dan raih badge keren setiap hari!",
  },
  {
    icon: "mic",
    title: "Refleksi Suara",
    desc: "Ceritakan pemahamanmu pakai suara, dapatkan umpan balik dari AI.",
  },
];

const STEPS = [
  {
    number: "1",
    icon: "photo_camera",
    title: "Scan Halaman Buku",
    desc: "Foto halaman buku pelajaran yang ingin kamu pelajari.",
  },
  {
    number: "2",
    icon: "assignment",
    title: "Jawab Quiz",
    desc: "AI bikin soal dari halaman yang kamu scan. Jawab dan dapatkan nilai!",
  },
  {
    number: "3",
    icon: "military_tech",
    title: "Kuasai Materi",
    desc: "Review jawaban, diskusi dengan AI Tutor, dan pantau perkembanganmu.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-sky-blue-bg min-h-screen font-body-md text-on-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-sky-blue-bg/95 backdrop-blur-sm border-b-2 border-ink-navy shadow-neo-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-center md:justify-start px-container-margin-mobile md:px-container-margin-desktop py-3 md:py-4">
          <h1 className="text-headline-lg font-black text-primary tracking-tight">Aksaraa</h1>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-container-margin-mobile md:px-container-margin-desktop py-stack-lg md:py-20">
        <div className="flex flex-col md:flex-row items-center gap-stack-lg">
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display text-display-lg-mobile md:text-display-lg text-ink-navy leading-tight">
              Belajar Jadi Lebih{" "}
              <span className="text-primary">Seru</span> dengan{" "}
              <span className="text-primary">Aksaraa</span>
            </h2>
            <p className="text-body-lg md:text-headline-md text-on-surface-variant mt-4 md:mt-6 max-w-lg mx-auto md:mx-0">
              Scan buku pelajaranmu, dapatkan soal otomatis, belajar bareng AI tutor, dan raih prestasi terbaikmu!
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 md:mt-10 justify-center md:justify-start">
              <button
                onClick={() => router.push("/register")}
                className="w-full sm:w-auto bg-secondary-container text-ink-navy font-headline-md text-headline-md px-8 py-4 rounded-xl border-4 border-ink-navy shadow-neo-heavy hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <MaterialIcon name="rocket_launch" filled />
                Daftar Gratis
              </button>
              <button
                onClick={() => router.push("/login")}
                className="w-full sm:w-auto bg-white text-ink-navy font-headline-md text-headline-md px-8 py-4 rounded-xl border-2 border-ink-navy shadow-neo hover:scale-[1.02] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <MaterialIcon name="login" />
                Masuk
              </button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-56 h-56 md:w-72 md:h-72 animate-float">
              <img
                src="/images/friend.png"
                alt="Aksaraa Friend Mascot"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Fitur ── */}
      <section className="bg-white border-y-4 border-ink-navy py-stack-lg md:py-20">
        <div className="max-w-6xl mx-auto px-container-margin-mobile md:px-container-margin-desktop">
          <h3 className="text-center font-display text-display-lg-mobile md:text-display-lg text-ink-navy mb-2">
            Kenapa{" "}
            <span className="text-primary">Aksaraa</span>?
          </h3>
          <p className="text-center text-body-lg text-on-surface-variant mb-stack-lg max-w-xl mx-auto">
            Fitur keren yang bikin belajar makin asyik dan nggak membosankan!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-sky-blue-bg border-2 border-ink-navy shadow-neo rounded-xl p-6 hover:scale-[1.02] transition-transform"
              >
                <div className="w-12 h-12 bg-primary rounded-xl border-2 border-ink-navy flex items-center justify-center mb-4">
                  <MaterialIcon name={f.icon} className="text-white text-2xl" filled />
                </div>
                <h4 className="font-headline-md text-headline-md text-ink-navy mb-2">{f.title}</h4>
                <p className="text-body-md text-on-surface-variant">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara Kerja ── */}
      <section className="py-stack-lg md:py-20">
        <div className="max-w-6xl mx-auto px-container-margin-mobile md:px-container-margin-desktop">
          <h3 className="text-center font-display text-display-lg-mobile md:text-display-lg text-ink-navy mb-2">
            Cara Kerjanya{" "}
            <span className="text-primary">Mudah</span>
          </h3>
          <p className="text-center text-body-lg text-on-surface-variant mb-stack-lg max-w-xl mx-auto">
            Cuma 3 langkah sederhana, langsung bisa belajar!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-secondary-container rounded-full border-4 border-ink-navy shadow-neo flex items-center justify-center">
                    <MaterialIcon name={step.icon} className="text-ink-navy text-4xl" filled />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full border-2 border-ink-navy flex items-center justify-center">
                    <span className="text-white font-headline-md text-label-lg">{step.number}</span>
                  </div>
                </div>
                <h4 className="font-headline-md text-headline-md text-ink-navy mb-2">{step.title}</h4>
                <p className="text-body-md text-on-surface-variant">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white border-y-4 border-ink-navy py-stack-lg md:py-20">
        <div className="max-w-3xl mx-auto px-container-margin-mobile md:px-container-margin-desktop">
          <h3 className="text-center font-display text-display-lg-mobile md:text-display-lg text-ink-navy mb-2">
            Pertanyaan{" "}
            <span className="text-primary">Umum</span>
          </h3>
          <p className="text-center text-body-lg text-on-surface-variant mb-stack-lg">
            Yang sering ditanyakan tentang Aksaraa
          </p>
          <div className="space-y-4">
            {FAQ_DATA.map((item, i) => (
              <div
                key={i}
                className="bg-sky-blue-bg border-2 border-ink-navy shadow-neo-sm rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left"
                >
                  <span className="font-headline-md text-headline-md text-ink-navy pr-4">{item.q}</span>
                  <MaterialIcon
                    name={openFaq === i ? "remove" : "add"}
                    className="text-ink-navy text-2xl flex-shrink-0"
                    filled
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6">
                    <p className="text-body-md text-on-surface-variant">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kontak ── */}
      <section className="py-stack-lg md:py-20">
        <div className="max-w-3xl mx-auto px-container-margin-mobile md:px-container-margin-desktop text-center">
          <h3 className="font-display text-display-lg-mobile md:text-display-lg text-ink-navy mb-2">
            Hubungi{" "}
            <span className="text-primary">Kami</span>
          </h3>
          <p className="text-body-lg text-on-surface-variant mb-stack-lg">
            Punya pertanyaan atau masukan? Yuk, hubungi kami!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="mailto:askaraa.mini@gmail.com"
              className="flex items-center gap-3 bg-white border-2 border-ink-navy shadow-neo rounded-xl px-6 py-4 hover:scale-[1.02] transition-transform"
            >
              <div className="w-10 h-10 bg-primary rounded-lg border-2 border-ink-navy flex items-center justify-center">
                <MaterialIcon name="mail" className="text-white" filled />
              </div>
              <span className="font-body-lg text-body-lg text-ink-navy">askaraa.mini@gmail.com</span>
            </a>
            <a
              href="https://wa.me/6281224459435"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white border-2 border-ink-navy shadow-neo rounded-xl px-6 py-4 hover:scale-[1.02] transition-transform"
            >
              <div className="w-10 h-10 bg-success-green rounded-lg border-2 border-ink-navy flex items-center justify-center">
                <MaterialIcon name="call" className="text-white" filled />
              </div>
              <span className="font-body-lg text-body-lg text-ink-navy">+6281224459435</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ink-navy text-white py-8">
        <div className="max-w-6xl mx-auto px-container-margin-mobile md:px-container-margin-desktop flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md text-secondary-container">Aksaraa</span>
          </div>
          <p className="text-body-md text-white/70 text-center">
            &copy; 2026 Aksaraa. Dibuat dengan penuh semangat untuk pendidikan Indonesia.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/register")}
              className="text-body-md text-secondary-container hover:underline font-bold"
            >
              Daftar
            </button>
            <button
              onClick={() => router.push("/login")}
              className="text-body-md text-secondary-container hover:underline font-bold"
            >
              Masuk
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
