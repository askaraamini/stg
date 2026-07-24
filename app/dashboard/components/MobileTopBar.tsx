"use client";

const AVATAR_URL = "/images/google/a162a15e.png";

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
