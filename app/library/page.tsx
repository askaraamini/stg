"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BottomNavigation } from "@/app/dashboard/components/BottomNavigation";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";
import { SUBJECT_ICONS, SUBJECT_ORDER } from "@/lib/subjects";

interface SubjectSummary {
  name: string;
  materiCount: number;
  examCount: number;
}

export default function LibraryPage() {
  const router = useRouter();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const uid = userId || getDeviceId();
        const res = await fetch(`/api/sessions?userId=${uid}`);
        if (!res.ok) throw new Error("Gagal mengambil sesi");
        const { sessions: raw } = await res.json();

        const counts: Record<string, { materi: number; exam: number }> = {};
        for (const s of raw) {
          const summary = typeof s.summary === "string" ? JSON.parse(s.summary) : s.summary;
          const exam = summary?.exam;
          const subject = s.subject && SUBJECT_ICONS[s.subject] ? s.subject : "Lainnya";

          if (!counts[subject]) counts[subject] = { materi: 0, exam: 0 };
          counts[subject].materi++;
          if (exam && exam.score != null && exam.completed_at) {
            counts[subject].exam++;
          }
        }

        const list: SubjectSummary[] = SUBJECT_ORDER.map((name) => ({
          name,
          materiCount: counts[name]?.materi ?? 0,
          examCount: counts[name]?.exam ?? 0,
        }));

        setSubjects(list);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjects, search]);

  const activeSubjects = filtered.filter((s) => s.examCount > 0);
  const inactiveSubjects = filtered.filter((s) => s.examCount === 0);

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat koleksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface h-dvh flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-6 pt-8 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-on-surface">Koleksi Belajarku</h1>
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden card-shadow">
              <img
                alt="Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-oJACA8xxEE9P75kpHuNj1s6YQAqVlae-SXMtLCgpP925AxHPqxg6UtGjp9zojSHknfqv5QdsSmqXDSie1ezOxD2q3xeAZJAaH9AHDlaYgaEovYzitdR2-gm86Dd3mBZtedajcOjU-U8VWTn8vune87CjcB6S0QLQ6F0ibTlAFeBAOdajSCagT8v9aRlxLq-zM3Q95gQZAK7Qf1eao1iiIAa-BSJ9jIGdTU0jrkHU-E5IqJDsNRlcqxUjx7r3vS8gjA"
              />
            </div>
          </div>
        </header>

        {/* Search */}
        <section className="px-6 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari materi belajarku"
              className="block w-full pl-11 pr-4 py-3.5 bg-white border-none rounded-2xl card-shadow text-sm placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </section>

        {/* Subject list */}
        <main className="px-6 space-y-4 pb-32">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-32 h-32 mb-4">
                <img
                  alt="Mascot"
                  className="w-full h-full object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpBaNplxe86k52uLvyKKxEv9eKA0AiW8nbwiaiJ7VCcaokfNxgx8fUmhupfiXEeMpOFnNVWBGy_4imJBCiVj--xF45wDgBHQ7fieWB5byr5oMPajSD7bNZmRH0K9OzQ9r45oX0Y48JIUAaVYf298hH-U93uXycpdMiDtKaxICa4wCXliIacDUTEarnhv7yk2tiuuNtrgFskHJ2sdXNwT-G1XrYBygB9-0GAYbnBwZhyupJ_dAB8_ZfUkyYXValwDhehq_UY42-JZhCXY0"
                />
              </div>
              <h2 className="text-headline-md font-bold text-on-surface mb-2">
                {search ? "Materi tidak ditemukan" : "Belum ada koleksi"}
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-sm">
                {search
                  ? "Coba cari dengan kata kunci lain."
                  : "Selesaikan ujian untuk mengumpulkan materi di sini!"}
              </p>
            </div>
          )}

          {activeSubjects.map((s) => {
            const meta = SUBJECT_ICONS[s.name];
            const imgUrl = meta?.imageUrl ?? "";
            return (
              <div
                key={s.name}
                onClick={() => router.push(`/library/${encodeURIComponent(s.name)}`)}
                className="flex items-center p-4 bg-white rounded-2xl card-shadow border-2 border-primary relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="w-16 h-16 mr-4 flex-shrink-0">
                  {imgUrl ? (
                    <img alt={s.name} className="w-full h-full object-contain" src={imgUrl} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container rounded-xl">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">menu_book</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface">{s.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      {s.materiCount} Materi
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {s.examCount} Exam
                    </span>
                  </div>
                </div>
                <svg className="h-5 w-5 text-on-surface-variant" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd" />
                </svg>
              </div>
            );
          })}

          {inactiveSubjects.map((s) => {
            const meta = SUBJECT_ICONS[s.name];
            const imgUrl = meta?.imageUrl ?? "";
            return (
              <div
                key={s.name}
                className="flex items-center p-4 bg-white rounded-2xl card-shadow border border-slate-50 opacity-60 relative overflow-hidden"
              >
                <div className="w-16 h-16 mr-4 flex-shrink-0">
                  {imgUrl ? (
                    <img alt={s.name} className="w-full h-full object-contain" src={imgUrl} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container rounded-xl">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">menu_book</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface">{s.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      {s.materiCount} Materi
                    </span>
                  </div>
                </div>
                <svg className="h-5 w-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd" />
                </svg>
              </div>
            );
          })}

          {/* Mascot overlay */}
          {filtered.length > 0 && (
            <div className="fixed bottom-20 right-0 w-64 h-64 pointer-events-none z-30">
              <div className="relative w-full h-full">
                <div className="absolute bottom-48 right-1.5 bg-white px-4 py-2 rounded-2xl card-shadow border border-slate-100 whitespace-nowrap pointer-events-auto">
                  <p className="text-sm font-bold text-primary">Wah, kamu hebat!</p>
                </div>
                <img
                  alt="Friend Mascot"
                  className="absolute bottom-0 right-0 w-48 h-48 object-contain pointer-events-auto"
                  src="/images/friend.png"
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <BottomNavigation activeTab="library" />
    </div>
  );
}
