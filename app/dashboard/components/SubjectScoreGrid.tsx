import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { SubjectScore } from "../types";

interface SubjectScoreGridProps {
  scores: SubjectScore[];
}

export function SubjectScoreGrid({ scores }: SubjectScoreGridProps) {
  const hasScores = scores.some((s) => s.score !== null);

  if (!hasScores) return null;

  return (
    <section className="px-5 mb-6">
      <h2 className="text-headline-sm font-bold text-on-surface mb-3">Rata-rata Nilai</h2>
      <div className="grid grid-cols-2 gap-3">
        {scores.map((s) => (
          <div
            key={s.subject}
            className={`${s.bgClass} rounded-2xl p-4 card-shadow flex items-center gap-3`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
              <MaterialIcon name={s.icon} className={`text-xl ${s.textClass}`} filled />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-sm font-medium text-on-surface truncate">{s.subject}</p>
              <p className={`text-headline-md font-bold ${s.textClass}`}>
                {s.score !== null ? s.score : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
