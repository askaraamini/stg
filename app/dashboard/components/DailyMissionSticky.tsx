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

interface DailyMissionStickyProps {
  missions: DailyMissionData[];
}

export function DailyMissionSticky({ missions }: DailyMissionStickyProps) {
  const incomplete = missions.find((m) => !m.done);

  if (!incomplete || missions.length === 0) {
    return (
      <div className="sticky bottom-0 z-40 pb-4">
        <div className="bg-success-green/10 backdrop-blur-md border border-success-green/30 rounded-2xl px-5 py-3 card-shadow flex items-center gap-3">
          <MaterialIcon name="celebration" className="text-success-green text-xl" filled />
          <p className="text-label-sm font-bold text-success-green">
            Semua misi selesai! 🎉
          </p>
        </div>
      </div>
    );
  }

  const pct = incomplete.target > 0
    ? Math.round((incomplete.current / incomplete.target) * 100)
    : 0;

  return (
    <div className="sticky bottom-0 z-40 pb-4">
      <div className="bg-white/90 backdrop-blur-md border border-outline-variant/50 rounded-2xl px-5 py-3 card-shadow flex items-center gap-3">
        <MaterialIcon
          name={incomplete.icon}
          className="text-primary text-xl"
          filled
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-label-sm font-bold truncate text-on-surface">
              {incomplete.title}
            </span>
            <span className="text-label-sm text-on-surface-variant shrink-0 ml-2">
              {incomplete.current}/{incomplete.target}
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
