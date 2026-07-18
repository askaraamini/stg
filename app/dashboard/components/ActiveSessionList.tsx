import { ActiveSessionCard } from "./ActiveSessionCard";
import type { ActiveSession } from "../types";

const SUBJECT_META: Record<string, { icon: string; bgClass: string; textClass: string }> = {
  Matematika: { icon: "functions", bgClass: "bg-rose-100", textClass: "text-primary" },
  "IPA (Sains)": { icon: "biotech", bgClass: "bg-emerald-100", textClass: "text-success-green" },
  "Bahasa Indonesia": { icon: "translate", bgClass: "bg-yellow-100", textClass: "text-secondary" },
  "Bahasa Inggris": { icon: "language", bgClass: "bg-blue-100", textClass: "text-blue-600" },
  "IPS (Sejarah)": { icon: "history_edu", bgClass: "bg-purple-100", textClass: "text-purple-600" },
  "Seni & Budaya": { icon: "palette", bgClass: "bg-orange-100", textClass: "text-orange-600" },
};

interface ActiveSessionListProps {
  sessions: ActiveSession[];
  onContinue?: (id: string) => void;
}

export function ActiveSessionList({ sessions, onContinue }: ActiveSessionListProps) {
  if (sessions.length === 0) return null;

  return (
    <section className="px-5 mb-6">
      <h2 className="text-headline-sm font-bold text-on-surface mb-3">Lanjutkan Belajar</h2>
      <div className="space-y-3">
        {sessions.map((session) => (
          <ActiveSessionCard
            key={session.id}
            session={session}
            subjectMeta={SUBJECT_META[session.subjectName] ?? SUBJECT_META.Matematika}
            onContinue={onContinue}
          />
        ))}
      </div>
    </section>
  );
}
