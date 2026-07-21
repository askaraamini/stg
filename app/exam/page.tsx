"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { TanyaChat } from "@/components/TanyaChat";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import DOMPurify from "dompurify";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const SPEECH_TEXTS = [
  "Ayo fokus, kerjakan dengan teliti!",
  "Baca soal baik-baik ya!",
  "Kamu pasti bisa melewatinya!",
  "Jangan terburu-buru, yang penting benar!",
  "Fokus, kamu sudah sejauh ini!",
];

const TIPS = [
  "Pastikan kamu membaca setiap soal dengan teliti sebelum menjawab.",
  "Kerjakan soal yang kamu rasa mudah terlebih dahulu.",
  "Periksa kembali jawabanmu sebelum melanjutkan.",
  "Gunakan kertas coretan untuk menghitung jika diperlukan.",
  "Jangan ragu untuk mencoba lagi jika belum berhasil.",
];

function getRandomItem(arr: string[], seed: number) {
  return arr[seed % arr.length];
}

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  diagram_index?: number | null;
  explanation_html: string;
}

interface ExamData {
  title: string;
  language: string;
  questions: Question[];
}

function ExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [quiz, setQuiz] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [regenerating, setRegenerating] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const scoreAlreadyStored = useRef(false);
  const [examPhase, setExamPhase] = useState(0); // 0=generating, 1=partial(5), 2=complete(10)
  const [phase2Popup, setPhase2Popup] = useState(false);
  const [phase2Failed, setPhase2Failed] = useState(false);
  const phase2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase2StartedRef = useRef(false);
  const phase2ParamsRef = useRef<{
    id: string; existingSummary: any; phase1Questions: any[];
    imageUrlsList: string[]; contextMeta: any;
  } | null>(null);
  const answersRef = useRef<(number | null)[]>([]);
  const contextMetaRef = useRef<any>(null);
  const [showTanya, setShowTanya] = useState(false);
  const [tanyaPulse, setTanyaPulse] = useState(false);
  const tanyaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync answersRef with latest answers state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // ── Dedup helper ──
  function normalizeText(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  }
  function jaccardSimilarity(a: string[], b: string[]) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }
  function isDuplicate(q: { question: string; options: string[] }, existing: { question: string; options: string[] }[]) {
    const words = normalizeText(q.question);
    for (const ex of existing) {
      const exWords = normalizeText(ex.question);
      if (jaccardSimilarity(words, exWords) > 0.6) return true;
      // Also check option overlap
      const optOverlap = q.options.filter((o) => ex.options.includes(o)).length;
      if (optOverlap >= 3) return true;
    }
    return false;
  }

  // Save progress to session
  const saveProgress = useCallback(async () => {
    if (!id || showResults) return;
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) return;
      const sessionData = await res.json();
      const existingSummary = JSON.parse(sessionData.summary);
      const mergedSummary = JSON.stringify({
        ...existingSummary,
        examProgress: { currentIndex, answers, seconds },
      });
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: mergedSummary }),
      });
    } catch {
      // non-blocking
    }
  }, [id, currentIndex, answers, seconds, showResults]);

  // Clear examProgress from session
  const clearProgress = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) return;
      const sessionData = await res.json();
      const summary = JSON.parse(sessionData.summary);
      delete summary.examProgress;
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: JSON.stringify(summary) }),
      });
    } catch {
      // non-blocking
    }
  }, [id]);

  // ── Phase 2 background loader ──
  const runPhase2 = useCallback(async (
    id: string,
    existingSummary: any,
    phase1Questions: any[],
    imageUrlsList: string[],
    contextMeta: any,
  ) => {
    try {
      // Guard against double execution (StrictMode / re-renders)
      if (phase2StartedRef.current) return;
      phase2StartedRef.current = true;

      const MAX_CALLS = 5;
      const allPhase2Questions: any[] = [];

      for (let attempt = 0; attempt < MAX_CALLS && allPhase2Questions.length < 5; attempt++) {
        const exclude = [
          ...phase1Questions.map((q: any) => q.question),
          ...allPhase2Questions.map((q: any) => q.question),
        ];

        const quizBody: Record<string, unknown> = {
          mode: "exam", count: 10, exclude,
          context: contextMeta,
          kelas: contextMeta?.kelas || null,
          expectedSubject: contextMeta?.subject || null,
        };

        const quizRes = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizBody),
        });
        if (!quizRes.ok) throw new Error("Gagal membuat soal phase 2");
        const { quiz: phase2Quiz } = await quizRes.json();

        // Dedup against Phase 1 only (Phase 2 survivors already unique among themselves)
        const deduped = phase2Quiz.questions.filter(
          (q: any) => !isDuplicate(q, phase1Questions)
        );
        allPhase2Questions.push(...deduped);
      }

      const taken = allPhase2Questions.slice(0, 5);
      if (taken.length < 5) {
        console.warn(`[exam] Phase 2 only got ${taken.length} unique questions after ${MAX_CALLS} attempts`);
      }

      const allQuestions = [...phase1Questions, ...taken];

      // Fetch latest session to avoid stale data overwrite (Fix 1)
      let latestSummary: any;
      try {
        const latestRes = await fetch(`/api/sessions/${id}`);
        if (latestRes.ok) {
          const latestData = await latestRes.json();
          latestSummary = JSON.parse(latestData.summary);
        } else {
          throw new Error("Failed to fetch latest session");
        }
      } catch {
        // Fall back to existingSummary if fetch fails
        latestSummary = existingSummary;
      }
      delete latestSummary.examProgress;
      const currentAnswers = answersRef.current;
      const mergedSummary = JSON.stringify({
        ...latestSummary,
        exam: { ...latestSummary.exam, phase: 2, questions: allQuestions, answers: currentAnswers },
      });
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: mergedSummary }),
      });

      setQuiz((prev) => prev ? { ...prev, questions: allQuestions } : prev);
      setAnswers((prev) => {
        const next = [...prev];
        for (let i = phase1Questions.length; i < allQuestions.length; i++) {
          if (next[i] === undefined) next[i] = null;
        }
        return next;
      });
      setExamPhase(2);
      setPhase2Popup(false);
      setPhase2Failed(false);
    } catch (e) {
      console.error("[exam] Phase 2 failed, will retry:", e);
      setPhase2Popup(true);
      setPhase2Failed(true);
      phase2StartedRef.current = false; // Allow retry
      // Keep showing popup, user can manually trigger retry
    }
  }, []);

  // Fetch session & start two-phase flow
  useEffect(() => {
    if (!id) return;
    setExamPhase(0);
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) throw new Error("Sesi tidak ditemukan");
        const data = await res.json();
        const parsed = JSON.parse(data.summary);
        contextMetaRef.current = parsed.context_meta || null;
        const imageUrlsList = data.image_urls || [];

        // Case A: Already completed (has score) — only valid if Phase 2 was done or 10+ questions
        // and NOT if there's an in-progress attempt (examProgress exists)
        if (
          parsed.exam?.score !== null && parsed.exam?.score !== undefined &&
          Array.isArray(parsed.exam?.answers) &&
          (parsed.exam?.phase === 2 || (Array.isArray(parsed.exam?.questions) && parsed.exam.questions.length >= 10)) &&
          !parsed.examProgress
        ) {
          setQuiz(parsed.exam);
          setImageUrls(imageUrlsList);
          setAnswers(parsed.exam.answers);
          setShowResults(true);
          scoreAlreadyStored.current = true;
          setExamPhase(2);
          setLoading(false);
          return;
        }

        // Case B: Phase 2 complete or legacy (10 questions, no score yet)
        if (parsed.exam?.phase !== 1 && Array.isArray(parsed.exam?.questions) && parsed.exam.questions.length >= 5) {
          const qs = parsed.exam.questions;
          setQuiz(parsed.exam);
          setImageUrls(imageUrlsList);
          setAnswers(Array.isArray(parsed.exam.answers) && parsed.exam.answers.length === qs.length
            ? parsed.exam.answers
            : new Array(qs.length).fill(null)
          );
          setExamPhase(2);
          setLoading(false);
          // Restore examProgress if any (takes priority over exam.answers)
          const progress = parsed.examProgress;
          if (progress && Array.isArray(progress.answers)) {
            setCurrentIndex(progress.currentIndex ?? 0);
            setAnswers(progress.answers);
            setSeconds(progress.seconds ?? 0);
          }
          return;
        }

        // Case C: Phase 1 done (5 questions), need Phase 2
        if (parsed.exam?.phase === 1 && Array.isArray(parsed.exam?.questions) && parsed.exam.questions.length === 5) {
          const qs = parsed.exam.questions;
          setQuiz({ ...parsed.exam, questions: qs });
          setImageUrls(imageUrlsList);
          setAnswers(new Array(10).fill(null));
          setExamPhase(1);
          setLoading(false);
          // Restore progress for Q1-5
          const progress = parsed.examProgress;
          if (progress && Array.isArray(progress.answers)) {
            setCurrentIndex(progress.currentIndex ?? 0);
            const padded = [...progress.answers];
            while (padded.length < 10) padded.push(null);
            setAnswers(padded);
            setSeconds(progress.seconds ?? 0);
          }
          // Start Phase 2 in background
          setPhase2Failed(false);
          phase2ParamsRef.current = { id, existingSummary: parsed, phase1Questions: qs, imageUrlsList, contextMeta: parsed.context_meta };
          runPhase2(id, parsed, qs, imageUrlsList, parsed.context_meta);
          return;
        }

        // Case D: No exam yet — must come from learn page with context
        // This shouldn't happen normally — redirect back
        throw new Error("Data ujian belum siap. Silakan mulai dari pre-test.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat ujian");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, runPhase2]);

  // Phase 2 popup timer: show after 3s if still in phase 1
  useEffect(() => {
    if (examPhase !== 1) return;
    phase2TimerRef.current = setTimeout(() => {
      setPhase2Popup(true);
    }, 3000);
    return () => {
      if (phase2TimerRef.current) clearTimeout(phase2TimerRef.current);
    };
  }, [examPhase]);

  // Derived data
  const totalQuestions = examPhase >= 1 ? 10 : (quiz?.questions?.length ?? 0);
  const currentQuestion = quiz?.questions?.[currentIndex] ?? null;
  const isQuestionReady = currentQuestion !== null && currentQuestion.question !== undefined;
  const score = quiz
    ? answers.reduce<number>((acc, ans, i) => acc + (ans === quiz.questions[i]?.correct_index ? 1 : 0), 0)
    : 0;
  const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = pct >= 70;

  // Timer — starts only after Phase 1 is ready
  useEffect(() => {
    if (showResults || paused || examPhase < 1) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [showResults, paused, examPhase]);

  // Auto-save progress every 5s and on question change
  useEffect(() => {
    if (showResults || !quiz) return;
    const timeout = setTimeout(() => saveProgress(), 5000);
    return () => clearTimeout(timeout);
  }, [currentIndex, answers, seconds, showResults, quiz, saveProgress]);

  // Store score when exam finishes
  useEffect(() => {
    if (!showResults || !id || !quiz) return;
    if (scoreAlreadyStored.current) return;
    scoreAlreadyStored.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) {
          console.warn(`[exam] Failed to fetch session ${id}: ${res.status}`);
          return;
        }
        const sessionData = await res.json();
        if (!sessionData.summary) {
          console.warn(`[exam] Session ${id} has null summary`);
          return;
        }
        let existingSummary: any;
        try {
          existingSummary = typeof sessionData.summary === "string"
            ? JSON.parse(sessionData.summary)
            : sessionData.summary;
        } catch (e) {
          console.error(`[exam] Failed to parse summary for ${id}:`, e, sessionData.summary?.slice?.(0, 200));
          return;
        }
        const attempts = (existingSummary.exam?.attempts || 0) + 1;
        const finalScore = score * 10;
        delete existingSummary.examProgress;
        const mergedSummary = JSON.stringify({
          ...existingSummary,
          exam: { ...existingSummary.exam, score: finalScore, attempts, answers, completed_at: new Date().toISOString() },
        });
        const patchRes = await fetch(`/api/sessions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: mergedSummary }),
        });
        if (!patchRes.ok) {
          console.warn(`[exam] Score PATCH failed for ${id}: ${patchRes.status}`);
        }
      } catch (e) {
        console.error(`[exam] Score storage error for ${id}:`, e);
      }
    })();
  }, [showResults, id, quiz, score]);

  const handleSelect = useCallback(
    (index: number) => {
      if (showResults) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = index;
        return next;
      });
    },
    [currentIndex, showResults]
  );

  const handleNext = useCallback(() => {
    if (currentIndex >= totalQuestions - 1 && examPhase >= 2) {
      setShowResults(true);
      return;
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex >= (quiz?.questions?.length ?? 0)) {
      // Retry Phase 2 if it failed
      if (phase2Failed && phase2ParamsRef.current) {
        const p = phase2ParamsRef.current;
        runPhase2(p.id, p.existingSummary, p.phase1Questions, p.imageUrlsList, p.contextMeta);
      }
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, totalQuestions, examPhase, quiz?.questions?.length, phase2Failed, runPhase2]);

  const handlePrev = useCallback(() => {
    if (currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  // Tanya pulse — animate after 2 min on unanswered question
  useEffect(() => {
    if (tanyaTimerRef.current) clearTimeout(tanyaTimerRef.current);
    setTanyaPulse(false);
    if (answers[currentIndex] == null && !showResults) {
      console.log("[exam] Starting tanya timer", { currentIndex, answer: answers[currentIndex], showResults });
      tanyaTimerRef.current = setTimeout(() => {
        console.log("[exam] TanyaPulse FIRING at", new Date().toISOString());
        setTanyaPulse(true);
      }, 120000);
    }
    return () => {
      if (tanyaTimerRef.current) clearTimeout(tanyaTimerRef.current);
    };
  }, [currentIndex, answers[currentIndex], showResults]);

  const handleFinish = () => {
    router.push("/dashboard");
  };

  const handleRetryExam = useCallback(async () => {
    if (!id) return;
    setRegenerating(true);
    setError("");
    try {
      const sessionRes = await fetch(`/api/sessions/${id}`);
      if (!sessionRes.ok) throw new Error("Gagal mengambil sesi");
      const sessionData = await sessionRes.json();
      const summary = JSON.parse(sessionData.summary);
      const urls: string[] = sessionData.image_urls || [];
      const contextMeta = summary.context_meta;

      phase2StartedRef.current = false;
      const quizBody: Record<string, unknown> = {
        mode: "exam",
        context: contextMeta,
        kelas: contextMeta?.kelas || null,
        expectedSubject: contextMeta?.subject || null,
      };

      const quizRes = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizBody),
      });
      if (!quizRes.ok) throw new Error("Gagal membuat soal baru");
      const { quiz: newQuiz } = await quizRes.json();

      const attempts = (summary.exam?.attempts || 0) + 1;
      delete summary.examProgress;
      const mergedSummary = JSON.stringify({
        ...summary,
        exam: { ...newQuiz, attempts, score: null },
      });

      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: mergedSummary }),
      });

      setQuiz(newQuiz);
      setImageUrls(urls);
      setAnswers(new Array(newQuiz.questions.length).fill(null));
      setCurrentIndex(0);
      setSeconds(0);
      scoreAlreadyStored.current = false;
      setShowResults(false);
      setRegenerating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat ulang soal");
      setRegenerating(false);
    }
  }, [id]);

  // Loading
  if (loading) {
    return (
      <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat ujian...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !quiz) {
    return (
      <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center px-container-margin-mobile">
        <div className="bg-surface border-2 border-ink-navy rounded-xl p-gutter shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-md text-center">
          <MaterialIcon name="error_outline" className="text-6xl text-error mb-4" />
          <p className="text-headline-md mb-2">{error || "Ujian tidak ditemukan"}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetryExam}
              disabled={regenerating}
              className="btn-tactile bg-primary text-on-primary px-6 py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] font-bold active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? "Membuat Soal..." : "Buat Soal Ujian"}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-tactile bg-surface text-ink-navy px-6 py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] font-bold active:translate-y-1 active:shadow-none transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === RESULTS SCREENS ===
  if (showResults) {
    // PASS SCREEN (score >= 80)
    if (passed) {
      return (
        <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center px-container-margin-mobile relative overflow-hidden">
          {/* Confetti on mount */}
          <ConfettiEffect />

          <main className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center">
            <div className="flex flex-col items-center justify-center p-8 mt-8 rounded-lg border-4 border-ink-navy shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] bg-[#ccfbf1] max-w-lg w-full relative">
              {/* Mascot */}
              <div className="w-48 h-48 mb-stack-md">
                <img
                  alt="Robot Mascot"
                  className="w-full h-full object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBx8h0wue-S-MExfhbd8PDaM2Gy9ssI4N7gBwoF8znQsYOPptK4XtcJfT-km4Ve71Hl2VndKAwySa9OSb-zFRSf_Bjfjc0KlW5mfPCwLalWhWqKUtmEWiOGzimOlUw-dk-yicfbVW6DxRgD9n7gghH9lmPBFwmRwl2LhxGl-EImr5RGVLRKszy5TZ_5M6Bmte7ohpYlkhKpT_7k8QjcDAT4Wrcghzi2kILvF4MxH_JcU8rZEKdf9IqSz2V3rFj4mBSqYUrORjx-Lq0Z2us"
                  style={{ mixBlendMode: "multiply" }}
                />
              </div>

              {/* Speech Bubble */}
              <div className="relative bg-white border-2 border-ink-navy rounded-2xl px-6 py-4 mb-stack-md shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <div className="absolute -top-3 left-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-ink-navy" />
                <p className="font-body-lg text-body-lg text-ink-navy">Luar Biasa! Kamu sudah paham materi ini.</p>
              </div>

              {/* Score */}
              <div className="mb-stack-sm flex flex-col items-center">
                <span className="font-label-lg text-label-lg text-ink-navy/60 uppercase tracking-widest mb-1">SKOR AKHIR</span>
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-success-green leading-none tracking-tighter drop-shadow-sm">
                  {score * 10}
                </h1>
              </div>

              {/* Unlock */}
              <div className="relative py-8" style={{ animation: "bounce 2s ease-in-out infinite" } as React.CSSProperties}>
                <div className="flex flex-col items-center">
                  <div className="bg-secondary-container w-24 h-24 rounded-full flex items-center justify-center border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <MaterialIcon name="lock_open" className="text-5xl text-ink-navy" filled />
                  </div>
                  <div className="mt-4 inline-block px-4 py-1 bg-white border-2 border-ink-navy rounded-full shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    <span className="font-label-sm text-label-sm text-ink-navy">BAB BARU TERBUKA!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-stack-lg flex flex-col items-center gap-stack-sm">
              <button
                onClick={handleFinish}
                className="w-full bg-primary text-white font-black py-5 rounded-lg border-2 border-ink-navy shadow-[0px_6px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 group"
              >
                <span className="text-headline-md tracking-wider">Akhiri Sesi</span>
                <MaterialIcon name="arrow_forward" className="text-white group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push(`/review?id=${id}`)}
                className="w-full bg-secondary-container text-ink-navy font-black py-4 rounded-lg border-2 border-ink-navy shadow-[0px_4px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-1 group"
              >
                <span className="text-headline-md">Lihat Pembahasan</span>
                <MaterialIcon name="chevron_right" className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </main>
        </div>
      );
    }

    // FAIL SCREEN (score < 80)
    return (
      <div className="bg-sky-blue-bg min-h-screen flex flex-col items-center justify-center px-container-margin-mobile">
        <main className="flex flex-col items-center w-full">
          <div className="border-4 border-ink-navy rounded-3xl shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] p-8 w-full max-w-md flex flex-col items-center space-y-6 relative overflow-hidden bg-surface-variant">
            {/* Mascot */}
            <div className="w-48 h-48 flex items-center justify-center" style={{ mixBlendMode: "multiply" }}>
              <img
                alt="Robot Mascot"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkpMKPAazOkt8eL3yL--y4EzexIWD9ApB-FVtXbv-MCYaZvXzXH-2eMj3Fu7Hqf-6hzgI51060emye3PQAL0VaAlQUBk1wU5UmoLK20nzoc82514QrcPyn5DLnrP1e-sA_JLm6Zto1Iv-6Eqvw7Zl5GaXCwX5t0-_HVFFPOM2mLKQNSLpNHPlHeYY8WyGoQWn_WcpXoOKC5OjO3qaXOxwBlDFoD_6r8sG9zPdY1itrkZWUWWWutUdEaFwIlqBhbZUKBgj1veQIL0WEa1Y"
              />
            </div>

            {/* Speech Bubble */}
            <div className="relative bg-white border-4 border-ink-navy shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] rounded-2xl p-4 w-full text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-ink-navy" />
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-white" />
              <p className="font-headline-md text-headline-md text-ink-navy">Semangat! Sedikit lagi kamu pasti bisa.</p>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center pt-4">
              <span className="font-label-lg text-label-lg text-gray-600 tracking-widest">SKOR AKHIR</span>
              <span className="text-rose-600 font-black text-5xl sm:text-6xl md:text-8xl tracking-tighter drop-shadow-sm">{score * 10}</span>
            </div>

            {/* Stats */}
            <div className="w-full grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white/50 border-2 border-ink-navy/10 rounded-xl p-3 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500">BENAR</span>
                <span className="text-xl font-black text-emerald-600">{score}</span>
              </div>
              <div className="bg-white/50 border-2 border-ink-navy/10 rounded-xl p-3 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500">SALAH</span>
                <span className="text-xl font-black text-rose-500">{totalQuestions - score}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-12 flex flex-col items-center w-full max-w-xs">
            <button
              onClick={handleRetryExam}
              disabled={regenerating}
              className="bg-rose-500 text-white border-4 border-ink-navy shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] rounded-full px-12 py-5 text-headline-md font-black w-full transition-all active:translate-y-1 active:shadow-none hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? "Membuat Soal..." : "Ulangi Quiz"}
            </button>
            <button
              onClick={() => router.push(`/review?id=${id}`)}
              className="mt-6 bg-white text-ink-navy border-4 border-ink-navy shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] rounded-full px-12 py-5 text-headline-md font-black w-full transition-all active:translate-y-1 active:shadow-none hover:scale-105 flex items-center justify-center gap-2"
            >
              Lihat Pembahasan
            </button>
            <button
              onClick={handleFinish}
              className="mt-6 bg-primary text-white border-4 border-ink-navy shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] rounded-full px-12 py-5 text-headline-md font-black w-full transition-all active:translate-y-1 active:shadow-none hover:scale-105"
            >
              Akhiri Sesi
            </button>
          </div>
        </main>
      </div>
    );
  }

  // === EXAM QUIZ UI ===
  const speechText = getRandomItem(SPEECH_TEXTS, currentIndex);
  const tipText = getRandomItem(TIPS, currentIndex);

  return (
    <div className="bg-sky-blue-bg min-h-screen flex flex-col items-center">
      {/* Top Navigation */}
      <header className="bg-sky-blue-bg border-b-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sticky top-0 z-50 px-gutter py-3 flex flex-col gap-1 w-full">
        <div className="flex items-start gap-3">
          <button
            onClick={() => { saveProgress(); router.push("/dashboard"); }}
            className="btn-tactile bg-surface border-2 border-ink-navy p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all shrink-0"
          >
            <MaterialIcon name="arrow_back" className="text-ink-navy" />
          </button>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-body-lg md:text-headline-md font-black text-primary leading-tight break-words">Aksaraa Learning Room</span>
            <span className="text-label-sm text-on-surface-variant leading-snug break-words">{quiz.title || "Ujian"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-start pl-[52px]">
          <div className="flex items-center gap-2 bg-surface rounded-full px-3 py-1.5 border-2 border-ink-navy shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <MaterialIcon name="timer" className="text-ink-navy" />
            <span className="text-label-lg text-ink-navy font-bold">{formatTime(seconds)}</span>
          </div>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-2 bg-secondary-container rounded-full px-3 py-1.5 border-2 border-ink-navy hover:scale-105 transition-transform active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
          >
            <MaterialIcon name={paused ? "play_circle" : "pause_circle"} className="text-ink-navy" filled />
            <span className="text-label-lg text-ink-navy font-bold hidden md:inline">{paused ? "Lanjutkan" : "Jeda"}</span>
          </button>
          <button className="hidden md:flex items-center gap-2 bg-surface-variant/50 opacity-60 cursor-not-allowed rounded-full px-3 py-1.5 border-2 border-ink-navy/50">
            <MaterialIcon name="lock" className="text-ink-navy/60" filled />
            <span className="text-label-lg text-ink-navy/60 font-bold hidden md:inline">Selesai</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full max-w-4xl px-container-margin-mobile md:px-container-margin-desktop mt-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="font-label-lg text-label-lg text-ink-navy">Soal {currentIndex + 1} dari {totalQuestions}</span>
              <span className="font-label-lg text-label-lg text-ink-navy">{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
            </div>
            <div className="w-full h-6 rounded-full border-2 border-ink-navy overflow-hidden bg-success-green/20">
              <div
                className="h-full bg-success-green border-r-2 border-ink-navy shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-5xl px-container-margin-mobile mt-stack-md flex flex-col items-center">
        {isQuestionReady ? (
          <div className="relative w-full">
            {/* Mascot + Speech Bubble (above card, left edge aligned with card) */}
            <div className="flex items-end gap-4 mb-stack-sm ml-0 md:ml-[9rem]">
              <div className="w-24 h-24 relative">
                <img
                  alt="Robot mascot"
                  className="w-full h-full object-contain"
                  src="/images/mascot.png"
                />
              </div>
              <div className="relative bg-white border-2 border-ink-navy p-4 rounded-2xl mb-4 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <div className="absolute -left-3 bottom-4 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-ink-navy" />
                <div className="absolute -left-[10px] bottom-[18px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[11px] border-r-white" />
                <p className="font-body-md text-body-md text-ink-navy">{speechText}</p>
              </div>
            </div>
            {/* Flanking Row: Think | Card | Friend */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 w-full">
            {/* Think Mascot (Left) */}
            <div className="w-24 md:w-32 flex-shrink-0 flex justify-center float-anim">
              <img
                alt="Aksaraa Think"
                className="w-full max-w-[120px] md:max-w-[180px] object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]"
                src="/images/Think.png"
              />
            </div>
            {/* Question Card */}
            <div className="flex-1 w-full bg-white border-[4px] border-[#22C55E] rounded-[2.5rem] p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]">
            {/* Diagram image */}
            {currentQuestion && currentQuestion.diagram_index !== null && currentQuestion.diagram_index !== undefined && imageUrls[currentQuestion.diagram_index] && (
              <img
                src={imageUrls[currentQuestion.diagram_index]}
                alt="Diagram"
                className="max-h-64 sm:max-h-80 w-auto max-w-full rounded-lg border-2 border-ink-navy/10 object-contain mx-auto mb-4"
              />
            )}
            <h1
              className="text-sm md:text-body-md font-bold text-ink-navy mb-8 text-center"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(currentQuestion?.question || "", {
                  ALLOWED_TAGS: ["b", "i", "span", "br", "p", "sub", "sup"],
                  ALLOWED_ATTR: ["style"],
                }),
              }}
            />

            {/* 2x2 Box Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-sm">
              {currentQuestion?.options.map((opt, i) => {
                const isSelected = answers[currentIndex] === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`border-2 border-ink-navy rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-6 flex items-center justify-center transition-all hover:bg-secondary-container active:translate-y-1 active:shadow-none ${
                      isSelected ? "bg-secondary-container" : "bg-slate-100"
                    }`}
                  >
                    <span className="text-body-md font-bold text-ink-navy">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Friend Mascot (Right) */}
          <div className="w-24 md:w-32 flex-shrink-0 flex justify-center float-anim">
            <img
              alt="Aksaraa Friend"
              className="w-full max-w-[120px] md:max-w-[180px] object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]"
              src="/images/friend.png"
            />
          </div>
          </div>
        </div>
      ) : (
          <div className="w-full bg-white border-[4px] border-[#22C55E]/30 rounded-[2.5rem] p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-body-md text-on-surface-variant text-center">
                Menyiapkan soal berikutnya...
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center items-center gap-8 mt-10">
          <button
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className={`w-16 h-16 rounded-full bg-white border-2 border-ink-navy flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:translate-y-0`}
          >
            <MaterialIcon name="arrow_back" className="text-ink-navy text-3xl" />
          </button>
          <button
            onClick={handleNext}
            disabled={
              answers[currentIndex] === null || !isQuestionReady ||
              (currentIndex + 1 >= (quiz?.questions?.length ?? 0) && currentIndex < totalQuestions - 1 && !phase2Failed)
            }
            className={`w-16 h-16 rounded-full bg-white border-2 border-ink-navy flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all ${
              (answers[currentIndex] === null || !isQuestionReady ||
               (currentIndex + 1 >= (quiz?.questions?.length ?? 0) && currentIndex < totalQuestions - 1 && !phase2Failed)) ? "opacity-30 cursor-not-allowed" : ""
            }`}
          >
            <MaterialIcon name="arrow_forward" className="text-ink-navy text-3xl" />
          </button>
        </div>

        {/* Tip */}
        <p className="mt-8 text-on-surface-variant font-body-md text-body-md text-center max-w-md opacity-80 italic">
          Tip: {tipText}
        </p>
      </main>

      {/* Paused Overlay */}
      {paused && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPaused(false)} />
          <div className="relative bg-white border-4 border-ink-navy rounded-3xl shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] p-8 mx-4 max-w-sm w-full flex flex-col items-center">
            <div className="w-40 h-40 mb-4">
              <img
                alt="Robot Mascot"
                className="w-full h-full object-contain drop-shadow-lg"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVi7koNp8NS3cwBV1VnKBZ6X460W587zWaTbveDg1Jj4tMm5oL89pjaucjP9jMsZDxe3cfndzLepkt6M1NgkxleH92RoaBQXGTV_nKKW9ETHvDdVmKs_9XoxVjNM_OArjuPs7MeUCbX6Rx5KJNbevEJbQpgH03IDkJSaNzpY-01iMUxvk6dEqOUGw71pmGQlZDCmWsvkdZjyHjvNr_SMEWtZd28ECTXVxTd795PFgtOOzm5frYu2N4LhcL2jSovyZfIrAOQd43XwKyJOg"
              />
            </div>
            <div className="relative bg-sky-blue-bg border-2 border-ink-navy rounded-2xl px-6 py-4 mb-6 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="absolute -top-3 left-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-ink-navy" />
              <p className="font-headline-md text-headline-md text-ink-navy text-center">Ujian dijeda. Istirahat dulu ya!</p>
            </div>
            <button
              onClick={() => setPaused(false)}
              className="w-full bg-primary text-on-primary font-black py-4 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 text-headline-md"
            >
              <MaterialIcon name="play_circle" className="text-on-primary" filled />
              Lanjutkan
            </button>
          </div>
        </div>
      )}

      {/* Phase 2 Popup */}
      {phase2Popup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPhase2Popup(false)} />
          <div className="relative bg-white border-4 border-ink-navy rounded-3xl shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] p-8 mx-4 max-w-sm w-full flex flex-col items-center">
            <div className="w-32 h-32 mb-4">
              <img
                alt="Robot Mascot"
                className="w-full h-full object-contain drop-shadow-lg"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVi7koNp8NS3cwBV1VnKBZ6X460W587zWaTbveDg1Jj4tMm5oL89pjaucjP9jMsZDxe3cfndzLepkt6M1NgkxleH92RoaBQXGTV_nKKW9ETHvDdVmKs_9XoxVjNM_OArjuPs7MeUCbX6Rx5KJNbevEJbQpgH03IDkJSaNzpY-01iMUxvk6dEqOUGw71pmGQlZDCmWsvkdZjyHjvNr_SMEWtZd28ECTXVxTd795PFgtOOzm5frYu2N4LhcL2jSovyZfIrAOQd43XwKyJOg"
              />
            </div>
            <div className="relative bg-sky-blue-bg border-2 border-ink-navy rounded-2xl px-6 py-4 mb-6 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="absolute -top-3 left-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-ink-navy" />
              <p className="font-headline-md text-headline-md text-ink-navy text-center">
                Soal tambahan masih disiapkan. Kerjakan dulu soal yang sudah muncul!
              </p>
            </div>
            <button
              onClick={() => setPhase2Popup(false)}
              className="w-full bg-primary text-on-primary font-black py-4 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 text-headline-md"
            >
              <MaterialIcon name="check_circle" className="text-on-primary" filled />
              Oke, lanjut!
            </button>
          </div>
        </div>
      )}

      {/* FAB Tanya */}
      <button
        onClick={() => { setShowTanya(true); setTanyaPulse(false); }}
        className="fixed bottom-container-margin-mobile right-container-margin-mobile md:bottom-container-margin-desktop md:right-container-margin-desktop rounded-full w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:scale-110 transition-transform active:translate-y-1 active:shadow-none z-50 btn-tactile bg-primary text-on-primary"
      >
        <MaterialIcon name="front_hand" className="text-3xl md:text-4xl mb-1" filled />
        <span className="text-label-sm font-label-sm">Tanya</span>
      </button>
      {tanyaPulse && (
        <div
          className="fixed bottom-container-margin-mobile right-container-margin-mobile md:bottom-container-margin-desktop md:right-container-margin-desktop w-20 h-20 md:w-24 md:h-24 rounded-full pointer-events-none z-40"
          style={{ border: "4px solid #22C55E", backgroundColor: "rgba(34,197,94,0.1)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
        />
      )}

      {/* Tanya AI Chat */}
      <TanyaChat
        isOpen={showTanya}
        onClose={() => setShowTanya(false)}
        sessionId={id}
        contextMeta={contextMetaRef.current}
      />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 border-4 border-primary rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-64 h-64 border-4 border-secondary-container rounded-full blur-2xl animate-pulse" />
      </div>
    </div>
  );
}



function ExamFallback() {
  return (
    <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat...</p>
      </div>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<ExamFallback />}>
      <ExamContent />
    </Suspense>
  );
}
