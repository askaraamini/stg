"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function ViewfinderOverlay() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden">
      <div className="absolute top-8 z-30">
        <div className="bg-secondary-container text-on-secondary-container px-6 py-2 rounded-full neo-border neo-shadow font-label-lg font-bold flex items-center gap-2 animate-bounce">
          <MaterialIcon name="center_focus_strong" className="text-sm" />
          <span>Posisikan teks di dalam kotak ini</span>
        </div>
      </div>

      <div className="relative w-4/5 max-w-sm aspect-[3/4] rounded-2xl viewfinder-cutout border-2 border-white/20 z-20">
        <div className="corner-bracket corner-tl" />
        <div className="corner-bracket corner-tr" />
        <div className="corner-bracket corner-bl" />
        <div className="corner-bracket corner-br" />
        <div className="absolute top-0 left-0 w-full h-1 bg-soft-mint-green/50 shadow-[0_0_10px_#a7f3d0] animate-[scan_2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
