"use client";

import { useRouter } from "next/navigation";
import { SUBJECT_ICONS, SUBJECT_ICON_NAMES } from "@/lib/subjects";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { ActiveSession } from "../types";

const MASCOT_URLS = [
  "/images/google/9835bcb3.png",
  "/images/google/dc6132f2.png",
  "/images/google/aeeff363.png",
];

interface ContinueLearningProps {
  sessions: ActiveSession[];
  onContinue: (id: string) => void;
}

export function ContinueLearning({ sessions, onContinue }: ContinueLearningProps) {
  if (sessions.length === 0) {
    return (
      <section className="flex-shrink-0 mb-8">
      <h3 className="font-headline-md text-headline-md mb-4">Lanjutkan Pelajaran</h3>
        <div className="bg-surface-container-low rounded-3xl p-8 card-shadow flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 opacity-60 animate-bounce">
            <img
              alt="Mascot"
              className="w-full h-full object-contain"
              src={MASCOT_URLS[0]}
            />
          </div>
          <p className="text-body-md text-on-surface-variant">
            Belum ada sesi aktif. Yuk scan buku untuk mulai belajar!
          </p>
          <button
            onClick={() => onContinue("new")}
            className="bg-primary text-white rounded-full px-6 py-2.5 text-label-lg font-bold shadow-lg active:scale-95 transition-transform"
          >
            Scan Buku Baru
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h3 className="text-headline-md font-bold mb-4">Lanjutkan Pelajaran</h3>
      <div className="flex gap-4 overflow-x-auto scroll-hide py-2">
        {sessions.map((session, idx) => {
          const meta = SUBJECT_ICONS[session.subjectName];
          const gradient = meta?.gradient ?? "from-purple-100 to-pink-100";
          const imgUrl = meta?.imageUrl ?? "";
          const mascotUrl = MASCOT_URLS[idx % MASCOT_URLS.length];

          return (
            <button
              key={session.id}
              onClick={() => onContinue(session.id)}
              className={`w-[234px] shrink-0 md:w-auto md:shrink bg-gradient-to-br ${gradient} rounded-3xl p-5 card-shadow flex flex-col gap-3 relative overflow-hidden active:scale-95 transition-all duration-200 border border-white/50 text-left ${meta?.textColor ?? ""}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm">
                {imgUrl ? (
                  <img alt="" className="w-8 h-8 object-contain" src={imgUrl} />
                ) : (
                  <MaterialIcon name={SUBJECT_ICON_NAMES[session.subjectName] || "menu_book"} className="text-on-surface text-2xl" filled />
                )}
              </div>
              <div className="relative z-10 pr-20">
                <h4 className={`font-bold text-label-lg leading-tight mb-0.5 truncate md:line-clamp-2 ${meta?.textColor ?? ""}`}>
                  {session.chapterTitle}
                </h4>
                <p className={`text-xs font-semibold opacity-70 truncate ${meta?.textColor ?? ""}`}>{session.subjectName}</p>
              </div>
              <div className="mt-auto relative z-10 pr-20">
                <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${meta?.progressColor ?? "bg-on-surface/60"} rounded-full transition-all`}
                    style={{ width: `${session.progressPercentage}%` }}
                  />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-4 w-24 h-24 opacity-90 pointer-events-none">
                <img
                  alt=""
                  className="w-full h-full object-contain"
                  src={mascotUrl}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
