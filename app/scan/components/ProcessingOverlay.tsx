"use client";

import { FloatingBackground } from "./FloatingBackground";
import { FeedbackBubble } from "./FeedbackBubble";
import { MascotPulse } from "./MascotPulse";
import { ProgressBar } from "./ProgressBar";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface ProcessingOverlayProps {
  progress: number;
  statusText: string;
  totalPages: number;
}

export function ProcessingOverlay({
  progress,
  statusText,
  totalPages,
}: ProcessingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 bg-sky-blue-bg min-h-screen flex flex-col font-body-md text-on-surface overflow-hidden">
      <main className="flex-grow flex flex-col items-center justify-center p-container-margin-mobile relative w-full max-w-md mx-auto">
        <FloatingBackground />

        <FeedbackBubble text={statusText} />

        <MascotPulse />

        <ProgressBar value={progress} />

        <div className="text-center max-w-[280px] z-10 mt-auto">
          <p className="font-label-lg text-label-lg text-ink-navy bg-white/50 backdrop-blur-sm p-3 border-2 border-ink-navy rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] inline-block">
            <MaterialIcon
              name="lightbulb"
              className="align-middle mr-1 text-primary"
              filled
            />
            Tips: Pastikan fotomu tidak buram agar Aksaraa bisa membacanya dengan jelas.
          </p>
        </div>
      </main>
    </div>
  );
}
