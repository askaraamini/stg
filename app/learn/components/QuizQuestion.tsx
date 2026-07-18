"use client";

import { type CSSProperties } from "react";
import DOMPurify from "dompurify";

interface Props {
  question: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  answered: boolean;
  onSelect: (index: number) => void;
  imageUrls?: string[];
  diagramIndex?: number | null;
}

export function QuizQuestion({
  question,
  options,
  selectedIndex,
  correctIndex,
  answered,
  onSelect,
  imageUrls = [],
  diagramIndex,
}: Props) {
  return (
    <div className="relative bg-secondary-container border-2 border-ink-navy rounded-lg p-gutter shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] mb-stack-lg">
      <div className="bg-surface border-2 border-ink-navy rounded-xl p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        {diagramIndex !== null && diagramIndex !== undefined && imageUrls[diagramIndex] && (
          <img
            src={imageUrls[diagramIndex]}
            alt="Diagram"
            className="max-h-64 sm:max-h-80 w-auto max-w-full rounded-lg border-2 border-ink-navy/10 object-contain mx-auto mb-4"
          />
        )}
        <h1
            className="text-sm md:text-body-md font-bold text-ink-navy text-center"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(question, {
                ALLOWED_TAGS: ["b", "i", "span", "br", "p", "sub", "sup"],
                ALLOWED_ATTR: ["style"],
              }),
            }}
          />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-sm">
        {options.map((opt, i) => {
          const isCorrectAnswer = answered && i === correctIndex;
          const isWrongSelected = answered && selectedIndex === i && i !== correctIndex;

          let bgColor: string | undefined;
          let ringClass = "";
          let afterClass = "";

          if (!answered) {
            afterClass = "bg-surface border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5";
          } else if (isCorrectAnswer) {
            bgColor = "#4ADE80";
            ringClass = "ring-4 ring-white/50";
            afterClass = "border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]";
          } else if (isWrongSelected) {
            bgColor = "#dc2c4f";
            ringClass = "ring-4 ring-white/50";
            afterClass = "border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]";
          } else {
            afterClass = "bg-surface border-2 border-ink-navy opacity-50 cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]";
          }

          const style: CSSProperties = bgColor ? { backgroundColor: bgColor } : {};

          return (
            <button
              key={i}
              onClick={() => !answered && onSelect(i)}
              disabled={answered}
              style={style}
              className={`btn-tactile group relative p-6 rounded-xl flex items-center justify-between transition-all ${afterClass} ${ringClass}`}
            >
              <span className="text-body-md font-bold text-ink-navy">{opt}</span>
              {!answered && (
                <div className="w-8 h-8 rounded-full border-2 border-ink-navy bg-white" />
              )}
              {answered && isCorrectAnswer && (
                <div className="w-10 h-10 rounded-full border-2 border-ink-navy bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <span className="material-symbols-outlined text-success-green font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
              )}
              {answered && isWrongSelected && (
                <div className="w-10 h-10 rounded-full border-2 border-ink-navy bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <span className="material-symbols-outlined text-error font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    cancel
                  </span>
                </div>
              )}
              {answered && !isCorrectAnswer && !isWrongSelected && (
                <div className="w-8 h-8 rounded-full border-2 border-ink-navy bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
