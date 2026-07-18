"use client";

import Image from "next/image";

export function MascotPulse() {
  return (
    <div className="relative z-10 mb-stack-lg pulse-anim">
      <Image
        src="/images/mascot.png"
        alt="Maskot Aksaraa"
        width={256}
        height={256}
        className="w-64 h-64 object-contain mix-blend-multiply"
        unoptimized
        priority
      />
    </div>
  );
}
