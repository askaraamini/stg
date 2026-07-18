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
  return (
    <section className="mb-8">
      <div className="bg-primary p-5 rounded-3xl text-white card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <MaterialIcon name="stars" className="text-secondary-container text-xl" filled />
          <h3 className="text-headline-md font-bold">Misi Harian</h3>
        </div>

        <div className="space-y-3">
          {missions.map((m) => {
            const pct = m.target > 0 ? Math.round((m.current / m.target) * 100) : 0;
            return (
              <div key={m.id} className="flex items-center gap-3">
                <MaterialIcon
                  name={m.icon}
                  className={`text-lg ${m.done ? "text-secondary-container" : "text-white/60"}`}
                  filled={m.done}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-label-sm font-bold truncate">{m.title}</span>
                    <span className="text-label-sm text-white/70 shrink-0 ml-2">
                      {m.done ? m.target : m.current}/{m.target}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.done ? "bg-secondary-container" : "bg-white/50"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {missions.length === 0 && (
          <p className="text-body-md text-white/70 text-center py-2">
            Semua misi hari ini selesai! 🎉
          </p>
        )}
      </div>
    </section>
  );
}
