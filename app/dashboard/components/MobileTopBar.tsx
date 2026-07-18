"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

const AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDdV3q3U_ELxvlS55Q2HIn-yZwysbJEWnvzsivd1oxCPKzN4Bbn2JPEe2Qk7djPsOMnIGt9hHftLIsfb1vxZOSkKUJrqWpqtti30q1FB9QLQBCbRX3rwiEhP5pzyJ-cCKWVkkswBeOEFIdgKsQaF9IfPvAPXwNPWS4CJmoM-LMkeawTp3nL3Gwd1rjOwg-Z5EIA_OZMaq1zNZToSyYa1oO3z0uvuW4wy1elliJnppU-UMbDk_zBu9aT-lzBKk4sysHXaA";

interface MobileTopBarProps {
  xp?: number;
}

export function MobileTopBar({ xp = 0 }: MobileTopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface flex justify-between items-center w-full px-5 py-3 h-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border-2 border-primary-container">
          <img
            alt="Avatar"
            className="w-full h-full object-cover"
            src={AVATAR_URL}
          />
        </div>
        <h1 className="text-headline-lg-mobile font-bold text-on-surface">
          Aksaraa
        </h1>
      </div>
      <div className="flex items-center gap-2 bg-surface-container-highest rounded-full px-3 py-1.5">
        <MaterialIcon name="stars" className="text-primary text-lg" filled />
        <span className="text-label-sm font-bold text-primary">{xp.toLocaleString()} XP</span>
      </div>
    </header>
  );
}
