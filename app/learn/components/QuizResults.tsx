"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface Props {
  score: number;
  total: number;
  title: string;
  sessionId: string | null;
  onRetry: () => void;
  regenerating?: boolean;
  onStartExam?: () => Promise<void>;
}

export function QuizResults({ score, total, title, sessionId, onRetry, regenerating, onStartExam }: Props) {
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const colors = ["#b90538", "#fed01b", "#22C55E", "#E0F2FE"];
    const els: HTMLDivElement[] = [];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;pointer-events:none;z-index:0;width:10px;height:10px;background:${colors[Math.floor(Math.random() * colors.length)]};border-radius:2px;left:${Math.random() * 100}vw;top:-20px`;
      document.body.appendChild(el);
      els.push(el);
      const anim = el.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${Math.random() * 100 - 50}px,100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 },
        ],
        { duration: 2000 + Math.random() * 3000, easing: "cubic-bezier(0,.9,.57,1)", delay: Math.random() * 1000 }
      );
      anim.onfinish = () => el.remove();
    }
    return () => els.forEach((e) => e.remove());
  }, []);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-container-margin-mobile md:px-container-margin-desktop overflow-hidden"
      style={{ background: "linear-gradient(135deg, #E0F2FE 0%, #D1FAE5 100%)" }}
    >
      {/* Decorative shapes */}
      <div className="fixed top-20 left-20 w-16 h-16 bg-secondary-container border-4 border-ink-navy rounded-full opacity-40" />
      <div className="fixed bottom-40 left-10 w-24 h-24 bg-primary-fixed-dim border-4 border-ink-navy rotate-45 opacity-40" />
      <div className="fixed top-40 right-20 w-32 h-12 bg-tertiary-fixed border-4 border-ink-navy opacity-40 -rotate-12" />
      <div className="fixed bottom-20 right-40 w-20 h-20 bg-sky-blue-bg border-4 border-ink-navy rounded-xl opacity-40 rotate-12" />

      <main className="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl w-full">
        {/* Mascot */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-stack-md float-anim">
          <div className="absolute inset-0 bg-secondary-container rounded-full opacity-30 scale-125 blur-3xl" />
          <img
            alt="Robot mascot cheering"
            className="relative z-10 w-full h-full object-contain"
            src="/images/google/d092759c.png"
          />
          <div className="absolute -top-4 -left-4 bg-tertiary-fixed border-2 border-ink-navy p-3 rounded-lg shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] -rotate-12">
            <MaterialIcon name="star" className="text-ink-navy" filled />
          </div>
          <div className="absolute -bottom-4 -right-4 bg-success-green border-2 border-ink-navy p-3 rounded-lg shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rotate-12">
            <MaterialIcon name="bolt" className="text-white" filled />
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-stack-sm mb-stack-lg">
          <h1 className="text-display-lg-mobile md:text-display-lg text-ink-navy tracking-tight leading-tight font-black">
            Pemanasan Selesai!
          </h1>
          <p className="text-body-lg text-on-surface-variant px-gutter">
            Sekarang waktunya Ujian Sesungguhnya. <br className="hidden md:block" />
            Dapatkan nilai <span className="text-primary font-black">70</span> untuk membuka gembok!
          </p>
        </div>

        {/* CTA */}
        <div className="w-full flex flex-col items-center gap-stack-md">
          <button
            onClick={async () => {
              if (!onStartExam || starting) return;
              setStarting(true);
              try {
                await onStartExam();
              } catch {
                setStarting(false);
              }
            }}
            disabled={starting}
            className="group relative bg-primary-container hover:bg-primary text-white font-black py-6 px-12 rounded-lg border-2 border-ink-navy shadow-[0px_6px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-1 active:shadow-none flex items-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {starting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-headline-md tracking-wider">Menyiapkan Ujian...</span>
              </>
            ) : (
              <>
                <span className="text-headline-md tracking-wider">Mulai Ujian</span>
                <MaterialIcon name="arrow_forward" className="text-3xl group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
          <button
            onClick={onRetry}
            disabled={regenerating}
            className="flex items-center gap-2 bg-surface text-ink-navy font-black px-8 py-3 border-4 border-ink-navy rounded-full shadow-[6px_6px_0px_0px_rgba(15,23,43,1)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MaterialIcon name="refresh" />
            <span className="tracking-wider uppercase">{regenerating ? "Membuat Soal..." : "Coba Lagi"}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
