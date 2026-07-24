"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { TanyaChat } from "@/components/TanyaChat";
import { QuizProgress } from "./components/QuizProgress";
import { QuizQuestion } from "./components/QuizQuestion";
import { AnswerFeedback } from "./components/AnswerFeedback";
import { QuizResults } from "./components/QuizResults";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import RefleksiSection from "./components/RefleksiSection";
import type { QuizData } from "@/lib/scan-store";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

function LearnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [regenerating, setRegenerating] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [verified, setVerified] = useState<boolean[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showTanya, setShowTanya] = useState(false);
  const [showRefleksi, setShowRefleksi] = useState(false);
  const [refleksiDone, setRefleksiDone] = useState(false);
  const [phase2Loading, setPhase2Loading] = useState(false);
  const [phase2Error, setPhase2Error] = useState("");
  const contextMetaRef = useRef<any>(null);
  const assessmentRef = useRef<any>(null);

  // Save progress to session
  const saveProgress = useCallback(async () => {
    if (!id || isFinished) return;
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) return;
      const sessionData = await res.json();
      const existingSummary = JSON.parse(sessionData.summary);
      const mergedSummary = JSON.stringify({
        ...existingSummary,
        learnProgress: { currentIndex, answers, verified, score, seconds },
      });
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: mergedSummary }),
      });
    } catch {
      // non-blocking
    }
  }, [id, currentIndex, answers, verified, score, seconds, isFinished]);

  // Clear learnProgress from session
  const clearProgress = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) return;
      const sessionData = await res.json();
      const summary = JSON.parse(sessionData.summary);
      delete summary.learnProgress;
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: JSON.stringify(summary) }),
      });
    } catch {
      // non-blocking
    }
  }, [id]);

  // Fetch session
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) throw new Error("Sesi tidak ditemukan");
        const data = await res.json();
        const parsed: QuizData = JSON.parse(data.summary);
        contextMetaRef.current = (parsed as any).context_meta || null;
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
          throw new Error("Data quiz tidak valid");
        }
        setQuiz(parsed);
        setImageUrls(data.image_urls || []);

        // Restore progress if available
        const progress = (parsed as any).learnProgress;
        if (progress && Array.isArray(progress.answers)) {
          setCurrentIndex(progress.currentIndex ?? 0);
          setAnswers(progress.answers);
          setVerified(progress.verified ?? new Array(parsed.questions.length).fill(false));
          setScore(progress.score ?? 0);
          setSeconds(progress.seconds ?? 0);
          const idx = progress.currentIndex ?? 0;
          setSelectedIndex(progress.answers[idx] ?? null);
          setShowFeedback(progress.answers[idx] !== null && progress.answers[idx] !== undefined);
        } else {
          setAnswers(new Array(parsed.questions.length).fill(null));
          setVerified(new Array(parsed.questions.length).fill(false));
          setCurrentIndex(0);
          setSelectedIndex(null);
          setShowFeedback(false);
          setScore(0);
          setIsFinished(false);
          setSeconds(0);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat sesi");
      } finally {
        setLoading(false);
        setRegenerating(false);
      }
    })();
  }, [id]);

  // Timer (count-up)
  useEffect(() => {
    if (isFinished || paused) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isFinished, paused]);

  // Auto-save progress every 5s and on question change
  useEffect(() => {
    if (isFinished || !quiz) return;
    const timeout = setTimeout(() => saveProgress(), 5000);
    return () => clearTimeout(timeout);
  }, [currentIndex, answers, verified, score, seconds, isFinished, quiz, saveProgress]);

  const totalQuestions = quiz?.questions?.length ?? 0;
  const currentQuestion = quiz?.questions?.[currentIndex] ?? null;

  const handleAnswer = useCallback(
    (index: number) => {
      if (!currentQuestion || showFeedback) return;
      setSelectedIndex(index);
      setShowFeedback(true);

      const correct = index === currentQuestion.correct_index;
      setScore((s) => s + (correct ? 1 : 0));

      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = index;
        return next;
      });
      setVerified((prev) => {
        const next = [...prev];
        next[currentIndex] = correct;
        return next;
      });
    },
    [currentQuestion, currentIndex, showFeedback]
  );

  const handleNext = useCallback(() => {
    // After Q5 (index 4), show reflection first time only
    if (currentIndex === 4 && !refleksiDone) {
      setShowRefleksi(true);
      return;
    }
    if (currentIndex >= totalQuestions - 1) {
      setIsFinished(true);
      return;
    }
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setSelectedIndex(answers[nextIdx] ?? null);
    setShowFeedback(answers[nextIdx] != null);
  }, [currentIndex, totalQuestions, answers, refleksiDone]);

  const handlePrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const prevIdx = currentIndex - 1;
    setCurrentIndex(prevIdx);
    setSelectedIndex(answers[prevIdx]);
    setShowFeedback(answers[prevIdx] !== null);
  }, [currentIndex, answers]);

  const handleRetry = useCallback(async () => {
    if (!id) return;
    setRegenerating(true);
    setError("");
    try {
      const sessionRes = await fetch(`/api/sessions/${id}`);
      if (!sessionRes.ok) throw new Error("Gagal mengambil sesi");
      const sessionData = await sessionRes.json();
      const imageUrls: string[] = sessionData.image_urls || [];
      const summary = JSON.parse(sessionData.summary);
      const kelas = summary.context_meta?.kelas || null;

      if (imageUrls.length === 0) throw new Error("Tidak ada gambar untuk diproses ulang");

      // Convert Supabase URLs to data URLs for vision LLM
      const imageDataUrls = await Promise.all(
        imageUrls.map(async (url) => {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        })
      );

      // Pass 1 — fresh context extraction from images
      const contextRes = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "context",
          images: imageDataUrls,
          kelas,
        }),
      });
      if (!contextRes.ok) throw new Error("Gagal membaca ulang materi");
      const { context } = await contextRes.json();
      if (!context || context.is_clear === false) {
        throw new Error(context?.rejection_reason || "Gambar kurang jelas");
      }

      // Pass 2 — generate fresh questions from fresh context
      const quizRes = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          mode: "pretest",
          kelas,
          expectedSubject: context.subject,
        }),
      });
      if (!quizRes.ok) throw new Error("Gagal membuat soal baru");
      const result = await quizRes.json();
      if (result.subjectMismatch) throw new Error("Mapel tidak sesuai");
      const { quiz: newQuiz } = result;
      if (!newQuiz.is_clear) throw new Error(newQuiz.rejection_reason || "Gagal membuat soal");

      // Build session summary with matching context_meta
      const sessionSummary = {
        ...newQuiz,
        context_meta: {
          subject: context.subject,
          title: context.title,
          kelas,
          key_concepts: context.key_concepts,
          formulas: context.formulas,
          definitions: context.definitions,
          example_problems: context.example_problems,
        },
      };

      // Clear progress and update session
      const patchRes = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: JSON.stringify(sessionSummary) }),
      });
      if (!patchRes.ok) throw new Error("Gagal memperbarui sesi");

      setQuiz(newQuiz);
      setImageUrls(imageUrls);
      setCurrentIndex(0);
      setSelectedIndex(null);
      setShowFeedback(false);
      setScore(0);
      setAnswers(new Array(newQuiz.questions.length).fill(null));
      setVerified(new Array(newQuiz.questions.length).fill(false));
      setIsFinished(false);
      setSeconds(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat ulang soal");
    } finally {
      setRegenerating(false);
    }
  }, [id]);

  const handleStartExam = useCallback(async () => {
    if (!id) return;
    setError("");
    try {
      const sessionRes = await fetch(`/api/sessions/${id}`);
      if (!sessionRes.ok) throw new Error("Gagal mengambil sesi");
      const sessionData = await sessionRes.json();
      const imageUrls: string[] = sessionData.image_urls || [];
      const summary = JSON.parse(sessionData.summary);
      const contextMeta = summary.context_meta;

      const quizBody: Record<string, unknown> = {
        mode: "exam", count: 5,
        context: contextMeta,
        kelas: contextMeta?.kelas || null,
        expectedSubject: contextMeta?.subject || null,
      };

      const quizRes = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizBody),
      });
      if (!quizRes.ok) throw new Error("Gagal membuat soal ujian");
      const { quiz: examQuiz } = await quizRes.json();

      delete summary.learnProgress;
      const mergedSummary = JSON.stringify({ ...summary, exam: { ...examQuiz, phase: 1 } });

      const patchRes = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: mergedSummary }),
      });
      if (!patchRes.ok) throw new Error("Gagal menyimpan sesi");

      router.push(`/exam?id=${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai ujian");
    }
  }, [id, router]);

  // ── Reflection Phase → generate Q6-10 ──
  const handleRefleksiDone = useCallback(async () => {
    setShowRefleksi(false);
    setRefleksiDone(true);

    // If already 10 questions, just advance
    if (quiz && quiz.questions.length >= 10) {
      setCurrentIndex(5);
      return;
    }

    setPhase2Loading(true);
    setPhase2Error("");

    try {
      const currentQuestions = quiz?.questions || [];
      const exclude = currentQuestions.map((q: any) => q.question);

      const quizRes = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "pretest",
          count: 5,
          exclude,
          context: contextMetaRef.current,
          kelas: (contextMetaRef.current as any)?.kelas || null,
          expectedSubject: (contextMetaRef.current as any)?.subject || null,
        }),
      });

      if (!quizRes.ok) throw new Error("Gagal membuat soal lanjutan");

      const result = await quizRes.json();
      const { quiz: phase2Quiz } = result;
      if (!phase2Quiz?.questions?.length) throw new Error("Soal lanjutan kosong");

      // Jaccard dedup against existing questions
      const normalized = (t: string) =>
        t.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
      const jaccard = (a: string[], b: string[]) => {
        const setA = new Set(a);
        const setB = new Set(b);
        const intersection = new Set([...setA].filter((x) => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        return intersection.size / union.size;
      };

      const deduped = phase2Quiz.questions.filter((q: any) => {
        const words = normalized(q.question);
        return !currentQuestions.some((ex: any) => {
          const exWords = normalized(ex.question);
          return jaccard(words, exWords) > 0.6;
        });
      });

      if (deduped.length === 0) throw new Error("Semua soal lanjutan duplikat");

      const mergedQuestions = [...currentQuestions, ...deduped];

      // Persist merged quiz to session
      try {
        const sessionRes = await fetch(`/api/sessions/${id}`);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const summary = JSON.parse(sessionData.summary);
          const mergedSummary = JSON.stringify({
            ...summary,
            assessment: assessmentRef.current,
            questions: mergedQuestions,
            learnProgress: { currentIndex: 5, answers: [...answers, ...new Array(deduped.length).fill(null)], verified: [...verified, ...new Array(deduped.length).fill(false)], score, seconds },
          });
          await fetch(`/api/sessions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: mergedSummary }),
          });
        }
      } catch {
        // non-blocking — session still works locally
      }

      setQuiz((prev) => (prev ? { ...prev, questions: mergedQuestions } : prev));
      setAnswers((prev) => [...prev, ...new Array(deduped.length).fill(null)]);
      setVerified((prev) => [...prev, ...new Array(deduped.length).fill(false)]);
      setCurrentIndex(5);
    } catch (e) {
      console.error("[refleksi] Phase 2 error:", e);
      setPhase2Error(e instanceof Error ? e.message : "Gagal memuat soal lanjutan");
      // Fallback: finish with what we have
      setIsFinished(true);
    } finally {
      setPhase2Loading(false);
    }
  }, [id, quiz, answers, verified, score, seconds]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat soal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center px-container-margin-mobile">
        <div className="bg-surface border-2 border-ink-navy rounded-xl p-gutter shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-md text-center">
          <MaterialIcon name="error_outline" className="text-6xl text-error mb-4" />
          <p className="text-headline-md mb-2">{error || "Soal tidak ditemukan"}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              disabled={regenerating}
              className="btn-tactile bg-primary text-on-primary px-6 py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] font-bold active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? "Membuat Soal..." : "Coba Lagi"}
            </button>
            <button
              onClick={async () => {
                try {
                  await fetch(`/api/sessions/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ summary: "{}" }),
                  });
                } catch {
                  // silently fail — still navigate
                }
                router.push("/dashboard");
              }}
              className="btn-tactile bg-surface text-ink-navy px-6 py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] font-bold active:translate-y-1 active:shadow-none transition-all"
            >
              Kembali ke Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (isFinished) {
    return (
      <QuizResults
        score={score}
        total={totalQuestions}
        title={quiz.title}
        sessionId={id}
        onRetry={handleRetry}
        regenerating={regenerating}
        onStartExam={handleStartExam}
      />
    );
  }

  // Reflection / Phase 2 loading
  if (showRefleksi || phase2Loading) {
    const refleksiSubject = (contextMetaRef.current as any)?.subject || quiz?.title || "Mata Pelajaran";
    const refleksiTitle = quiz?.title || "Materi Belajar";
    return (
      <div className="bg-sky-blue-bg min-h-screen font-body-md text-on-background flex flex-col">
        {/* Top Navigation */}
        <header className="bg-sky-blue-bg border-b-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sticky top-0 z-50 px-gutter py-3 flex flex-col gap-1 w-full">
          <div className="flex items-start gap-3">
            <button
              onClick={() => {
                saveProgress();
                router.push("/dashboard");
              }}
              className="btn-tactile bg-surface border-2 border-ink-navy p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all shrink-0"
              aria-label="Kembali"
            >
              <MaterialIcon name="arrow_back" className="text-ink-navy" />
            </button>
            <div className="flex flex-col min-w-0 flex-1">
<span className="text-body-lg md:text-headline-md font-black text-primary leading-tight break-words">Aksaraa Learning Room</span>
            <span className="text-label-sm text-on-surface-variant leading-snug break-words">{quiz?.title || "Pre-Test"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-start pl-[52px]">
            <div className="flex items-center gap-2 bg-surface rounded-full px-3 py-1.5 border-2 border-ink-navy shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <MaterialIcon name="timer" className="text-ink-navy" />
              <span className="text-label-lg font-label-lg text-ink-navy font-bold">{formatTime(seconds)}</span>
            </div>
          </div>
        </header>

        {phase2Loading ? (
          <main className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-headline-md text-on-surface-variant animate-pulse">Menyiapkan soal lanjutan...</p>
          </main>
        ) : (
          <RefleksiSection
            contextMeta={contextMetaRef.current as any}
            sessionId={id}
            subject={refleksiSubject}
            title={refleksiTitle}
            onComplete={handleRefleksiDone}
            onAssessmentResult={(a) => { assessmentRef.current = a; }}
          />
        )}

        {/* Tanya AI Chat */}
        <TanyaChat
          isOpen={showTanya}
          onClose={() => setShowTanya(false)}
          sessionId={id}
          contextMeta={contextMetaRef.current}
        />

        {/* Paused Overlay */}
        {paused && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPaused(false)} />
            <div className="relative bg-white border-4 border-ink-navy rounded-3xl shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] p-8 mx-4 max-w-sm w-full flex flex-col items-center">
              <div className="w-40 h-40 mb-4">
                <img
                  alt="Robot Mascot"
                  className="w-full h-full object-contain drop-shadow-lg"
                  src="/images/google/5262c968.png"
                />
              </div>
              <div className="relative bg-sky-blue-bg border-2 border-ink-navy rounded-2xl px-6 py-4 mb-6 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <div className="absolute -top-3 left-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-ink-navy" />
                <p className="font-headline-md text-headline-md text-ink-navy text-center">Pre-test dijeda. Istirahat dulu ya!</p>
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
      </div>
    );
  }

  return (
    <div className="bg-sky-blue-bg min-h-screen font-body-md text-on-background">
      {/* Top Navigation */}
      <header className="bg-sky-blue-bg border-b-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sticky top-0 z-50 px-gutter py-3 flex flex-col gap-1 w-full">
        <div className="flex items-start gap-3">
          <button
            onClick={() => {
              saveProgress();
              router.push("/dashboard");
            }}
            className="btn-tactile bg-surface border-2 border-ink-navy p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all shrink-0"
            aria-label="Kembali"
          >
            <MaterialIcon name="arrow_back" className="text-ink-navy" />
          </button>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-body-lg md:text-headline-md font-black text-primary leading-tight break-words">Aksaraa Learning Room</span>
            <span className="text-label-sm text-on-surface-variant leading-snug break-words">{quiz.title || "Pre-Test"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-start pl-[52px]">
          <div className="flex items-center gap-2 bg-surface rounded-full px-3 py-1.5 border-2 border-ink-navy shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <MaterialIcon name="timer" className="text-ink-navy" />
            <span className="text-label-lg font-label-lg text-ink-navy font-bold">{formatTime(seconds)}</span>
          </div>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-2 bg-secondary-container rounded-full px-3 py-1.5 border-2 border-ink-navy hover:scale-105 transition-transform active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
          >
            <MaterialIcon name={paused ? "play_circle" : "pause_circle"} className="text-ink-navy" filled />
            <span className="text-label-lg font-label-lg text-ink-navy font-bold hidden md:inline">{paused ? "Lanjutkan" : "Jeda"}</span>
          </button>
          <button className="hidden md:flex items-center gap-2 bg-surface-variant/50 opacity-60 cursor-not-allowed rounded-full px-3 py-1.5 border-2 border-ink-navy/50">
            <MaterialIcon name="lock" className="text-ink-navy/60" filled />
            <span className="text-label-lg font-label-lg text-ink-navy/60 font-bold hidden md:inline">Selesai</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-container-margin-mobile md:px-container-margin-desktop pt-stack-md pb-[160px] md:pb-32">
        {/* Progress Bar Section */}
        <QuizProgress current={currentIndex + 1} total={totalQuestions} />

        {/* Encouragement mascot */}
        {!showFeedback && (
          <div className="flex items-start gap-3 mt-4 mb-2">
            <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 float-anim">
              <img
                alt="Aksaraa Friend"
                className="w-full h-full object-contain"
                src="/images/friend.png"
              />
            </div>
            <div className="bg-white border-2 border-ink-navy rounded-xl rounded-tl-none p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <p className="text-body-md font-bold text-ink-navy">Ayo semangat! Kamu pasti bisa!</p>
            </div>
          </div>
        )}
        {showFeedback && <div className="h-4 md:h-6" />}

        {/* Question Card */}
        <QuizQuestion
          question={currentQuestion!.question}
          options={currentQuestion!.options}
          selectedIndex={selectedIndex}
          correctIndex={currentQuestion!.correct_index}
          answered={showFeedback}
          onSelect={handleAnswer}
          imageUrls={imageUrls}
          diagramIndex={currentQuestion!.diagram_index ?? null}
        />

        {/* Confetti on correct answer */}
        {showFeedback && verified[currentIndex] && <ConfettiEffect />}

        {/* Feedback Card Section */}
        {showFeedback && (
          <AnswerFeedback
            isCorrect={verified[currentIndex]}
            explanationHtml={currentQuestion!.explanation_html}
            onNext={handleNext}
            onPrev={currentIndex > 0 ? handlePrev : undefined}
            isLast={currentIndex >= totalQuestions - 1}
            isFirst={currentIndex === 0}
          />
        )}
      </main>

      {/* Contextual FAB */}
      <button
        onClick={() => setShowTanya(true)}
        className="fixed bottom-container-margin-mobile right-container-margin-mobile md:bottom-container-margin-desktop md:right-container-margin-desktop bg-primary text-on-primary rounded-full w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:scale-110 transition-transform active:translate-y-1 active:shadow-none z-50 btn-tactile"
      >
        <MaterialIcon name="front_hand" className="text-3xl md:text-4xl mb-1" filled />
        <span className="text-label-sm font-label-sm">Tanya</span>
      </button>

      {/* Tanya AI Chat */}
      <TanyaChat
        isOpen={showTanya}
        onClose={() => setShowTanya(false)}
        sessionId={id}
        contextMeta={contextMetaRef.current}
      />

      {/* Paused Overlay */}
      {paused && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPaused(false)} />
          <div className="relative bg-white border-4 border-ink-navy rounded-3xl shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] p-8 mx-4 max-w-sm w-full flex flex-col items-center">
            <div className="w-40 h-40 mb-4">
              <img
                alt="Robot Mascot"
                className="w-full h-full object-contain drop-shadow-lg"
                src="/images/google/5262c968.png"
              />
            </div>
            <div className="relative bg-sky-blue-bg border-2 border-ink-navy rounded-2xl px-6 py-4 mb-6 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="absolute -top-3 left-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-ink-navy" />
              <p className="font-headline-md text-headline-md text-ink-navy text-center">Pre-test dijeda. Istirahat dulu ya!</p>
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
    </div>
  );
}

function LearnFallback() {
  return (
    <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat...</p>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<LearnFallback />}>
      <LearnContent />
    </Suspense>
  );
}
