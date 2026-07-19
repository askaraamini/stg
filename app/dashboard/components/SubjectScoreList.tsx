"use client";

import type { ReactNode } from "react";
import { SUBJECT_ICONS, SUBJECT_ORDER } from "@/lib/subjects";

interface SubjectScoreData {
  subject: string;
  score: number | null;
}

interface SubjectScoreListProps {
  scores: SubjectScoreData[];
  children?: ReactNode;
}

function ScoreRing({ score, strokeColor, textColor }: { score: number | null; strokeColor: string; textColor: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const clamped = score !== null ? Math.min(Math.max(score, 0), 100) : 0;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90">
        <circle cx="24" cy="24" fill="none" r="20" stroke="rgba(255,255,255,0.4)" strokeWidth="4" />
        <circle cx="24" cy="24" fill="none" r="20" stroke={strokeColor} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="4" className="transition-all duration-700" />
      </svg>
      <span className={`absolute text-label-lg font-bold ${textColor}`}>
        {score !== null ? score : "—"}
      </span>
    </div>
  );
}

export function SubjectScoreList({ scores, children }: SubjectScoreListProps) {
  const scoreMap = new Map(scores.map((s) => [s.subject, s]));

  const allScoresInOrder = SUBJECT_ORDER.map((sub) => {
    const found = scoreMap.get(sub);
    return { subject: sub, score: found?.score ?? null };
  });

  return (
    <section className="flex-1 flex flex-col min-h-0">
      {/* Title — never moves, stays in normal flow */}
      <div className="flex-shrink-0 flex justify-between items-end mb-4">
        <h3 className="font-headline-md text-headline-md text-on-surface">Rata-rata Nilai</h3>
      </div>

      {/* Scrollable content — cards + daily mission */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {allScoresInOrder.map((s) => {
          const meta = SUBJECT_ICONS[s.subject];
          const gradient = meta?.gradient ?? "from-gray-100 to-gray-200";
          const textColor = meta?.textColor ?? "text-on-surface";
          const ringColor = meta?.ringColor ?? "#fdc003";
          return (
            <div
              key={s.subject}
              className={`bg-gradient-to-br ${gradient} p-3 md:p-5 rounded-2xl card-shadow flex items-center gap-4 relative overflow-hidden border border-white/50`}
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm relative z-10">
                {meta?.imageUrl ? (
                  <img alt={s.subject} className="w-8 h-8 md:w-11 md:h-11 object-contain" src={meta.imageUrl} />
                ) : (
                  <div className="w-8 h-8 md:w-11 md:h-11 flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined text-2xl">menu_book</span>
                  </div>
                )}
              </div>
              <div className="flex-grow relative z-10">
                <h4 className={`font-headline-md text-[16px] md:text-xl leading-tight font-semibold ${textColor}`}>{s.subject}</h4>
              </div>
              <ScoreRing score={s.score} strokeColor={ringColor} textColor={textColor} />
            </div>
          );
        })}

        {scores.length === 0 && (
          <div className="bg-surface-container-low rounded-2xl p-6 card-shadow text-center">
            <p className="text-body-md text-on-surface-variant">
              Belum ada nilai. Yuk mulai belajar!
            </p>
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
