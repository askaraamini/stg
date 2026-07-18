"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { BottomNavigation } from "@/app/dashboard/components/BottomNavigation";
import { useUser } from "@/lib/user-store";

const KELAS = Array.from({ length: 12 }, (_, i) => String(i + 1));

export default function ProfilePage() {
  const router = useRouter();
  const { userId, userName, userClass, logout } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kelas, setKelas] = useState("");
  const [pin, setPin] = useState("");
  const [pinEditable, setPinEditable] = useState(false);
  const [parentWhatsapp, setParentWhatsapp] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [monthlyCompleted, setMonthlyCompleted] = useState(0);

  useEffect(() => {
    if (!userId) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        if (!res.ok) throw new Error("Gagal memuat profil");
        const data = await res.json();
        setName(data.name || "");
        setEmail(data.email || "");
        setKelas(data.class ? String(data.class) : "");
        setParentWhatsapp(data.parent_whatsapp || "");
        setMonthlyCompleted(data.monthlyCompleted ?? 0);
      } catch {
        setErrorMsg("Gagal memuat data profil");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, router]);

  const handleSave = async () => {
    setSuccessMsg("");
    setErrorMsg("");
    const body: Record<string, unknown> = { userId };

    if (pin && pin.length > 0) {
      if (!/^\d{6}$/.test(pin)) {
        setErrorMsg("PIN harus 6 digit angka");
        return;
      }
      body.pin = pin;
    }

    if (kelas) {
      body.kelas = Number(kelas);
    }

    if (parentWhatsapp) {
      body.parentWhatsapp = parentWhatsapp;
    }

    if (Object.keys(body).length <= 1) {
      setErrorMsg("Tidak ada perubahan yang disimpan");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }
      setSuccessMsg("Profil berhasil diperbarui!");
      setPin("");
      setPinEditable(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const kelasLabel = kelas ? `Kelas ${kelas}` : "";
  const schoolLevel =
    kelas
      ? Number(kelas) <= 6
        ? "SD"
        : Number(kelas) <= 9
          ? "SMP"
          : "SMA"
      : "";

  if (loading) {
    return (
      <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sky-blue-bg min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-container-margin-mobile h-16 bg-surface border-b-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-tactile bg-surface border-2 border-ink-navy p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all"
          >
            <MaterialIcon name="arrow_back" className="text-primary" />
          </button>
          <h1 className="text-headline-md font-black text-primary">Profil Saya</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary hover:scale-105 transition-transform active:translate-y-0.5">
            local_fire_department
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-ink-navy">
            <img
              alt="Avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgaJLpiyz91yEUvbJjAEACV91TSkHvPAluh58vGNZ28AudJB1Z384GPxV5Q25LZnc6uXCXJRLt-E4XsXNoHc1YOqxUWq-6KoefXV86emUe3ux5DHEZn-K9wS8iFHqiBzhCMVx4Pe1ZfChnGj-lepfcVQb0c_9B2gpOF7N2dZI41hlvwXEqKu1WFP4w1Pun4QHQMQ7Vaz1vTm0zNotGGe-VeIN9E3nnkPUv5yeqKYjcFewh-9f-cONcNA"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-container-margin-mobile py-8 max-w-2xl mx-auto w-full pb-32">
        {/* Hero Section */}
        <section className="bg-white border-[4px] border-ink-navy rounded-2xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-6 mb-stack-lg flex flex-col items-center">
          <div className="relative w-28 h-28 mb-3">
            <div className="w-full h-full rounded-full bg-secondary-container border-2 border-ink-navy overflow-hidden flex items-center justify-center">
              <img
                alt="Robot Mascot"
                className="w-20 h-20 object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3mPJIL5VOKeuZ2uANgOge0pT69HDOQ3USgq7PyLk0S_8UqcQ07pHCLAI2k5awvqrt_72BAnkN3KaRw_7Sr-6dld97o98TUe0rSe6ebKElDrZz6eAwGUVxaABCkJguq__ik5xEGT6rnTCHdqTn0xmz77oHk2hKX07ugsBcz3RFQnSg_AFb39lcQ_140a5xvRF8hWjxye-GmaFSYcXx_xtdovZDGXUcBJth8FO5Jf_WGn8MKXuQ8mSY9MNtZh-pSX6AN5Ld8nTBv7MKR7I"
              />
            </div>
          </div>
          <h2 className="text-headline-md font-black text-ink-navy mb-1">{name || userName}</h2>
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full border-2 border-ink-navy">
            <MaterialIcon name="stars" className="text-secondary text-xl" filled />
            <span className="text-label-lg font-bold text-secondary">
              {schoolLevel && kelasLabel ? `${schoolLevel} • ${kelasLabel}` : "Siswa Hebat"}
            </span>
          </div>
        </section>

        {/* Info Sections */}
        <section className="space-y-6">
          {/* Read-only: Name */}
          <div className="space-y-2">
            <label className="text-label-lg font-bold text-on-surface-variant ml-2">Nama Lengkap</label>
            <div className="flex items-center gap-3 bg-surface-container border-2 border-ink-navy rounded-xl px-4 py-3 opacity-80">
              <MaterialIcon name="person" className="text-on-surface-variant" />
              <p className="text-body-lg font-semibold text-ink-navy">{name || userName}</p>
            </div>
          </div>

          {/* Read-only: Email */}
          <div className="space-y-2">
            <label className="text-label-lg font-bold text-on-surface-variant ml-2">Email</label>
            <div className="flex items-center gap-3 bg-surface-container border-2 border-ink-navy rounded-xl px-4 py-3 opacity-80">
              <MaterialIcon name="mail" className="text-on-surface-variant" />
              <p className="text-body-lg font-semibold text-ink-navy">{email}</p>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-t-2 border-ink-navy border-dashed opacity-20" />

          {/* Editable: PIN */}
          <div className="space-y-2">
            <label className="text-label-lg font-bold text-on-surface-variant ml-2">PIN Keamanan</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type={pinEditable ? "text" : "password"}
                  readOnly={!pinEditable}
                  value={pinEditable ? pin : "••••••"}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="6 digit angka"
                  maxLength={6}
                  className="w-full bg-white border-2 border-ink-navy rounded-xl px-4 py-3 font-body-lg text-body-lg focus:ring-secondary-container focus:border-primary transition-all disabled:opacity-60"
                />
                <MaterialIcon
                  name="lock"
                  className="absolute right-4 top-3.5 text-on-surface-variant"
                />
              </div>
              <button
                onClick={() => {
                  setPinEditable(!pinEditable);
                  if (pinEditable) setPin("");
                }}
                className="bg-surface-container-highest border-2 border-ink-navy rounded-xl px-6 py-3 text-label-lg font-bold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none hover:bg-surface-container-high transition-all"
              >
                {pinEditable ? "Batal" : "Ubah"}
              </button>
            </div>
          </div>

          {/* Editable: Parent WhatsApp */}
          <div className="space-y-2">
            <label className="text-label-lg font-bold text-on-surface-variant ml-2">No. WhatsApp Orang Tua</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={parentWhatsapp}
                  onChange={(e) => setParentWhatsapp(e.target.value)}
                  placeholder="08xxxx atau 628xxxx"
                  maxLength={16}
                  className="w-full bg-white border-2 border-ink-navy rounded-xl px-4 py-3 font-body-lg text-body-lg focus:ring-secondary-container focus:border-primary transition-all"
                />
                <MaterialIcon
                  name="phone"
                  className="absolute right-4 top-3.5 text-on-surface-variant"
                />
              </div>
            </div>
          </div>

          {/* Editable: Class */}
          <div className="space-y-2">
            <label className="text-label-lg font-bold text-on-surface-variant ml-2">Kelas</label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="w-full bg-white border-2 border-ink-navy rounded-xl px-4 py-3 font-body-lg text-body-lg focus:ring-secondary-container focus:border-primary appearance-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
            >
              <option value="">Pilih Kelas</option>
              {KELAS.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="bg-success-green/20 border-2 border-success-green rounded-xl px-4 py-3 text-center">
              <p className="text-body-md font-bold text-success-green">{successMsg}</p>
            </div>
          )}
          {errorMsg && (
            <div className="bg-error/10 border-2 border-error rounded-xl px-4 py-3 text-center">
              <p className="text-body-md font-bold text-error">{errorMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex flex-col gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary-container text-white border-2 border-ink-navy rounded-xl py-4 text-headline-md font-black shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-on-surface-variant text-label-lg font-bold hover:text-error transition-colors"
            >
              <MaterialIcon name="logout" className="text-xl" />
              Keluar Akun
            </button>
          </div>
        </section>

        {/* Fun Stats */}
        <div className="mt-8 bg-tertiary-container/10 border-2 border-ink-navy rounded-xl p-4 flex items-center gap-4">
          <div className="bg-tertiary-container p-3 rounded-full border-2 border-ink-navy">
            <MaterialIcon name="menu_book" className="text-white" />
          </div>
          <div>
            <p className="text-label-lg font-bold text-tertiary">Misi Koleksi</p>
            <p className="text-body-md font-semibold">Kamu sudah menyelesaikan {monthlyCompleted} buku bulan ini! Keren!</p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" />
    </div>
  );
}
