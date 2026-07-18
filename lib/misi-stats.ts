export interface UserStats {
  totalCompleted: number;
  totalAttempted: number;
  todayCompleted: number;
  todayAttempted: number;
  todayBestScore: number | null;
  subjectsCompleted: Record<string, number>;
  subjectsAttempted: Record<string, number>;
  bestScore: number;
  streak: number;
  totalXp: number;
  level: number;
  levelXp: number;
  nextLevelXp: number;
  retryPassed: boolean;
  scores: number[];
}

export function safeParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function computeStreak(dates: Set<string>, todayStr: string): number {
  const sorted = Array.from(dates).sort().reverse();
  if (sorted.length === 0) return 0;

  const today = new Date(todayStr + "T00:00:00");
  let count = 0;

  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);

    if (sorted.includes(expectedStr)) {
      count++;
    } else if (i === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (sorted.includes(yesterdayStr)) {
        continue;
      }
      return 0;
    } else {
      break;
    }
  }
  return count;
}

export function computeStats(sessions: any[]): UserStats {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let totalCompleted = 0;
  let totalAttempted = 0;
  let todayCompleted = 0;
  let todayAttempted = 0;
  let todayBestScore: number | null = null;
  let bestScore = 0;
  const subjectsCompleted: Record<string, number> = {};
  const subjectsAttempted: Record<string, number> = {};
  const scores: number[] = [];
  const completionDates: Set<string> = new Set();
  let retryPassed = false;
  const seenRetry: Record<string, number> = {};

  for (const s of sessions) {
    const summary = typeof s.summary === "string" ? safeParse(s.summary) : s.summary;
    if (!summary) continue;
    const exam = summary.exam;
    if (!exam || !Array.isArray(exam.questions)) continue;

    const subject = s.subject || summary.subject || "Matematika";
    const dateStr = exam.completed_at
      ? exam.completed_at.slice(0, 10)
      : s.started_at?.slice(0, 10);

    totalAttempted++;
    subjectsAttempted[subject] = (subjectsAttempted[subject] || 0) + 1;

    if (dateStr === todayStr) {
      todayAttempted++;
    }

    if (typeof exam.score === "number") {
      const score = exam.score * 10;
      scores.push(score);
      if (score > bestScore) bestScore = score;
      if (dateStr === todayStr && score > (todayBestScore ?? 0)) {
        todayBestScore = score;
      }
      if (score >= 70) {
        totalCompleted++;
        subjectsCompleted[subject] = (subjectsCompleted[subject] || 0) + 1;
        if (dateStr) completionDates.add(dateStr);
        if (dateStr === todayStr) todayCompleted++;

        const sid = s.id;
        if (seenRetry[sid] !== undefined) {
          if (seenRetry[sid] < 70 && score >= 70) {
            retryPassed = true;
          }
        } else {
          seenRetry[sid] = score;
        }
      } else {
        const sid = s.id;
        if (seenRetry[sid] === undefined) {
          seenRetry[sid] = score;
        }
      }
    }
  }

  const streak = computeStreak(completionDates, todayStr);
  const totalXp =
    totalCompleted * 50 +
    totalAttempted * 20 +
    streak * 10;
  const level = Math.max(1, Math.floor(totalXp / 100) + 1);
  const nextLevelXp = level * 100;
  const levelXp = totalXp - (level - 1) * 100;

  return {
    totalCompleted,
    totalAttempted,
    todayCompleted,
    todayAttempted,
    todayBestScore,
    subjectsCompleted,
    subjectsAttempted,
    bestScore,
    streak,
    totalXp,
    level,
    levelXp,
    nextLevelXp,
    retryPassed,
    scores,
  };
}
