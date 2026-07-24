"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import DOMPurify from "dompurify";

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  explanation_html: string;
}

interface ExamData {
  title: string;
  questions: Question[];
  answers?: (number | null)[];
}

const SPEECH_TEXTS = {
  high: [
    "Hebat! Kamu menguasai materi ini dengan baik!",
    "Luar biasa! Nilai kamu memuaskan!",
    "Pertahankan ya, hasil belajarmu bagus sekali!",
  ],
  medium: [
    "Mantap! Tingkatkan beberapa yang salah ya.",
    "Sudah cukup baik, yuk kita pelajari lagi yang terlewat.",
    "Semangat! Masih ada ruang untuk jadi lebih baik.",
  ],
  low: [
    "Ayo semangat! Yuk kita pelajari lagi yang salah.",
    "Jangan menyerah! Setiap kesalahan adalah pelajaran berharga.",
    "Tetap semangat! Kamu pasti bisa lebih baik lagi.",
  ],
};

const MINI_MASCOTS = [
  "/images/google/30882c59.png",
  "/images/google/05628cbb.png",
  "/images/google/02a69294.png",
];

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exam, setExam] = useState<ExamData | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) throw new Error("Sesi tidak ditemukan");
        const data = await res.json();
        const parsed = JSON.parse(data.summary);
        if (!parsed.exam || !Array.isArray(parsed.exam.questions)) {
          throw new Error("Data ujian tidak ditemukan.");
        }
        if (!Array.isArray(parsed.exam.answers)) {
          throw new Error("Data pembahasan belum tersedia.");
        }
        if (parsed.exam.answers.length !== parsed.exam.questions.length) {
          console.warn(`[review] Mismatch: answers(${parsed.exam.answers.length}) vs questions(${parsed.exam.questions.length})`);
          throw new Error("Data pembahasan tidak lengkap. Silakan ulangi ujian.");
        }
        const examData = parsed.exam as ExamData;
        const calculatedScore = examData.questions.reduce(
          (acc, q, i) => acc + (examData.answers?.[i] === q.correct_index ? 1 : 0),
          0
        );
        setScore(calculatedScore);
        setExam(examData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat pembahasan");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const speechText = useMemo(() => {
    const pct = exam && exam.questions.length > 0 ? (score / exam.questions.length) * 100 : 0;
    let bucket: string[];
    if (pct >= 80) bucket = SPEECH_TEXTS.high;
    else if (pct >= 50) bucket = SPEECH_TEXTS.medium;
    else bucket = SPEECH_TEXTS.low;
    return bucket[score % bucket.length];
  }, [exam, score]);

  if (loading) {
    return (
      <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat pembahasan...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center px-container-margin-mobile">
        <div className="bg-surface border-2 border-ink-navy rounded-xl p-gutter shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-md text-center">
          <MaterialIcon name="error_outline" className="text-6xl text-error mb-4" />
          <p className="text-headline-md mb-2">{error || "Pembahasan tidak ditemukan"}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-tactile bg-primary text-on-primary px-6 py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] font-bold active:translate-y-1 active:shadow-none transition-all"
            >
              Coba Lagi
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

  const total = exam.questions.length;

  return (
    <div className="bg-sky-blue-bg min-h-screen">
      {/* Header */}
      <header className="bg-sky-blue-bg border-b-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sticky top-0 z-50 px-gutter py-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="btn-tactile bg-surface border-2 border-ink-navy p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all"
          >
            <MaterialIcon name="arrow_back" className="text-ink-navy" />
          </button>
          <div className="flex flex-col">
            <span className="text-headline-md font-black text-primary">Aksaraa Learning Room</span>
            <span className="text-label-sm text-on-surface-variant">Review Jawaban</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-8 px-container-margin-mobile max-w-3xl mx-auto space-y-gutter pb-8">
        {/* Mascot + Speech Bubble (sticky) */}
        <div className="sticky top-[72px] z-40 flex items-start gap-4 mb-8 bg-sky-blue-bg py-2">
          <img
            alt="Spark the Robot"
            className="w-24 h-24 object-contain animate-bounce flex-shrink-0"
            src="/images/google/6b11f30f.png"
          />
          <div className="relative bg-white border-2 border-ink-navy p-4 rounded-lg shadow-[4px_4px_0_0_#111c2d] flex-1">
            <div className="absolute -left-3 top-5 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-ink-navy" />
            <div className="absolute -left-[9px] top-5 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-white z-10" />
            <p className="font-body-lg text-body-lg text-on-surface">{speechText}</p>
          </div>
        </div>

        {/* Question Cards */}
        {exam.questions.map((q, i) => {
          const userAnswer = exam.answers?.[i] ?? null;
          const isCorrect = userAnswer === q.correct_index;
          const isWrong = userAnswer !== null && userAnswer !== q.correct_index;
          const isUnanswered = userAnswer === null;

          const sanitized = DOMPurify.sanitize(q.explanation_html, {
            ALLOWED_TAGS: ["b", "i", "span", "br", "p", "ul", "li", "img"],
            ALLOWED_ATTR: ["style", "class", "src", "alt"],
          });

          return (
            <div
              key={i}
              className="bg-surface-container-lowest p-6 rounded-lg border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
            >
              {/* Header Row */}
              <div className="flex justify-between items-start mb-4">
                <span className="bg-primary text-white px-3 py-1 rounded-full font-label-sm text-label-sm">
                  Pertanyaan {i + 1}
                </span>
                {isCorrect && (
                  <span className="text-success-green flex items-center gap-1 font-label-lg">
                    <MaterialIcon name="check_circle" className="text-lg" filled />
                    Benar!
                  </span>
                )}
                {isWrong && (
                  <span className="text-error flex items-center gap-1 font-label-lg">
                    <MaterialIcon name="cancel" className="text-lg" filled />
                    Salah
                  </span>
                )}
                {isUnanswered && (
                  <span className="text-gray-500 flex items-center gap-1 font-label-lg">
                    <MaterialIcon name="help_outline" className="text-lg" />
                    Tidak dijawab
                  </span>
                )}
              </div>

              {/* Question */}
              <h2
                className="font-body-md text-body-md mb-6"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(q.question, {
                    ALLOWED_TAGS: ["b", "i", "span", "br", "p", "sub", "sup"],
                    ALLOWED_ATTR: ["style"],
                  }),
                }}
              />

              {/* Answer Display */}
              <div className="space-y-4 mb-8">
                {isCorrect && (
                  <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-lg border-2 border-success-green">
                    <span className="font-body-md text-on-surface">
                      Jawaban Kamu: {q.options[userAnswer]}
                    </span>
                    <MaterialIcon name="check_circle" className="text-success-green" filled />
                  </div>
                )}
                {isWrong && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-error-container rounded-lg border-2 border-error">
                      <span className="font-body-md text-on-error-container">
                        Jawaban Kamu: {q.options[userAnswer]}
                      </span>
                      <MaterialIcon name="close" className="text-error" filled />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-lg border-2 border-success-green">
                      <span className="font-body-md text-on-surface">
                        Jawaban Benar: {q.options[q.correct_index]}
                      </span>
                      <MaterialIcon name="check_circle" className="text-success-green" filled />
                    </div>
                  </>
                )}
                {isUnanswered && (
                  <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-lg border-2 border-success-green">
                    <span className="font-body-md text-on-surface">
                      Jawaban Benar: {q.options[q.correct_index]}
                    </span>
                    <MaterialIcon name="check_circle" className="text-success-green" filled />
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div className="flex gap-4 p-4 bg-secondary-fixed rounded-lg border-2 border-on-secondary-container">
                <div className="flex-shrink-0">
                  <img
                    alt="Spark Robot Mini"
                    className="w-12 h-12 object-contain"
                    src={MINI_MASCOTS[i % MINI_MASCOTS.length]}
                  />
                </div>
                <div className="font-body-md text-on-secondary-container min-w-0">
                  <p className="font-bold mb-1">Tips Spark:</p>
                  <div
                    className="[&_b]:font-bold [&_i]:italic [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2"
                    dangerouslySetInnerHTML={{ __html: sanitized }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}

function ReviewFallback() {
  return (
    <div className="bg-sky-blue-bg min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat...</p>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewFallback />}>
      <ReviewContent />
    </Suspense>
  );
}
