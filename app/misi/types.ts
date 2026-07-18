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

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: string;
  type: "daily" | "achievement";
  check: (stats: UserStats) => { done: boolean; current: number; target: number };
}

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  check: (stats: UserStats) => { unlocked: boolean; current: number; target: number };
}
