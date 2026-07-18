export type SessionStatus = "pretest_not_started" | "pretest_done" | "exam_ready" | "exam_failed" | "exam_passed";

export interface ActiveSession {
  id: string;
  subjectName: string;
  chapterTitle: string;
  progressPercentage: number;
  startedAt: string;
  status: SessionStatus;
}

export interface SubjectScore {
  subject: string;
  icon: string;
  score: number | null;
  bgClass: string;
  textClass: string;
}
