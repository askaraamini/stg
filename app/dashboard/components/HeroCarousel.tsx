"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SLIDES = [
  {
    imageUrl: "/images/google/af072146.png",
    title: "Scan Buku Baru",
    desc: "Temukan dunia baru dengan koleksi buku anak-anak yang interaktif dan menyenangkan.",
    button: "Mulai Sekarang",
  },
  {
    imageUrl: "/images/google/586b808b.png",
    title: "Belajar Bersama!",
    desc: "Selesaikan tantangan seru bersama teman-temanmu setiap hari.",
    button: "Main Sekarang",
  },
];

export function HeroCarousel() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((i: number) => setCurrent(i), []);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="flex-shrink-0">
      {/* Mobile carousel */}
      <section className="mb-8 md:hidden">
        <div className="relative rounded-3xl overflow-hidden card-shadow group cursor-pointer">
          <div className="relative h-48 sm:h-56 w-full">
            <img
              alt={slide.title}
              className="w-full h-full object-cover"
              src={slide.imageUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent flex flex-col justify-center p-6">
              <div className="w-2/3">
                <h2 className="font-display-lg text-headline-lg font-bold text-white leading-tight mb-1 drop-shadow-md">
                  {slide.title}
                </h2>
                <p className="text-[11px] font-medium text-white/90 mb-3 drop-shadow-sm leading-snug">
                  {slide.desc}
                </p>
                <button
                  onClick={() => router.push("/scan")}
                  className="bg-primary text-white rounded-full px-6 py-2 text-label-lg flex items-center gap-2 w-fit shadow-lg active:scale-95 transition-transform"
                >
                  {slide.button}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${
                  i === current ? "bg-white w-6" : "bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Desktop carousel (same auto-slide, dot pagination) */}
      <section className="hidden md:block mb-8">
        <div className="relative rounded-3xl overflow-hidden card-shadow max-w-4xl mx-auto">
          <div className="relative h-72 lg:h-80 w-full">
            <img
              alt={slide.title}
              className="w-full h-full object-cover"
              src={slide.imageUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-transparent flex flex-col justify-center p-8 lg:p-12">
              <div className="w-1/2 lg:w-2/5">
                <h2 className="text-headline-lg lg:text-display-lg text-white leading-tight mb-2 drop-shadow-md">
                  {slide.title}
                </h2>
                <p className="text-body-md text-white/90 mb-4 drop-shadow-sm leading-snug">
                  {slide.desc}
                </p>
                <button
                  onClick={() => router.push("/scan")}
                  className="bg-primary text-white rounded-full px-8 py-3 text-label-lg flex items-center gap-2 w-fit shadow-lg hover:scale-105 transition-transform"
                >
                  {slide.button}
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full shadow-sm transition-all duration-300 ${
                  i === current ? "bg-white w-8" : "bg-white/50 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
