import type { MissionDef, BadgeDef } from "./types";

const VALID_SUBJECTS = [
  "Matematika", "IPA (Sains)", "Bahasa Indonesia",
  "Bahasa Inggris", "IPS (Sejarah)", "Seni & Budaya",
];

export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: "today-quiz",
    title: "Belajar Hari Ini",
    description: "Selesaikan 1 exam dengan nilai minimal 80",
    xp: 10,
    icon: "today",
    type: "daily",
    check: (s) => ({ done: s.todayCompleted >= 1, current: s.todayCompleted, target: 1 }),
  },
  {
    id: "today-three",
    title: "Rajin Belajar",
    description: "Selesaikan 3 exam hari ini",
    xp: 30,
    icon: "auto_stories",
    type: "daily",
    check: (s) => ({ done: s.todayCompleted >= 3, current: s.todayCompleted, target: 3 }),
  },
  {
    id: "today-high-score",
    title: "Nilai Bagus",
    description: "Dapat nilai ≥90 hari ini",
    xp: 20,
    icon: "stars",
    type: "daily",
    check: (s) => ({
      done: (s.todayBestScore ?? 0) >= 90,
      current: s.todayBestScore ?? 0,
      target: 90,
    }),
  },
  {
    id: "today-two-subjects",
    title: "Eksplorasi",
    description: "Belajar 2 mapel berbeda hari ini",
    xp: 25,
    icon: "explore",
    type: "daily",
    check: (s) => ({
      done: Object.keys(s.subjectsCompleted).filter((k) => s.subjectsCompleted[k] > 0).length >= 2,
      current: Object.keys(s.subjectsCompleted).filter((k) => s.subjectsCompleted[k] > 0).length,
      target: 2,
    }),
  },
];

export const BADGES: BadgeDef[] = [
  {
    id: "first-exam",
    title: "Pemula",
    description: "Exam pertama selesai",
    icon: "emoji_events",
    color: "bg-amber-100",
    check: (s) => ({ unlocked: s.totalCompleted >= 1, current: s.totalCompleted, target: 1 }),
  },
  {
    id: "collector-5",
    title: "Kolektor",
    description: "5 buku di library",
    icon: "library_books",
    color: "bg-emerald-100",
    check: (s) => ({ unlocked: s.totalCompleted >= 5, current: s.totalCompleted, target: 5 }),
  },
  {
    id: "collector-20",
    title: "Kolektor Handal",
    description: "20 buku di library",
    icon: "local_library",
    color: "bg-teal-100",
    check: (s) => ({ unlocked: s.totalCompleted >= 20, current: s.totalCompleted, target: 20 }),
  },
  {
    id: "perfect-score",
    title: "Sang Juara",
    description: "Nilai 100 di exam",
    icon: "military_tech",
    color: "bg-yellow-100",
    check: (s) => ({
      unlocked: s.scores.some((sc) => sc === 100),
      current: s.scores.filter((sc) => sc === 100).length,
      target: 1,
    }),
  },
  {
    id: "all-subjects",
    title: "Petualang",
    description: "Exam pass di 6 mapel",
    icon: "public",
    color: "bg-sky-100",
    check: (s) => ({
      unlocked: VALID_SUBJECTS.every((sub) => (s.subjectsCompleted[sub] || 0) > 0),
      current: VALID_SUBJECTS.filter((sub) => (s.subjectsCompleted[sub] || 0) > 0).length,
      target: 6,
    }),
  },
  {
    id: "math-10",
    title: "Ahli Matematika",
    description: "10 Matematika lulus",
    icon: "functions",
    color: "bg-rose-100",
    check: (s) => ({
      unlocked: (s.subjectsCompleted["Matematika"] || 0) >= 10,
      current: s.subjectsCompleted["Matematika"] || 0,
      target: 10,
    }),
  },
  {
    id: "ipa-10",
    title: "Ahli IPA",
    description: "10 IPA (Sains) lulus",
    icon: "biotech",
    color: "bg-emerald-100",
    check: (s) => ({
      unlocked: (s.subjectsCompleted["IPA (Sains)"] || 0) >= 10,
      current: s.subjectsCompleted["IPA (Sains)"] || 0,
      target: 10,
    }),
  },
  {
    id: "language-master",
    title: "Ahli Bahasa",
    description: "10 B.Indonesia + 10 B.Inggris lulus",
    icon: "translate",
    color: "bg-blue-100",
    check: (s) => {
      const indo = s.subjectsCompleted["Bahasa Indonesia"] || 0;
      const inggris = s.subjectsCompleted["Bahasa Inggris"] || 0;
      const min = Math.min(indo, inggris);
      return { unlocked: min >= 10, current: min, target: 10 };
    },
  },
  {
    id: "three-in-day",
    title: "Gigih",
    description: "3 exam lulus dalam 1 hari",
    icon: "whatshot",
    color: "bg-orange-100",
    check: (s) => ({
      unlocked: s.todayCompleted >= 3 || s.totalCompleted >= 3,
      current: Math.max(s.todayCompleted, s.totalCompleted >= 3 ? 3 : 0),
      target: 3,
    }),
  },
  {
    id: "retry-pass",
    title: "Pantang Menyerah",
    description: "Retry exam gagal lalu lulus",
    icon: "replay",
    color: "bg-purple-100",
    check: (s) => ({ unlocked: s.retryPassed, current: s.retryPassed ? 1 : 0, target: 1 }),
  },
  {
    id: "streak-7",
    title: "Streak 7 Hari",
    description: "7 hari berturut-turut belajar",
    icon: "local_fire_department",
    color: "bg-red-100",
    check: (s) => ({ unlocked: s.streak >= 7, current: Math.min(s.streak, 7), target: 7 }),
  },
  {
    id: "streak-30",
    title: "Streak 30 Hari",
    description: "30 hari berturut-turut belajar",
    icon: "fireplace",
    color: "bg-red-200",
    check: (s) => ({ unlocked: s.streak >= 30, current: Math.min(s.streak, 30), target: 30 }),
  },
];
