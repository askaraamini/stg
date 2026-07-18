"use client";

const AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDdV3q3U_ELxvlS55Q2HIn-yZwysbJEWnvzsivd1oxCPKzN4Bbn2JPEe2Qk7djPsOMnIGt9hHftLIsfb1vxZOSkKUJrqWpqtti30q1FB9QLQBCbRX3rwiEhP5pzyJ-cCKWVkkswBeOEFIdgKsQaF9IfPvAPXwNPWS4CJmoM-LMkeawTp3nL3Gwd1rjOwg-Z5EIA_OZMaq1zNZToSyYa1oO3z0uvuW4wy1elliJnppU-UMbDk_zBu9aT-lzBKk4sysHXaA";

export function MobileTopBar() {
  return (
    <header className="flex-shrink-0 bg-surface flex justify-between items-center w-full px-container-margin py-inline-md h-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border-2 border-primary-container">
          <img
            alt="Avatar"
            className="w-full h-full object-cover"
            src={AVATAR_URL}
          />
        </div>
        <h1 className="text-headline-lg-mobile font-headline-lg-mobile font-bold text-on-surface">
          Aksaraa
        </h1>
      </div>
    </header>
  );
}
