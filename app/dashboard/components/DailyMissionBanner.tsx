"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface DailyMissionData {
  id: string;
  title: string;
  icon: string;
  done: boolean;
  current: number;
  target: number;
}

interface DailyMissionBannerProps {
  missions: DailyMissionData[];
}

export function DailyMissionBanner({ missions }: DailyMissionBannerProps) {
  const incomplete = missions.find((m) => !m.done);

  if (!incomplete || missions.length === 0) {
    return (
      <section className="mb-8">
        <div className="bg-primary p-4 md:p-6 rounded-3xl text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-label-sm font-label-sm uppercase tracking-widest opacity-80 mb-1">Misi Hari Ini</p>
            <h3 className="text-headline-md font-headline-md mb-1">Semua Selesai! 🎉</h3>
            <p className="text-label-sm text-white/70">Kembali besok untuk misi baru</p>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center relative z-10">
            <MaterialIcon name="celebration" className="text-4xl text-white" filled />
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-container rounded-full opacity-50 blur-3xl" />
        </div>
      </section>
    );
  }

  const pct = incomplete.target > 0
    ? Math.round((incomplete.current / incomplete.target) * 100)
    : 0;

  return (
    <section className="mb-8">
      <div className="bg-primary p-4 md:p-6 rounded-3xl text-white flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-label-sm font-label-sm uppercase tracking-widest opacity-80 mb-1">Misi Hari Ini</p>
          <h3 className="text-headline-md font-headline-md mb-3">{incomplete.title}</h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 md:w-48 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary-container rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-label-sm font-label-sm">
              {incomplete.current}/{incomplete.target}
            </span>
          </div>
        </div>
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center relative z-10">
          <MaterialIcon
            name={incomplete.icon}
            className="text-4xl text-white"
            filled
          />
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-container rounded-full opacity-50 blur-3xl" />
      </div>
    </section>
  );
}
