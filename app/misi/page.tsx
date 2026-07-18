"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { BottomNavigation } from "@/app/dashboard/components/BottomNavigation";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";
import { DAILY_MISSIONS, BADGES } from "./mission-data";
import type { UserStats } from "./types";

const LEVEL_COLORS = [
  "from-amber-300 to-yellow-400", "from-yellow-300 to-lime-400", "from-lime-300 to-emerald-400",
  "from-emerald-300 to-teal-400", "from-teal-300 to-cyan-400", "from-cyan-300 to-sky-400",
  "from-sky-300 to-blue-400", "from-blue-300 to-indigo-400", "from-indigo-300 to-violet-400",
  "from-violet-300 to-purple-400", "from-purple-300 to-fuchsia-400", "from-fuchsia-300 to-pink-400",
  "from-pink-300 to-rose-400", "from-rose-300 to-orange-400", "from-orange-300 to-amber-400",
];

const LEVEL_BG = [
  "bg-amber-100", "bg-yellow-100", "bg-lime-100", "bg-emerald-100",
  "bg-teal-100", "bg-cyan-100", "bg-sky-100", "bg-blue-100",
  "bg-indigo-100", "bg-violet-100", "bg-purple-100", "bg-fuchsia-100",
  "bg-pink-100", "bg-rose-100", "bg-orange-100",
];

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 6.5L20 9l-5 4.5 1.5 7L12 15l-5.5 5.5L8 13.5 3 9l6.5-.5z" />
    </svg>
  );
}

export default function MisiPage() {
  const router = useRouter();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const uid = userId || getDeviceId();
        const param = userId ? `userId=${uid}` : `deviceId=${uid}`;
        const res = await fetch(`/api/misi/stats?${param}`);
        if (!res.ok) throw new Error("Gagal mengambil data");
        const data = await res.json();
        setStats(data as UserStats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const levelColor = LEVEL_COLORS[((stats?.level ?? 1) - 1) % LEVEL_COLORS.length];
  const levelBg = LEVEL_BG[((stats?.level ?? 1) - 1) % LEVEL_BG.length];
  const xpPercent = stats ? Math.round((stats.levelXp / stats.nextLevelXp) * 100) : 0;

  const dailyMissions = useMemo(
    () => DAILY_MISSIONS.map((m) => ({ ...m, progress: stats ? m.check(stats) : null })),
    [stats]
  );

  const badges = useMemo(
    () => BADGES.map((b) => ({ ...b, progress: stats ? b.check(stats) : null })),
    [stats]
  );

  const dailyDone = dailyMissions.filter((m) => m.progress?.done).length;
  const dailyTotal = dailyMissions.length;

  const allDailyDone = dailyDone === dailyTotal;

  const speechText = useCallback(() => {
    if (!stats) return "Ayo mulai belajar, semangat! 🚀";
    if (stats.totalCompleted === 0) return "Scan buku pertamamu sekarang! 📚";
    if (allDailyDone) return "Misi hari ini selesai semua! Keren! 🎉";
    return `Kamu sudah dapat ${stats.totalXp} XP! Teruskan! ⚡`;
  }, [stats, allDailyDone]);

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-sky-100 via-blue-50 to-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-24 h-24 float-anim">
            <Image
              src="/images/mascot.png"
              alt="Maskot"
              fill
              className="object-contain drop-shadow-xl"
              unoptimized
            />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-headline-md text-on-surface-variant font-bold animate-pulse">
              Memuat misi...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-b from-sky-100 via-blue-50 to-white min-h-screen flex items-center justify-center">
        <div className="bg-white border-[4px] border-ink-navy rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-8 max-w-sm mx-4 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <Image
              src="/images/wrong.png"
              alt="Error"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <p className="text-headline-md text-ink-navy mb-4 font-bold">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="bg-secondary-container border-[3px] border-ink-navy rounded-xl py-3 px-8 font-headline-md font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all hover:brightness-95"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-sky-100 via-blue-50 to-white h-screen overflow-y-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-container-margin-mobile h-16 bg-white/90 backdrop-blur-md border-b-[3px] border-ink-navy shadow-[0_4px_0px_0px_rgba(15,23,42,1)] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-white border-[2px] border-ink-navy p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all"
          >
            <MaterialIcon name="arrow_back" className="text-primary" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-md font-black text-ink-navy">Misi Saya</h1>
            <SparkleIcon className="w-5 h-5 text-secondary" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 border-[2px] border-ink-navy rounded-full px-3 py-1 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <MaterialIcon name="local_fire_department" className="text-error text-lg" filled />
            <span className="font-label-sm font-black text-ink-navy">{stats?.streak ?? 0}</span>
          </div>
          <div className="bg-primary-container border-[2px] border-ink-navy rounded-full px-3 py-1 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <MaterialIcon name="bolt" className="text-primary text-lg" filled />
            <span className="font-label-sm font-black text-ink-navy">{stats?.totalXp ?? 0}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-container-margin-mobile py-6 max-w-2xl mx-auto w-full pb-32">
        {/* Hero Level Card with Mascots */}
        <section className="relative bg-white border-[4px] border-ink-navy rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-6 mb-6 overflow-hidden">
          {/* Decorative dots */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
            <div className="grid grid-cols-6 gap-2 p-4">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-ink-navy rounded-full" />
              ))}
            </div>
          </div>

          {/* Mascot Interaction Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="relative w-16 h-16 md:w-20 md:h-20 float-anim">
              <Image
                src="/images/mascot.png"
                alt="Maskot"
                fill
                className="object-contain drop-shadow-lg"
                unoptimized
              />
            </div>
            <div className="relative bg-secondary-container border-[2px] border-ink-navy px-5 py-3 rounded-2xl mx-3 flex-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-ink-navy" />
              <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-secondary-container" />
              <p className="font-body-md text-body-md font-bold text-ink-navy">
                {speechText()}
              </p>
            </div>
            <div className="relative w-16 h-16 md:w-20 md:h-20 float-anim-delay">
              <Image
                src="/images/friend.png"
                alt="Teman"
                fill
                className="object-contain drop-shadow-lg"
                unoptimized
              />
            </div>
          </div>

          {/* Level Info */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${levelColor} border-[3px] border-ink-navy rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] shrink-0`}>
              <span className="text-2xl font-black text-ink-navy">{stats?.level ?? 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-headline-md font-black text-ink-navy">Level {stats?.level ?? 1}</span>
                <span className="font-label-sm font-bold text-on-surface-variant bg-surface-container/80 px-2 py-0.5 rounded-full border border-ink-navy/30">
                  {stats?.levelXp ?? 0} / {stats?.nextLevelXp ?? 100} XP
                </span>
              </div>
              <div className="relative w-full h-5 bg-surface-container border-[2px] border-ink-navy rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full bg-gradient-to-r ${levelColor} rounded-full transition-all duration-700 ease-out relative`}
                  style={{ width: `${xpPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                </div>
                <span className="absolute inset-0 flex items-center justify-center text-label-sm font-black text-ink-navy drop-shadow-sm">
                  {xpPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-1 sm:gap-4 mt-4 pt-4 border-t-2 border-ink-navy/10">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-ink-navy/40">
              <MaterialIcon name="emoji_events" className="text-amber-500 text-lg" filled />
              <span className="font-label-sm font-bold text-ink-navy">{stats?.totalCompleted ?? 0} Selesai</span>
            </div>
            <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-ink-navy/40">
              <MaterialIcon name="local_fire_department" className="text-rose-500 text-lg" filled />
              <span className="font-label-sm font-bold text-ink-navy">{stats?.streak ?? 0} Hari</span>
            </div>
            <div className="flex items-center gap-1 bg-violet-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-ink-navy/40">
              <MaterialIcon name="stars" className="text-violet-500 text-lg" filled />
              <span className="font-label-sm font-bold text-ink-navy">{stats?.bestScore ?? 0} Tertinggi</span>
            </div>
          </div>
        </section>

        {(!stats || stats.totalAttempted === 0) ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative w-36 h-36 mb-6 float-anim">
              <Image
                src="/images/mascot.png"
                alt="Maskot"
                fill
                className="object-contain drop-shadow-xl"
                unoptimized
              />
            </div>
            <div className="bg-white border-[4px] border-ink-navy rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-8 max-w-sm w-full">
              <h2 className="font-headline-md text-headline-md text-ink-navy font-black mb-3">
                Ayo mulai belajar!
              </h2>
              <p className="font-body-md text-on-surface-variant mb-6">
                Scan buku dan selesaikan exam untuk membuka misi dan badge keren!
              </p>
              <button
                onClick={() => router.push("/scan")}
                className="w-full bg-primary text-on-primary border-[3px] border-ink-navy rounded-xl py-3 font-headline-md font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all hover:brightness-95 flex items-center justify-center gap-2"
              >
                <MaterialIcon name="scan" className="text-lg" />
                Scan Buku Sekarang
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Daily Missions */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-amber-300 to-yellow-400 border-[2px] border-ink-navy rounded-xl p-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    <MaterialIcon name="wb_sunny" className="text-ink-navy text-lg" filled />
                  </div>
                  <h2 className="font-headline-md font-black text-ink-navy">Misi Harian</h2>
                </div>
                <div className={`border-[2px] border-ink-navy rounded-full px-3 py-1 font-label-sm font-bold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                  allDailyDone ? "bg-success-green text-white" : "bg-amber-100"
                }`}>
                  {dailyDone}/{dailyTotal}
                </div>
              </div>

              <div className="space-y-3">
                {dailyMissions.map((mission) => {
                  const done = mission.progress?.done ?? false;
                  const current = mission.progress?.current ?? 0;
                  const target = mission.progress?.target ?? 1;
                  const ratio = Math.min(current / target, 1);

                  return (
                    <div
                      key={mission.id}
                      className={`relative bg-white border-[3px] border-ink-navy rounded-2xl shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] p-4 transition-all ${
                        done ? "opacity-80" : "hover:translate-x-0.5 hover:translate-y-0.5"
                      }`}
                    >
                      {done && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-success-green border-[2px] border-ink-navy rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                          <MaterialIcon name="check" className="text-white text-sm" filled />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl border-[2px] border-ink-navy flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                            done
                              ? "bg-gradient-to-br from-success-green to-emerald-400"
                              : "bg-gradient-to-br from-amber-100 to-yellow-200"
                          }`}
                        >
                          {done ? (
                            <MaterialIcon name="check" className="text-white text-lg" filled />
                          ) : (
                            <MaterialIcon name={mission.icon} className="text-ink-navy text-lg" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={`font-headline-md font-black text-ink-navy truncate ${
                              done ? "line-through decoration-2 decoration-success-green" : ""
                            }`}>
                              {mission.title}
                            </h3>
                            <span className="bg-gradient-to-r from-amber-200 to-yellow-300 border-[2px] border-ink-navy rounded-full px-2.5 py-0.5 text-label-sm font-black whitespace-nowrap shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                              +{mission.xp} XP
                            </span>
                          </div>
                          <p className="font-body-md text-sm text-on-surface-variant mb-2">
                            {done ? "✅ Selesai!" : mission.description}
                          </p>
                          {!done && (
                            <div className="relative w-full h-4 bg-surface-container border-[2px] border-ink-navy rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500"
                                style={{ width: `${ratio * 100}%` }}
                              >
                                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                              </div>
                              <span className="absolute inset-0 flex items-center justify-center text-label-xs font-bold text-ink-navy">
                                {current}/{target}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Achievements / Badges */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-violet-300 to-purple-400 border-[2px] border-ink-navy rounded-xl p-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    <MaterialIcon name="emoji_events" className="text-ink-navy text-lg" filled />
                  </div>
                  <h2 className="font-headline-md font-black text-ink-navy">Prestasi</h2>
                </div>
                <span className="font-label-sm font-bold text-on-surface-variant bg-surface-container/80 px-2.5 py-1 rounded-full border border-ink-navy/30">
                  {badges.filter((b) => b.progress?.unlocked).length}/{BADGES.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((badge) => {
                  const unlocked = badge.progress?.unlocked ?? false;
                  const current = badge.progress?.current ?? 0;
                  const target = badge.progress?.target ?? 1;
                  const inProgress = !unlocked && current > 0;
                  const badgeRatio = Math.min(current / target, 1);

                  return (
                    <div
                      key={badge.id}
                      className={`relative bg-white border-[3px] border-ink-navy rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4 flex flex-col items-center gap-2 text-center transition-all ${
                        unlocked
                          ? "hover:translate-x-0.5 hover:translate-y-0.5"
                          : inProgress
                          ? ""
                          : "opacity-55 grayscale-[30%]"
                      }`}
                    >
                      {unlocked && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-success-green border-[2px] border-ink-navy rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                          <MaterialIcon name="check" className="text-white text-xs" filled />
                        </div>
                      )}
                      <div
                        className={`w-14 h-14 ${badge.color} border-[3px] border-ink-navy rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] ${
                          unlocked ? "" : "grayscale"
                        }`}
                      >
                        <MaterialIcon
                          name={badge.icon}
                          className={`text-3xl ${unlocked ? "text-ink-navy" : "text-gray-400"}`}
                          filled={unlocked}
                        />
                      </div>
                      <span className="font-label-sm font-black text-ink-navy leading-tight">
                        {badge.title}
                      </span>

                      {unlocked ? (
                        <span className="text-label-sm font-bold text-success-green flex items-center gap-1">
                          <MaterialIcon name="check_circle" className="text-sm" filled />
                          Terbuka
                        </span>
                      ) : inProgress ? (
                        <div className="w-full">
                          <div className="relative w-full h-3 bg-surface-container border-[2px] border-ink-navy rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-violet-300 to-purple-400 rounded-full transition-all duration-500"
                              style={{ width: `${badgeRatio * 100}%` }}
                            />
                          </div>
                          <span className="text-label-xs font-bold text-on-surface-variant mt-1">
                            {current}/{target}
                          </span>
                        </div>
                      ) : (
                        <span className="text-label-sm text-gray-400 flex items-center gap-1">
                          <MaterialIcon name="lock" className="text-sm" />
                          Terkunci
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNavigation activeTab="missions" />
    </div>
  );
}
