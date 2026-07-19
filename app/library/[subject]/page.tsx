"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { BottomNavigation } from "@/app/dashboard/components/BottomNavigation";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";
import { SUBJECT_ICONS, SUBJECT_HERO_GRADIENTS, SUBJECT_IMAGE_FILE } from "@/lib/subjects";
import { formatRelativeTime } from "@/lib/format-relative";

const CARD_ICONS: Record<string, string> = {
  "Matematika": "calculate",
  "IPA (Sains)": "science",
  "IPS (Sejarah)": "history_edu",
  "Bahasa Inggris": "language",
  "Bahasa Indonesia": "translate",
  "Seni & Budaya": "palette",
};

const ICON_COLORS: Record<string, string> = {
  "Matematika": "text-purple-600",
  "IPA (Sains)": "text-blue-600",
  "IPS (Sejarah)": "text-orange-600",
  "Bahasa Inggris": "text-indigo-600",
  "Bahasa Indonesia": "text-red-600",
  "Seni & Budaya": "text-emerald-600",
};

const BUTTON_BG: Record<string, string> = {
  "Matematika": "bg-purple-600",
  "IPA (Sains)": "bg-blue-600",
  "IPS (Sejarah)": "bg-orange-500",
  "Bahasa Inggris": "bg-indigo-600",
  "Bahasa Indonesia": "bg-red-600",
  "Seni & Budaya": "bg-emerald-600",
};

function getThisWeekMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

interface SessionCard {
  id: string;
  title: string;
  completedAt: string;
}

function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userId } = useUser();
  const subject = decodeURIComponent(params.subject as string);

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionCard[]>([]);
  const [search, setSearch] = useState("");

  const meta = SUBJECT_ICONS[subject];
  const heroGradient = SUBJECT_HERO_GRADIENTS[subject] ?? "from-primary to-blue-600";
  const imageFile = SUBJECT_IMAGE_FILE[subject] ?? null;
  const cardGradient = meta?.gradient ?? "from-gray-100 to-gray-200";
  const iconName = CARD_ICONS[subject] ?? "menu_book";
  const iconColor = ICON_COLORS[subject] ?? "text-primary";
  const buttonBg = BUTTON_BG[subject] ?? "bg-primary";
  const titleColor = meta?.textColor ?? "text-on-surface";

  useEffect(() => {
    (async () => {
      try {
        const uid = userId || getDeviceId();
        const res = await fetch(`/api/sessions?userId=${uid}`);
        if (!res.ok) throw new Error("Gagal mengambil sesi");
        const { sessions: raw } = await res.json();

        const completed: SessionCard[] = [];
        for (const s of raw) {
          const summary = typeof s.summary === "string" ? JSON.parse(s.summary) : s.summary;
          const exam = summary?.exam;
          if (!exam || !exam.score || exam.score < 70) continue;

          const sessionSubject = s.subject && SUBJECT_ICONS[s.subject] ? s.subject : "Lainnya";
          if (sessionSubject !== subject) continue;

          completed.push({
            id: s.id,
            title: s.title || summary?.title || "Belajar",
            completedAt: exam.completed_at || s.started_at,
          });
        }

        completed.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setSessions(completed);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, subject]);

  const weeklyCount = useMemo(() => {
    const monday = getThisWeekMonday();
    return sessions.filter((s) => new Date(s.completedAt) >= monday).length;
  }, [sessions]);

  const totalCount = sessions.length;
  const progressPercent = totalCount > 0 ? Math.round((weeklyCount / totalCount) * 100) : 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat materi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface h-dvh flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center w-full px-container-margin py-inline-md h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h1 className="text-[18px] font-bold text-on-surface">{subject}</h1>
        </div>
        <div className="flex items-center gap-3">
          <img alt="Mascot" className="w-10 h-10 object-contain" src="/images/friend.png" />
        </div>
      </header>

      <main className="px-container-margin mt-inline-lg pb-32">
        {/* Hero section */}
        <section className={`bg-gradient-to-br ${heroGradient} rounded-3xl p-6 relative overflow-hidden mb-8 border-none shadow-lg`}>
          <div className="flex items-center justify-between relative z-10">
            <div className="max-w-[65%]">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-label-sm font-bold text-white mb-inline-sm">
                Ringkasan Materi
              </span>
              <h2 className="text-headline-lg font-bold text-white mb-1">Hebat!</h2>
              <p className="text-body-md text-white/90 mb-4">
                Kamu sudah menyelesaikan {weeklyCount} materi minggu ini.
              </p>
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-secondary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="w-24 h-24 relative flex items-center justify-center">
              {imageFile ? (
                <img
                  alt={`${subject} Icon`}
                  className="w-full h-full object-contain animate-bounce"
                  src={imageFile}
                  style={{ animationDuration: "3s" }}
                />
              ) : (
                <span className="material-symbols-outlined text-5xl text-white/80">menu_book</span>
              )}
            </div>
          </div>
          <div className="absolute -right-4 -bottom-6 w-44 h-44 bg-white/10 rounded-full blur-xl" />
        </section>

        {/* Section heading */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-headline-md font-bold text-on-surface">Daftar Materi</h3>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari topik materi..."
            className="block w-full pl-11 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/20 transition-all card-shadow"
          />
        </div>

        {/* Material list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 mb-4 opacity-60">
              <img
                alt="Mascot"
                className="w-full h-full object-contain"
                src="/images/friend.png"
              />
            </div>
            <p className="text-body-md text-on-surface-variant">
              {search ? "Materi tidak ditemukan" : "Belum ada materi untuk mata pelajaran ini."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`bg-gradient-to-br ${cardGradient} p-5 rounded-2xl card-shadow flex items-center gap-4 hover:bg-white/40 transition-all cursor-pointer relative overflow-hidden border border-white/50`}
              >
                <div className="w-14 h-14 shrink-0 rounded-xl bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm relative z-10">
                  <span
                    className={`material-symbols-outlined ${iconColor} text-[28px]`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {iconName}
                  </span>
                </div>
                <div className="flex-grow relative z-10">
                  <h4 className={`font-bold text-[14px] leading-tight mb-1 line-clamp-2 ${titleColor}`}>
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 opacity-70">
                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                    <p className={`text-[10px] font-medium ${titleColor}`}>
                      {formatRelativeTime(item.completedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/review?id=${item.id}`)}
                  className={`px-4 py-1.5 ${buttonBg} text-white rounded-full text-label-sm font-bold shadow-md active:scale-95 transition-transform z-10`}
                >
                  Review
                </button>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-black/5 rounded-full blur-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Mascot overlay */}
        <div className="fixed bottom-20 right-0 w-64 h-64 pointer-events-none z-30">
          <div className="relative w-full h-full">
            <div className="absolute top-4 right-12 bg-white px-4 py-2 rounded-2xl card-shadow border border-slate-100">
              <p className="text-sm font-bold text-primary">Kamu luar biasa!</p>
            </div>
            <img
              alt="Friend Mascot"
              className="absolute bottom-0 right-0 w-44 h-44 object-contain pointer-events-auto"
              src="/images/friend.png"
            />
          </div>
        </div>
      </main>
      </div>

      <BottomNavigation activeTab="library" />
    </div>
  );
}

export default SubjectDetailPage;
