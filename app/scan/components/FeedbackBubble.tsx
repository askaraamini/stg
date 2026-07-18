"use client";

import { cn } from "@/lib/utils";

interface FeedbackBubbleProps {
  text: string;
}

export function FeedbackBubble({ text }: FeedbackBubbleProps) {
  return (
    <div
      className={cn(
        "relative bg-white border-2 border-ink-navy rounded-2xl p-4 mb-stack-lg shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] bounce-anim max-w-[280px] text-center z-10"
      )}
    >
      <p className="font-headline-md text-headline-md text-ink-navy">{text}</p>

      {/* Speech bubble tail */}
      <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-ink-navy border-r-[10px] border-r-transparent" />
      <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-white border-r-[8px] border-r-transparent" />
    </div>
  );
}
