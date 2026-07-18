import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface TopAppBarProps {
  userName?: string;
  streakCount?: number;
}

export function TopAppBar({ userName = "Pelajar", streakCount = 0 }: TopAppBarProps) {
  return (
    <header className="flex items-center justify-between w-full px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MaterialIcon name="person" className="text-primary text-2xl" filled />
        </div>
        <div>
          <p className="text-label-sm text-on-surface-variant">Halo,</p>
          <h1 className="text-headline-md font-bold text-on-surface -mt-0.5">{userName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full px-3 py-1.5 border border-amber-200">
        <MaterialIcon name="local_fire_department" className="text-orange-500 text-xl" filled />
        <span className="text-label-sm font-bold text-orange-700">{streakCount} Streak</span>
      </div>
    </header>
  );
}
