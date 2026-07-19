"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    gradient: "from-purple-100 to-pink-100",
    iconBg: "bg-purple-600",
    titleColor: "text-purple-900",
    blurColor: "bg-purple-600/10",
  },
  {
    icon: "quiz",
    title: "Quiz Interaktif",
    desc: "Jawab soal pilihan ganda seru dengan nilai langsung dan penjelasan lengkap.",
    gradient: "from-blue-100 to-teal-100",
    iconBg: "bg-blue-600",
    titleColor: "text-blue-900",
    blurColor: "bg-blue-600/10",
  },
  {
    icon: "smart_toy",
    title: "AI Tutor (Tanya AI)",
    desc: "Tanya apa saja tentang pelajaran, dijawab langsung oleh AI teman belajarmu.",
    gradient: "from-orange-50 to-yellow-100",
    iconBg: "bg-orange-500",
    titleColor: "text-orange-900",
    blurColor: "bg-orange-500/10",
  },
  {
    icon: "trending_up",
    title: "Pantau Kemajuan",
    desc: "Lihat skor dan perkembangan belajarmu di setiap mata pelajaran.",
    gradient: "from-indigo-100 to-blue-100",
    iconBg: "bg-indigo-600",
    titleColor: "text-indigo-900",
    blurColor: "bg-indigo-600/10",
  },
  {
    icon: "emoji_events",
    title: "Misi Harian",
    desc: "Kumpulkan XP, naikkan level, dan raih badge keren setiap hari!",
    gradient: "from-red-50 to-orange-100",
    iconBg: "bg-red-600",
    titleColor: "text-red-900",
    blurColor: "bg-red-600/10",
  },
  {
    icon: "mic",
    title: "Refleksi Suara",
    desc: "Ceritakan pemahamanmu pakai suara, dapatkan umpan balik dari AI.",
    gradient: "from-emerald-100 to-green-100",
    iconBg: "bg-emerald-600",
    titleColor: "text-emerald-900",
    blurColor: "bg-emerald-600/10",
  },
];

const STEPS = [
  {
    number: "1",
    icon: "photo_camera",
    title: "Scan Halaman Buku",
    desc: "Foto halaman buku pelajaran yang ingin kamu pelajari.",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    number: "2",
    icon: "assignment",
    title: "Jawab Quiz",
    desc: "AI bikin soal dari halaman yang kamu scan. Jawab dan dapatkan nilai!",
    gradient: "from-blue-500 to-teal-600",
  },
  {
    number: "3",
    icon: "military_tech",
    title: "Kuasai Materi",
    desc: "Review jawaban, diskusi dengan AI Tutor, dan pantau perkembanganmu.",
    gradient: "from-orange-500 to-yellow-600",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-surface min-h-screen text-on-surface font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center w-full px-container-margin py-inline-md h-16">
        <h1 className="text-headline-lg font-bold text-primary">Aksaraa</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className="text-label-lg font-bold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Masuk
          </button>
          <button
            onClick={() => router.push("/register")}
            className="bg-primary text-white rounded-full px-5 py-2 text-label-lg font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            Daftar
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-primary to-blue-700 rounded-none md:rounded-3xl mx-0 md:mx-container-margin mt-0 md:mt-inline-lg p-6 md:p-10 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-label-sm font-bold text-white mb-3">
              Platform Belajar Interaktif
            </span>
            <h2 className="text-headline-lg md:text-display-lg font-bold text-white leading-tight mb-3">
              Belajar Jadi Lebih{" "}
              <span className="text-secondary-container">Seru</span>
            </h2>
            <p className="text-body-md md:text-body-lg text-white/90 mb-6 max-w-lg mx-auto md:mx-0">
              Scan buku pelajaranmu, dapatkan soal otomatis, belajar bareng AI tutor, dan raih prestasi terbaikmu!
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <button
                onClick={() => router.push("/register")}
                className="w-full sm:w-auto bg-secondary-container text-ink-navy rounded-full px-8 py-3 text-label-lg font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                Daftar Gratis
              </button>
              <button
                onClick={() => router.push("/login")}
                className="w-full sm:w-auto bg-white/20 backdrop-blur-sm text-white rounded-full px-8 py-3 text-label-lg font-bold border border-white/30 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                Lihat Demo
              </button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center relative">
              <div className="absolute inset-2 rounded-full bg-white/5 animate-pulse" />
              <img
                src="/images/friend.png"
                alt="Aksaraa Friend Mascot"
                className="w-32 h-32 md:w-44 md:h-44 object-contain relative z-10 float-anim"
              />
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-secondary-container/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
      </section>

      {/* ── Fitur ── */}
      <section className="py-stack-lg md:py-20 px-container-margin">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-primary-fixed rounded-full text-label-sm font-bold text-primary-fixed mb-2">
              Fitur Unggulan
            </span>
            <h3 className="text-headline-lg font-bold text-on-surface mb-2">
              Kenapa <span className="text-primary">Aksaraa</span>?
            </h3>
            <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
              Fitur keren yang bikin belajar makin asyik dan nggak membosankan!
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${f.gradient} p-5 rounded-2xl card-shadow relative overflow-hidden border border-white/50 hover:scale-[1.02] transition-transform`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm relative z-10 mb-4">
                  <span
                    className={`material-symbols-outlined ${f.iconBg.replace("bg-", "text-")} text-2xl`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {f.icon}
                  </span>
                </div>
                <h4 className={`font-bold text-[16px] mb-1 relative z-10 ${f.titleColor}`}>
                  {f.title}
                </h4>
                <p className="text-body-md text-on-surface-variant relative z-10">
                  {f.desc}
                </p>
                <div className={`absolute -right-4 -bottom-4 w-16 h-16 ${f.blurColor} rounded-full blur-xl`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara Kerja ── */}
      <section className="bg-surface-container-low py-stack-lg md:py-20 px-container-margin">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-primary-fixed rounded-full text-label-sm font-bold text-primary-fixed mb-2">
              Cara Kerja
            </span>
            <h3 className="text-headline-lg font-bold text-on-surface mb-2">
              Cara Kerjanya <span className="text-primary">Mudah</span>
            </h3>
            <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
              Cuma 3 langkah sederhana, langsung bisa belajar!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`bg-gradient-to-br ${step.gradient} w-20 h-20 rounded-full shadow-lg flex items-center justify-center relative mb-4`}>
                  <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {step.icon}
                  </span>
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
                    <span className="text-label-sm font-bold text-primary">{step.number}</span>
                  </div>
                </div>
                <h4 className="font-bold text-[16px] text-on-surface mb-2">{step.title}</h4>
                <p className="text-body-md text-on-surface-variant max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-stack-lg md:py-20 px-container-margin">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-primary-fixed rounded-full text-label-sm font-bold text-primary-fixed mb-2">
              FAQ
            </span>
            <h3 className="text-headline-lg font-bold text-on-surface mb-2">
              Pertanyaan <span className="text-primary">Umum</span>
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Yang sering ditanyakan tentang Aksaraa
            </p>
          </div>
          <div className="space-y-3">
            {FAQ_DATA.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl card-shadow overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left"
                >
                  <span className="font-bold text-[15px] text-on-surface pr-4">{item.q}</span>
                  <span
                    className={`material-symbols-outlined text-on-surface-variant flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    add
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5">
                    <p className="text-body-md text-on-surface-variant leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kontak ── */}
      <section className="bg-surface-container-low py-stack-lg md:py-20 px-container-margin">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-primary-fixed rounded-full text-label-sm font-bold text-primary-fixed mb-2">
              Kontak
            </span>
            <h3 className="text-headline-lg font-bold text-on-surface mb-2">
              Hubungi <span className="text-primary">Kami</span>
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Punya pertanyaan atau masukan? Yuk, hubungi kami!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:askaraa.mini@gmail.com"
              className="flex items-center gap-3 bg-white rounded-2xl card-shadow px-6 py-4 hover:scale-[1.02] transition-transform w-full sm:w-auto"
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mail
                </span>
              </div>
              <span className="font-bold text-[14px] text-on-surface">askaraa.mini@gmail.com</span>
            </a>
            <a
              href="https://wa.me/6281224459435"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-2xl card-shadow px-6 py-4 hover:scale-[1.02] transition-transform w-full sm:w-auto"
            >
              <div className="w-10 h-10 bg-success-green rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  call
                </span>
              </div>
              <span className="font-bold text-[14px] text-on-surface">+6281224459435</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-stack-lg md:py-16 px-container-margin">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h3 className="text-headline-lg font-bold text-white mb-3">
                Siap Belajar Lebih Seru?
              </h3>
              <p className="text-body-md text-white/90 mb-6 max-w-md mx-auto">
                Yuk, mulai petualangan belajarmu bersama Aksaraa sekarang juga!
              </p>
              <button
                onClick={() => router.push("/register")}
                className="bg-secondary-container text-ink-navy rounded-full px-8 py-3 text-label-lg font-bold shadow-lg hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                Daftar Gratis
              </button>
            </div>
            <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-secondary-container/15 rounded-full blur-3xl" />
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-primary text-white py-8 relative overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto px-container-margin flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-headline-md font-bold text-white">Aksaraa</span>
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
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-secondary-container/10 rounded-full blur-3xl" />
      </footer>
    </div>
  );
}
