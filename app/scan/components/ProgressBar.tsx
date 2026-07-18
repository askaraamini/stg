"use client";

interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.max(1, Math.min(100, value));

  return (
    <div className="w-full max-w-[280px] bg-white border-2 border-ink-navy rounded-full h-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-1 relative z-10 overflow-hidden mb-stack-lg">
      <div
        className="bg-success-green h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
