import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { ActiveSession, SessionStatus } from "../types";

const STATUS_LABEL: Record<SessionStatus, string> = {
  pretest_not_started: "Pretest",
  pretest_done: "Pretest Selesai",
  exam_ready: "Exam Siap",
  exam_failed: "Exam Gagal",
  exam_passed: "Exam Lulus",
};

interface ActiveSessionCardProps {
  session: ActiveSession;
  subjectMeta: { icon: string; bgClass: string; textClass: string };
  onContinue?: (id: string) => void;
}

export function ActiveSessionCard({
  session,
  subjectMeta,
  onContinue,
}: ActiveSessionCardProps) {
  const isDone = session.status === "exam_passed";

  return (
    <div
      className={`bg-surface rounded-2xl p-4 card-shadow border border-surface-variant/30 flex items-center gap-4 ${
        isDone ? "opacity-60" : ""
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${subjectMeta.bgClass} flex items-center justify-center shrink-0`}
      >
        <MaterialIcon
          name={subjectMeta.icon}
          className={`text-2xl ${subjectMeta.textClass}`}
          filled
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-body-md font-bold text-on-surface truncate">
          {session.chapterTitle}
        </h3>
        <p className="text-label-sm text-on-surface-variant">{session.subjectName}</p>
        <div className="mt-2 h-1.5 w-full bg-surface-variant/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${session.progressPercentage}%` }}
          />
        </div>
      </div>
      {!isDone && onContinue && (
        <button
          onClick={() => onContinue(session.id)}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 active:scale-90 transition-transform"
        >
          <MaterialIcon name="arrow_forward" className="text-white text-lg" filled />
        </button>
      )}
      {isDone && (
        <div className="w-9 h-9 rounded-full bg-success-green/10 flex items-center justify-center shrink-0">
          <MaterialIcon name="check_circle" className="text-success-green text-lg" filled />
        </div>
      )}
    </div>
  );
}
