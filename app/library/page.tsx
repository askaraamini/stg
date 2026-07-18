"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { BottomNavigation } from "@/app/dashboard/components/BottomNavigation";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";
import { formatRelativeTime } from "@/lib/format-relative";

const SUBJECT_META: Record<string, { icon: string; bgClass: string }> = {
  Matematika: { icon: "calculate", bgClass: "bg-rose-100" },
  "IPA (Sains)": { icon: "science", bgClass: "bg-emerald-100" },
  "Bahasa Indonesia": { icon: "translate", bgClass: "bg-yellow-100" },
  "Bahasa Inggris": { icon: "language", bgClass: "bg-blue-100" },
  "IPS (Sejarah)": { icon: "history_edu", bgClass: "bg-purple-100" },
  "Seni & Budaya": { icon: "palette", bgClass: "bg-orange-100" },
  Lainnya: { icon: "menu_book", bgClass: "bg-gray-100" },
};

const SUBJECT_ORDER = [
  "Matematika",
  "IPA (Sains)",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "IPS (Sejarah)",
  "Seni & Budaya",
  "Lainnya",
];

interface SessionItem {
  id: string;
  title: string;
  subject: string;
  imageUrls: string[];
  completedAt: string;
  attempts: number;
}

export default function LibraryPage() {
  const router = useRouter();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [imageIndex, setImageIndex] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const uid = userId || getDeviceId();
        const res = await fetch(`/api/sessions?userId=${uid}`);
        if (!res.ok) throw new Error("Gagal mengambil sesi");
        const { sessions: raw } = await res.json();

        const completed: SessionItem[] = [];

        for (const s of raw) {
          const summary = typeof s.summary === "string" ? JSON.parse(s.summary) : s.summary;
          const exam = summary?.exam;
          if (!exam || !exam.score || exam.score < 70) continue;

          const subject = s.subject && SUBJECT_META[s.subject]
            ? s.subject
            : SUBJECT_META[summary?.subject]
              ? summary.subject
              : "Lainnya";

          completed.push({
            id: s.id,
            title: s.title || summary?.title || "Belajar",
            subject,
            imageUrls: s.image_urls || [],
            completedAt: exam.completed_at || s.started_at,
            attempts: exam.attempts || 1,
          });
        }

        completed.sort(
          (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );

        setSessions(completed);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  const grouped = useMemo(() => {
    const map: Record<string, SessionItem[]> = {};
    for (const subject of SUBJECT_ORDER) map[subject] = [];
    for (const s of filtered) {
      if (map[s.subject]) map[s.subject].push(s);
      else map.Lainnya.push(s);
    }
    return map;
  }, [filtered]);

  const toggleShelf = useCallback((subject: string) => {
    setExpanded((prev) => ({ ...prev, [subject]: !prev[subject] }));
  }, []);

  const prevImage = useCallback((sessionId: string, total: number) => {
    setImageIndex((prev) => ({
      ...prev,
      [sessionId]: ((prev[sessionId] || 0) - 1 + total) % total,
    }));
  }, []);

  const nextImage = useCallback((sessionId: string, total: number) => {
    setImageIndex((prev) => ({
      ...prev,
      [sessionId]: ((prev[sessionId] || 0) + 1) % total,
    }));
  }, []);

  const hasAnyContent = SUBJECT_ORDER.some((s) => (grouped[s]?.length || 0) > 0);

  if (loading) {
    return (
      <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat koleksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sky-blue-bg h-dvh flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Header */}
      <header className="sticky top-0 w-full z-50 flex flex-col bg-surface px-container-margin-mobile py-4 border-b-4 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="flex items-center justify-between w-full mb-4">
          <button
            onClick={() => router.back()}
            className="active:scale-95 transition-transform"
          >
            <MaterialIcon name="arrow_back" className="text-primary text-3xl font-bold" />
          </button>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary">
            Koleksi Belajarku
          </h1>
          <div className="w-9" />
        </div>
        <div className="relative w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari materi..."
            className="w-full h-14 pl-12 pr-4 bg-white border-2 border-ink-navy rounded-xl font-body-md focus:outline-none focus:border-primary-container transition-all"
          />
          <MaterialIcon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
        </div>
      </header>

      <main className="pt-5 px-container-margin-mobile flex flex-col gap-8 md:px-container-margin-desktop">
        {!hasAnyContent && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-32 h-32 mb-4">
              <img
                alt="Robot Mascot"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpBaNplxe86k52uLvyKKxEv9eKA0AiW8nbwiaiJ7VCcaokfNxgx8fUmhupfiXEeMpOFnNVWBGy_4imJBCiVj--xF45wDgBHQ7fieWB5byr5oMPajSD7bNZmRH0K9OzQ9r45oX0Y48JIUAaVYf298hH-U93uXycpdMiDtKaxICa4wCXliIacDUTEarnhv7yk2tiuuNtrgFskHJ2sdXNwT-G1XrYBygB9-0GAYbnBwZhyupJ_dAB8_ZfUkyYXValwDhehq_UY42-JZhCXY0"
              />
            </div>
            <h2 className="font-headline-md text-headline-md text-ink-navy mb-2">
              {search ? "Materi tidak ditemukan" : "Belum ada koleksi"}
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-sm">
              {search
                ? `Coba cari dengan kata kunci lain.`
                : "Selesaikan ujian dengan nilai minimal 80 untuk mengumpulkan materi di sini!"}
            </p>
          </div>
        )}

        {SUBJECT_ORDER.map((subject) => {
          const items = grouped[subject] || [];
          if (items.length === 0) return null;
          const meta = SUBJECT_META[subject] || SUBJECT_META.Lainnya;
          const isOpen = expanded[subject] === true;

          return (
            <section key={subject} className="flex flex-col gap-4">
              {/* Shelf header */}
              <div
                className="flex items-center justify-between group cursor-pointer"
                onClick={() => toggleShelf(subject)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 ${meta.bgClass} border-2 border-ink-navy rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]`}
                  >
                    <MaterialIcon
                      name={meta.icon}
                      className="font-bold"
                      filled
                    />
                  </div>
                  <h2 className="font-headline-md text-headline-md text-ink-navy">
                    {subject}
                  </h2>
                  <span className="font-label-sm text-on-surface-variant">
                    ({items.length})
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-ink-navy transition-transform duration-300 ${
                    isOpen ? "" : "rotate-180"
                  }`}
                >
                  expand_more
                </span>
              </div>

              {/* Shelf content */}
              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: isOpen ? "600px" : "0px" }}
              >
                <div className="bookshelf-gradient p-4 rounded-2xl border-x-2 border-b-2 border-dashed border-ink-navy/20">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter max-h-[480px] overflow-y-auto custom-scrollbar pr-2 py-2">
                    {items.map((item) => {
                      const totalImages = item.imageUrls.length;
                      const currentIdx = imageIndex[item.id] || 0;

                      return (
                        <div
                          key={item.id}
                          className="bg-white border-4 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-xl flex flex-col gap-2 neo-card p-3"
                        >
                          {/* Image carousel */}
                          {totalImages > 0 ? (
                            <div className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-ink-navy bg-surface-container group/image">
                              <img
                                src={item.imageUrls[currentIdx]}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              {totalImages > 1 && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      prevImage(item.id, totalImages);
                                    }}
                                    className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 border-2 border-ink-navy rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[calc(-50%+1px)] active:shadow-none transition-all opacity-0 group-hover/image:opacity-100 hover:bg-white"
                                  >
                                    <MaterialIcon
                                      name="chevron_left"
                                      className="text-sm text-ink-navy"
                                    />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      nextImage(item.id, totalImages);
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 border-2 border-ink-navy rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[calc(-50%+1px)] active:shadow-none transition-all opacity-0 group-hover/image:opacity-100 hover:bg-white"
                                  >
                                    <MaterialIcon
                                      name="chevron_right"
                                      className="text-sm text-ink-navy"
                                    />
                                  </button>
                                  {/* Dots */}
                                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                                    {item.imageUrls.map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full border border-ink-navy ${
                                          i === currentIdx
                                            ? "bg-primary"
                                            : "bg-white/70"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-ink-navy bg-surface-container flex items-center justify-center">
                              <MaterialIcon
                                name={meta.icon}
                                className="text-5xl text-on-surface-variant"
                                filled
                              />
                            </div>
                          )}

                          {/* Info */}
                          <div className="px-1">
                            <h3 className="font-headline-md text-xl leading-tight text-ink-navy line-clamp-2">
                              {item.title}
                            </h3>
                            <p className="font-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
                              <MaterialIcon
                                name="calendar_today"
                                className="text-xs"
                              />
                              Selesai: {formatRelativeTime(item.completedAt)}
                            </p>
                          </div>

                          {/* Baca Lagi button */}
                          <button
                            onClick={() => router.push(`/review?id=${item.id}`)}
                            className="bg-secondary-container w-full py-3 rounded-lg font-bold text-ink-navy flex items-center justify-center gap-2 border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all hover:brightness-95"
                          >
                            <MaterialIcon name="history_edu" className="text-sm" />
                            Baca Lagi
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Mascot speech bubble */}
        {hasAnyContent && (
          <>
            <div className="flex justify-end -mb-6 pr-4 relative z-10">
              <img
                alt="Robot Mascot"
                className="w-32 h-32 object-contain drop-shadow-lg"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpBaNplxe86k52uLvyKKxEv9eKA0AiW8nbwiaiJ7VCcaokfNxgx8fUmhupfiXEeMpOFnNVWBGy_4imJBCiVj--xF45wDgBHQ7fieWB5byr5oMPajSD7bNZmRH0K9OzQ9r45oX0Y48JIUAaVYf298hH-U93uXycpdMiDtKaxICa4wCXliIacDUTEarnhv7yk2tiuuNtrgFskHJ2sdXNwT-G1XrYBygB9-0GAYbnBwZhyupJ_dAB8_ZfUkyYXValwDhehq_UY42-JZhCXY0"
              />
            </div>
            <div className="relative bg-white border-2 border-ink-navy p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="absolute bottom-[-12px] right-12 w-6 h-6 bg-white border-b-2 border-r-2 border-ink-navy rotate-45" />
              <div className="flex items-start gap-4">
                <div>
                  <h4 className="font-headline-md text-lg text-primary">
                    Wah, kamu hebat!
                  </h4>
                  <p className="font-body-md text-on-surface-variant">
                    Kamu sudah menyelesaikan {sessions.length} materi. Mau belajar apa lagi hari ini?
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <style>{`
        .bookshelf-gradient {
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(15,23,42,0.05) 100%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #E0F2FE;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #0F172A;
          border-radius: 10px;
        }
        .neo-card {
          transition: all 0.2s ease;
        }
        .neo-card:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px rgba(15, 23, 42, 1) !important;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}      </style>
      </div>

      <BottomNavigation activeTab="library" />
    </div>
  );
}
