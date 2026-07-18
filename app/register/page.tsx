"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";

const KELAS = Array.from({ length: 12 }, (_, i) => String(i + 1));

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [kelas, setKelas] = useState("");
  const [parentWhatsapp, setParentWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.length < 2) return setError("Nama minimal 2 karakter");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Email tidak valid");
    if (!/^\d{6}$/.test(pin)) return setError("PIN harus 6 digit angka");
    if (!kelas) return setError("Pilih kelas terlebih dahulu");

    setSubmitting(true);
    try {
      const deviceId = getDeviceId();
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, pin, kelas, deviceId, parentWhatsapp }),
      });

      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        throw new Error("Tidak dapat membaca respons server");
      }

      if (!res.ok) throw new Error((data.error as string) || "Gagal mendaftar, coba lagi");

      if (!data.userId) throw new Error("Registrasi berhasil tetapi data tidak lengkap");

      setUser(data.userId as string, data.name as string, data.class as number);
      setSuccess(true);
    } catch (err) {
      console.error("[register-page]", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDone = () => {
    router.push("/dashboard");
  };

  return (
    <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center p-container-margin-mobile relative">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-container-margin-mobile py-4 bg-surface border-b-4 border-ink-navy">
        <div className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary">Aksaraa</div>
      </header>

      <main className="w-full max-w-4xl grid md:grid-cols-2 gap-stack-lg items-center mt-20 mb-10">
        {/* Left: Mascot */}
        <div className="hidden md:flex flex-col items-center justify-center gap-stack-md text-center">
          <div className="relative p-6 rounded-xl border-4 border-ink-navy bg-white mb-8 animate-bounce">
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[12px] border-transparent border-t-ink-navy" />
            <p className="font-body-lg text-body-lg text-ink-navy">Yuk, daftar biar kita bisa belajar bareng!</p>
          </div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI-voRY4pToE2gtXa7IQnPbqAbS2WYEpGMiqnIcgfn5Gb6P_RmUh2IijHRPiW5SrkGdILF6tBVhDNZmkpCcNN9nhRXjYy109sO9wlVqaxQdy90MTLnGSws92i7AE9HTL_49sYzusPxbFrAtwoJNXAOsWQtaqVek2DUDcrXc-tQ3A7l2LkKb8R324SiU5bFQE_OQ7_vL4UsPwqr5syYGdI4KN7GZhWKgAvot9cGPKScXH5465L3QrzZHSkj5EeuMluaVkRxAxkGC3qLOlM"
            alt="Spark the Robot"
            className="w-64 h-auto drop-shadow-2xl"
          />
          <div className="space-y-2">
            <h2 className="font-headline-lg text-headline-lg text-ink-navy">Siap Berpetualang?</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mx-auto">Ribuan tantangan seru menantimu di dunia Aksaraa!</p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white p-8 rounded-xl border-4 border-ink-navy w-full">
          <div className="mb-stack-md">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-ink-navy mb-2">Daftar Akun Baru</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Ayo bergabung dengan Aksaraa dan mulai petualangan belajarmu!</p>
          </div>

          {/* Mobile mascot */}
          <div className="md:hidden flex items-center gap-4 mb-stack-md bg-secondary-container/20 p-4 rounded-lg border-2 border-dashed border-secondary">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI-voRY4pToE2gtXa7IQnPbqAbS2WYEpGMiqnIcgfn5Gb6P_RmUh2IijHRPiW5SrkGdILF6tBVhDNZmkpCcNN9nhRXjYy109sO9wlVqaxQdy90MTLnGSws92i7AE9HTL_49sYzusPxbFrAtwoJNXAOsWQtaqVek2DUDcrXc-tQ3A7l2LkKb8R324SiU5bFQE_OQ7_vL4UsPwqr5syYGdI4KN7GZhWKgAvot9cGPKScXH5465L3QrzZHSkj5EeuMluaVkRxAxkGC3qLOlM"
              alt="Spark"
              className="w-20 h-20"
            />
            <p className="font-label-lg text-label-lg text-secondary">Ayo daftar, teman!</p>
          </div>

          <form className="space-y-stack-md" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-label-lg text-label-lg text-ink-navy flex items-center gap-2">
                <MaterialIcon name="account_circle" className="text-primary" /> Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 px-4 bg-white border-4 border-ink-navy rounded-xl font-body-md text-body-md focus:ring-0 focus:border-primary-container outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-lg text-label-lg text-ink-navy flex items-center gap-2">
                <MaterialIcon name="mail" className="text-primary" /> Email
              </label>
              <input
                type="email"
                placeholder="Masukkan email kamu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-4 bg-white border-4 border-ink-navy rounded-xl font-body-md text-body-md focus:ring-0 focus:border-primary-container outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-lg text-label-lg text-ink-navy flex items-center gap-2">
                <MaterialIcon name="lock" className="text-primary" /> PIN 6 Digit
              </label>
              <input
                type="password"
                maxLength={6}
                pattern="\d*"
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="Buat 6 digit PIN"
                value={pin}
                onChange={(e) => e.target.value.replace(/\D/g, "").slice(0, 6) && setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full h-14 px-4 bg-white border-4 border-ink-navy rounded-xl font-body-md text-body-md focus:ring-0 focus:border-primary-container outline-none transition-colors"
              />
              <p className="text-[10px] font-label-sm text-on-surface-variant">Gunakan angka yang mudah kamu ingat!</p>
            </div>

            <div className="space-y-2">
              <label className="font-label-lg text-label-lg text-ink-navy flex items-center gap-2">
                <MaterialIcon name="school" className="text-primary" /> Pilih Kelas
              </label>
              <div className="relative">
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full h-14 px-4 bg-white border-4 border-ink-navy rounded-xl font-body-md text-body-md focus:ring-0 focus:border-primary-container outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>Pilih kelas kamu</option>
                  {KELAS.map((k) => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <MaterialIcon name="expand_more" className="text-ink-navy" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-lg text-label-lg text-ink-navy flex items-center gap-2">
                <MaterialIcon name="smartphone" className="text-primary" /> No. WhatsApp Orang Tua <span className="text-on-surface-variant font-normal text-xs">(opsional)</span>
              </label>
              <input
                type="tel"
                placeholder="Contoh: 08123456789"
                value={parentWhatsapp}
                onChange={(e) => setParentWhatsapp(e.target.value.replace(/\D/g, ""))}
                className="w-full h-14 px-4 bg-white border-4 border-ink-navy rounded-xl font-body-md text-body-md focus:ring-0 focus:border-primary-container outline-none transition-colors"
              />
              <p className="text-[10px] font-label-sm text-on-surface-variant">Kami akan kirim notifikasi belajar via WhatsApp</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-16 bg-secondary-container rounded-xl font-headline-md text-headline-md text-ink-navy flex items-center justify-center gap-2 mt-4 border-4 border-ink-navy transition-all active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-6 h-6 border-2 border-ink-navy border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Daftar Sekarang</span>
                  <MaterialIcon name="rocket_launch" filled />
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-body-md text-body-md text-primary hover:underline font-bold decoration-2 underline-offset-4"
              >
                Sudah punya akun? Masuk di sini
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Error Overlay */}
      {error && (
        <div className="fixed inset-0 bg-ink-navy/50 z-[100] flex items-center justify-center p-container-margin-mobile">
          <div className="bg-white p-6 md:p-10 rounded-2xl border-4 border-ink-navy max-w-sm text-center">
            <div className="w-24 h-24 bg-error border-4 border-ink-navy rounded-full flex items-center justify-center mx-auto mb-6">
              <MaterialIcon name="close" className="text-white text-5xl font-bold" filled />
            </div>
            <h3 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-ink-navy mb-2">Gagal Mendaftar</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">{error}</p>
            <button
              onClick={() => setError("")}
              className="w-full py-4 bg-secondary-container rounded-xl font-headline-md text-headline-md border-4 border-ink-navy transition-all active:translate-y-1"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {success && (
        <div className="fixed inset-0 bg-ink-navy/50 z-[100] flex items-center justify-center p-container-margin-mobile">
          <div className="bg-white p-6 md:p-10 rounded-2xl border-4 border-ink-navy max-w-sm text-center">
            <div className="w-24 h-24 bg-success-green border-4 border-ink-navy rounded-full flex items-center justify-center mx-auto mb-6">
              <MaterialIcon name="check" className="text-white text-5xl font-bold" filled />
            </div>
            <h3 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-ink-navy mb-2">Hore! Berhasil!</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">Akunmu sudah siap. Mari mulai petualangan pertama kita!</p>
            <button
              onClick={handleSuccessDone}
              className="w-full py-4 bg-secondary-container rounded-xl font-headline-md text-headline-md border-4 border-ink-navy transition-all active:translate-y-1"
            >
              Ayo Mulai!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
