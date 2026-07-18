"use client";

interface Props {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="mb-stack-md">
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-headline-md font-headline-md text-ink-navy">
          Soal {current} dari {total}
        </h2>
        <span className="text-label-lg text-primary-container font-black">{pct}% Selesai</span>
      </div>
      <div className="w-full h-6 bg-yellow-200 rounded-full border-2 border-ink-navy overflow-hidden shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
        <div
          className="h-full bg-primary-container rounded-full border-r-2 border-ink-navy transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
