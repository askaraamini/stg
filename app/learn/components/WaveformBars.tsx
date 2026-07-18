"use client";

const BARS = [
  "bg-primary", "bg-ink-navy", "bg-primary", "bg-ink-navy",
  "bg-primary", "bg-ink-navy", "bg-primary", "bg-ink-navy",
  "bg-primary", "bg-ink-navy", "bg-primary", "bg-ink-navy",
  "bg-primary", "bg-ink-navy", "bg-primary",
];

export function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-12 w-full">
      {BARS.map((_, i) => (
        <div
          key={i}
          className={`w-[5px] rounded-full transition-all duration-150 ${
            active
              ? `${BARS[i]} animate-wave`
              : "bg-ink-navy/20"
          }`}
          style={active ? { animationDelay: `${((i % 8) + 1) * 0.1}s` } : { height: "6px" }}
        />
      ))}
    </div>
  );
}
