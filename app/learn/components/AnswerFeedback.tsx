"use client";

import DOMPurify from "dompurify";

interface Props {
  isCorrect: boolean;
  explanationHtml: string;
  onNext: () => void;
  onPrev?: () => void;
  isLast: boolean;
  isFirst: boolean;
}

export function AnswerFeedback({
  isCorrect,
  explanationHtml,
  onNext,
  onPrev,
  isLast,
  isFirst,
}: Props) {
  const sanitized = DOMPurify.sanitize(explanationHtml, {
    ALLOWED_TAGS: ["b", "i", "span", "br", "p", "ul", "li", "img"],
    ALLOWED_ATTR: ["style", "class", "src", "alt"],
  });

  return (
    <div className="flex flex-col md:flex-row items-start gap-4 mt-8">
      {/* Mascot */}
      <div className="w-[100px] md:w-1/5 flex-shrink-0 flex justify-center md:justify-end float-anim">
        <img
          alt={isCorrect ? "Aksaraa Mascot" : "Aksaraa Wrong"}
          className="w-full max-w-[120px] md:max-w-[180px] object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]"
          src={isCorrect ? "/images/mascot.png" : "/images/wrong.png"}
        />
      </div>

      {/* Speech Bubble */}
      <div className="w-full md:w-4/5">
        <div className="relative speech-bubble-border">
          <div className="speech-bubble bg-white border-2 border-ink-navy p-gutter rounded-xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            {/* Title + Buttons — mobile: stacked buttons > title; desktop: side-by-side */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-2 self-start flex-shrink-0 md:order-2">
                {!isFirst && onPrev && (
                  <button
                    onClick={onPrev}
                    className="btn-tactile bg-surface text-ink-navy px-3 py-2 md:px-4 md:py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-label-lg md:text-headline-md font-black flex items-center gap-1 active:translate-y-1 active:shadow-none transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    <span className="hidden md:inline">Sebelumnya</span>
                  </button>
                )}
                <button
                  onClick={onNext}
                  className="btn-tactile bg-primary-container text-on-primary-container px-4 py-2 md:px-6 md:py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-label-lg md:text-headline-md font-black flex items-center gap-2 active:translate-y-1 active:shadow-none transition-all"
                >
                  Lanjut
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <h3
                className={`text-body-lg md:text-headline-md font-black md:order-1 ${
                  isCorrect ? "text-success-green" : "text-error"
                }`}
              >
                {isCorrect ? "Benar sekali!" : "Belum tepat, yuk pelajari lagi"}
              </h3>
            </div>

            {/* Rich HTML Explanation */}
            <div
              className="text-body-lg text-ink-navy leading-relaxed [&_b]:font-bold [&_i]:italic [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 max-h-[calc(100vh-420px)] overflow-y-auto mt-3 md:mt-4"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
