"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUser();

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) return setError("Masukkan email kamu");
    if (!pin) return setError("Masukkan PIN kamu");

    setSubmitting(true);
    try {
      const deviceId = getDeviceId();
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal masuk");

      setUser(data.userId, data.name, data.class);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-sky-blue-bg min-h-screen flex flex-col items-center justify-center p-container-margin-mobile relative">
      <main className="w-full max-w-4xl flex flex-col items-center gap-stack-lg">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary tracking-tight">
            Aksaraa
          </h1>
        </div>

        {/* Mascot + Speech Bubble */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-sm md:max-w-2xl">
          <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
            <img
              src="/images/google/bce7efc2.png"
              alt="Spark the Robot"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="relative bg-white p-4 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] flex-1">
            <p className="font-body-lg text-body-lg text-on-surface text-center md:text-left">
              Halo! Aku Spark. Yuk, lanjut belajar bareng!
            </p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-left-2 md:-translate-y-1/2 w-4 h-4 bg-white border-b-2 border-r-2 md:border-b-0 md:border-r-0 md:border-t-2 md:border-l-2 border-ink-navy rotate-45" />
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-sm bg-white p-6 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] flex flex-col gap-stack-md">
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface">Email</label>
            <input
              type="email"
              placeholder="Masukkan email kamu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-lg border-[4px] border-ink-navy font-body-lg focus:outline-none focus:ring-2 focus:ring-secondary-container"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface">PIN</label>
            <input
              type="password"
              maxLength={6}
              placeholder="6 Digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full p-4 rounded-lg border-[4px] border-ink-navy font-body-lg focus:outline-none focus:ring-2 focus:ring-secondary-container"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full bg-secondary-container text-on-secondary-container font-headline-md text-headline-md py-4 px-8 rounded-full border-ink-navy border-[4px] shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] mt-4 transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-6 h-6 border-2 border-ink-navy border-t-transparent rounded-full animate-spin" />
            ) : (
              "Masuk"
            )}
          </button>
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="font-body-md text-body-md text-primary hover:underline font-bold decoration-2 underline-offset-4"
            >
              Belum punya akun? Daftar di sini
            </button>
          </div>
        </div>
      </main>

      {/* Error Overlay */}
      {error && (
        <div className="fixed inset-0 bg-ink-navy/50 z-[100] flex items-center justify-center p-container-margin-mobile">
          <div className="bg-white p-6 md:p-10 rounded-2xl border-4 border-ink-navy max-w-sm text-center">
            <div className="w-24 h-24 bg-error border-4 border-ink-navy rounded-full flex items-center justify-center mx-auto mb-6">
              <MaterialIcon name="close" className="text-white text-5xl font-bold" filled />
            </div>
            <h3 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-ink-navy mb-2">Gagal Masuk</h3>
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
    </div>
  );
}
