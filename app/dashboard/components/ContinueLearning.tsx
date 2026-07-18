"use client";

import { useRouter } from "next/navigation";
import { SUBJECT_ICONS } from "@/lib/subjects";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { ActiveSession } from "../types";

const MASCOT_URLS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC7IvwhqDbze04L3XmC8DWhyhwKCkdENdl1UhhcnWC8fT3jSqOtySF4cl4wO-OWjUeui6aXFG9KlEf0ymLvYzXEHcmt_YvzyPBvPkQwM-K4nBkPMII4jDQNPgDbNF0RKxujsBa9L0ISy3mzVBglSYDoL8asdtordCnVTFZfywJUI-riE7QOH3gsqsKlSpedBTrXgXnTqLJHlqZiaCYSgHspDjwtWPUxhXHRO5t1Fm7QmDwN3Qe-KoktL7GgVR61OIvsxw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBGei5sF-W_lAH2nLZqLd_e6bPID95Hs2dDH_ns0OeHPNVoaMLAAAf8I4kx0fjSi5A1P1mVcaA3tqcyg66Bo4AuSlaC5XXkom7kHupBO9cI5DIqffYC_RYNBDcar5br0jV0pplimZ8h8wldUDPwui_6ZIV4MSdmHHTGHcBmiT2xRbMAsN-ogHN6ZJQq9buiXPDqRdaiioubxlXv5_SM1lymQm7rVUqSC5Earq7gSD6m1MaOyTF4tUiMWmGzDBBRFJo0Zg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD89uUQUZPczU9n5PIXQgDwzHwt2sCY4OWBetb86v7tCM0bZ7p4wzZv217kKoRfPRTSRiO7gpbLPSfi5zy4pBNTdcUMH70UowWIrelVSbqikLj2FxjchVPsmHOtYVpl0sBvnYjkb4xg5CLZG8495DT-IJ8IM508Sh-TAaUkTpcfrvzHhVgj_OObc3YnEN9OSWRI9qQSIa9veV68rIrqrImRaM-f4rStybHwiSXCsA36M8pbheMsw0fGUFfl5G_OaGIVAg",
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
      <div className="flex gap-4 overflow-x-auto scroll-hide -mx-container-margin px-container-margin py-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:gap-3 md:mx-0 md:px-0">
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
                  <MaterialIcon name="menu_book" className="text-on-surface text-2xl" filled />
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
