"use client";

import { useState } from "react";
import { SUBJECT_ICONS, SUBJECT_ORDER } from "@/lib/subjects";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface SubjectScoreData {
  subject: string;
  score: number | null;
}

interface SubjectScoreListProps {
  scores: SubjectScoreData[];
}

function ScoreRing({ score }: { score: number | null }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const clamped = score !== null ? Math.min(Math.max(score, 0), 100) : 0;
  const offset = circumference - (clamped / 100) * circumference;
  const isBlue = score !== null && score >= 90;
  const strokeColor = isBlue ? "#005da7" : "#fdc003";
  const textColor = isBlue ? "text-blue-900" : "text-amber-800";

  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90">
        <circle cx="24" cy="24" fill="none" r="20" stroke="rgba(255,255,255,0.4)" strokeWidth="4" />
        <circle cx="24" cy="24" fill="none" r="20" stroke={strokeColor} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="4" className="transition-all duration-700" />
      </svg>
      <span className={`absolute text-label-sm font-bold ${textColor}`}>
        {score !== null ? score : "—"}
      </span>
    </div>
  );
}

function SubjectScoreModal({ scores, onClose }: { scores: SubjectScoreData[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline-md font-bold">Semua Nilai</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
            <MaterialIcon name="close" className="text-on-surface-variant" />
          </button>
        </div>
        <div className="space-y-3">
          {scores.map((s) => {
            const meta = SUBJECT_ICONS[s.subject];
            return (
              <div
                key={s.subject}
                className={`bg-gradient-to-br ${meta?.gradient ?? "from-gray-100 to-gray-200"} p-4 rounded-2xl card-shadow flex items-center gap-4 border border-white/50`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm">
                  {meta?.imageUrl ? (
                    <img alt={s.subject} className="w-10 h-10 object-contain" src={meta.imageUrl} />
                  ) : (
                    <MaterialIcon name="menu_book" className="text-ink-navy text-2xl" filled />
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-body-lg leading-tight">{s.subject}</h4>
                </div>
                <ScoreRing score={s.score} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SubjectScoreList({ scores }: SubjectScoreListProps) {
  const [showModal, setShowModal] = useState(false);
  const visible = scores.slice(0, 3);
  const scoreMap = new Map(scores.map((s) => [s.subject, s]));

  const allScoresInOrder = SUBJECT_ORDER.map((sub) => {
    const found = scoreMap.get(sub);
    return { subject: sub, score: found?.score ?? null };
  });

  return (
    <section className="mb-8">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-headline-md font-bold">Rata-rata Nilai</h3>
        <button
          onClick={() => setShowModal(true)}
          className="md:hidden text-primary text-label-sm font-bold flex items-center gap-1"
        >
          Lihat Semua
          <MaterialIcon name="chevron_right" className="text-[16px]" />
        </button>
      </div>

      {/* Mobile: show 3 items */}
      <div className="space-y-3 md:hidden">
        {visible.map((s) => {
          const meta = SUBJECT_ICONS[s.subject];
          const gradient = meta?.gradient ?? "from-gray-100 to-gray-200";
          return (
            <div
              key={s.subject}
              className={`bg-gradient-to-br ${gradient} p-4 rounded-2xl card-shadow flex items-center gap-4 relative overflow-hidden border border-white/50`}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm relative z-10">
                {meta?.imageUrl ? (
                  <img alt={s.subject} className="w-10 h-10 object-contain" src={meta.imageUrl} />
                ) : (
                  <MaterialIcon name="menu_book" className="text-ink-navy text-2xl" filled />
                )}
              </div>
              <div className="flex-grow relative z-10">
                <h4 className="font-bold text-body-lg leading-tight">{s.subject}</h4>
              </div>
              <ScoreRing score={s.score} />
              <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-xl opacity-30 bg-current" />
            </div>
          );
        })}
      </div>

      {/* Desktop: show all 6 in grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {allScoresInOrder.map((s) => {
          const meta = SUBJECT_ICONS[s.subject];
          const gradient = meta?.gradient ?? "from-gray-100 to-gray-200";
          return (
            <div
              key={s.subject}
              className={`bg-gradient-to-br ${gradient} p-4 rounded-2xl card-shadow flex items-center gap-4 relative overflow-hidden border border-white/50`}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm relative z-10">
                {meta?.imageUrl ? (
                  <img alt={s.subject} className="w-10 h-10 object-contain" src={meta.imageUrl} />
                ) : (
                  <MaterialIcon name="menu_book" className="text-ink-navy text-2xl" filled />
                )}
              </div>
              <div className="flex-grow relative z-10">
                <h4 className="font-bold text-body-lg leading-tight">{s.subject}</h4>
              </div>
              <ScoreRing score={s.score} />
              <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-xl opacity-30 bg-current" />
            </div>
          );
        })}
      </div>

      {scores.length === 0 && (
        <div className="bg-surface-container-low rounded-2xl p-6 card-shadow text-center">
          <p className="text-body-md text-on-surface-variant">
            Belum ada nilai. Yuk mulai belajar!
          </p>
        </div>
      )}

      {showModal && (
        <SubjectScoreModal
          scores={allScoresInOrder}
          onClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
}
