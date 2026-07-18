"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "./DashboardLayout";
import { HeroScannerCard } from "./components/HeroScannerCard";
import { ActiveSessionList } from "./components/ActiveSessionList";
import { SubjectScoreGrid } from "./components/SubjectScoreGrid";
import type { ActiveSession, SubjectScore, SessionStatus } from "./types";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";

const SUBJECT_META: Record<string, { icon: string; bgClass: string; textClass: string }> = {
  Matematika: { icon: "functions", bgClass: "bg-rose-100", textClass: "text-primary" },
  "IPA (Sains)": { icon: "biotech", bgClass: "bg-emerald-100", textClass: "text-success-green" },
  "Bahasa Indonesia": { icon: "translate", bgClass: "bg-yellow-100", textClass: "text-secondary" },
  "Bahasa Inggris": { icon: "language", bgClass: "bg-blue-100", textClass: "text-blue-600" },
  "IPS (Sejarah)": { icon: "history_edu", bgClass: "bg-purple-100", textClass: "text-purple-600" },
  "Seni & Budaya": { icon: "palette", bgClass: "bg-orange-100", textClass: "text-orange-600" },
};

const SUBJECT_ORDER = [
  "Matematika",
  "IPA (Sains)",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "IPS (Sejarah)",
  "Seni & Budaya",
];

function computeSessionStatus(summary: any): {
  status: SessionStatus;
  progress: number;
  examScore: number | null;
} {
  const hasExam = summary?.exam && Array.isArray(summary.exam.questions);
  const examScore = summary?.exam?.score;

  if (!hasExam) {
    return { status: "pretest_done", progress: 50, examScore: null };
  }
  if (examScore === null || examScore === undefined) {
    return { status: "exam_ready", progress: 60, examScore: null };
  }
  if (examScore >= 70) {
    return { status: "exam_passed", progress: 100, examScore };
  }
  return { status: "exam_failed", progress: 80, examScore };
}

export default function DashboardPage() {
  const router = useRouter();
  const { userId, userName } = useUser();

  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const uid = userId || getDeviceId();
        const res = await fetch(`/api/sessions?userId=${uid}`);
        if (!res.ok) throw new Error("Gagal mengambil sesi");
        const { sessions } = await res.json();

        const sessionsList: ActiveSession[] = [];
        const scoreMap: Record<string, number[]> = {};
        for (const subject of SUBJECT_ORDER) scoreMap[subject] = [];

        for (const s of sessions) {
          const summary = s.summary;
          const subject = s.subject || summary?.subject || "Matematika";
          const { status, progress, examScore } = computeSessionStatus(summary);

          sessionsList.push({
            id: s.id,
            subjectName: subject,
            chapterTitle: s.title || summary?.title || "Belajar",
            progressPercentage: progress,
            startedAt: s.started_at,
            status,
          });

          if (examScore !== null && scoreMap[subject] !== undefined) {
            scoreMap[subject].push(examScore);
          }
        }

        setActiveSessions(sessionsList);

        const scores: SubjectScore[] = SUBJECT_ORDER.map((subject) => {
          const vals = scoreMap[subject];
          const meta = SUBJECT_META[subject];
          const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
          return {
            subject,
            icon: meta.icon,
            score: avg,
            bgClass: meta.bgClass,
            textClass: meta.textClass,
          };
        });

        setSubjectScores(scores);
      } catch {
        setSubjectScores(
          SUBJECT_ORDER.map((subject) => ({
            subject,
            icon: SUBJECT_META[subject].icon,
            score: null,
            bgClass: SUBJECT_META[subject].bgClass,
            textClass: SUBJECT_META[subject].textClass,
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const ongoingSessions = activeSessions.filter((s) => s.status !== "exam_passed");

  if (loading) {
    return (
      <DashboardLayout userName={userName} streakCount={0} activeTab="home">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-headline-md text-on-surface-variant animate-pulse">Memuat sesi...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={userName} streakCount={0} activeTab="home">
      <HeroScannerCard />
      <ActiveSessionList
        sessions={ongoingSessions}
        onContinue={(id) => {
          const session = activeSessions.find((s) => s.id === id);
          if (!session) return;
          if (session.status === "pretest_done") {
            router.push(`/learn?id=${id}`);
          } else if (session.status === "exam_ready" || session.status === "exam_failed") {
            router.push(`/exam?id=${id}`);
          }
        }}
      />
      <SubjectScoreGrid scores={subjectScores} />
    </DashboardLayout>
  );
}
