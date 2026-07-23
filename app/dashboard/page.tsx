"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "./DashboardLayout";
import { HeroCarousel } from "./components/HeroCarousel";
import { ContinueLearning } from "./components/ContinueLearning";
import { SubjectScoreList } from "./components/SubjectScoreList";
import { DailyMissionBanner } from "./components/DailyMissionBanner";
import { DAILY_MISSIONS } from "@/app/misi/mission-data";
import type { ActiveSession, SessionStatus } from "./types";
import type { UserStats } from "@/lib/misi-stats";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";

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

function computeSubjectScores(sessions: any[]): { subject: string; score: number | null }[] {
  const scoreMap: Record<string, number[]> = {};
  for (const subject of SUBJECT_ORDER) scoreMap[subject] = [];

  for (const s of sessions) {
    const summary = typeof s.summary === "string" ? (() => { try { return JSON.parse(s.summary); } catch { return null; } })() : s.summary;
    if (!summary?.exam?.score) continue;
    const subject = s.subject || summary?.subject || "Matematika";
    if (scoreMap[subject]) {
      scoreMap[subject].push(summary.exam.score);
    }
  }

  return SUBJECT_ORDER.map((subject) => {
    const vals = scoreMap[subject];
    return {
      subject,
      score: vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
    };
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { userId } = useUser();

  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [subjectScores, setSubjectScores] = useState<{ subject: string; score: number | null }[]>([]);
  const [dailyMissions, setDailyMissions] = useState<{ id: string; title: string; icon: string; done: boolean; current: number; target: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const uid = userId || getDeviceId();
        if (!uid) { setLoading(false); return; }

        const [sessionsRes, statsRes] = await Promise.all([
          fetch(`/api/sessions?userId=${uid}`),
          fetch(`/api/misi/stats?userId=${uid}`),
        ]);

        const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };
        const stats: UserStats | null = statsRes.ok ? await statsRes.json() : null;

        const sessions = sessionsData.sessions || [];

        const sessionsList: ActiveSession[] = [];
        for (const s of sessions) {
          const summary = typeof s.summary === "string"
            ? (() => { try { return JSON.parse(s.summary); } catch { return null; } })()
            : s.summary;
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
        }

        setActiveSessions(sessionsList);
        setSubjectScores(computeSubjectScores(sessions));

        if (stats) {
          setDailyMissions(
            DAILY_MISSIONS.map((m) => {
              const result = m.check(stats);
              return {
                id: m.id,
                title: m.title,
                icon: m.icon,
                done: result.done,
                current: result.current,
                target: result.target,
              };
            })
          );
        }
      } catch {
        // silent fallback
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const ongoingSessions = activeSessions.filter((s) => s.status !== "exam_passed" && s.status !== "exam_failed");

  const handleContinue = (id: string) => {
    if (id === "new") { router.push("/scan"); return; }
    const session = activeSessions.find((s) => s.id === id);
    if (!session) return;
    if (session.status === "pretest_done") {
      router.push(`/learn?id=${id}`);
    } else if (session.status === "exam_ready" || session.status === "exam_failed") {
      router.push(`/exam?id=${id}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="home">
        <div className="flex flex-col items-center justify-center py-16 gap-4 min-h-screen">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md text-on-surface-variant animate-pulse">Memuat...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="home">
      <HeroCarousel />
      <ContinueLearning sessions={ongoingSessions} onContinue={handleContinue} />
      <SubjectScoreList scores={subjectScores}>
        <DailyMissionBanner missions={dailyMissions} />
      </SubjectScoreList>
    </DashboardLayout>
  );
}
