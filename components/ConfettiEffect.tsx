"use client";

import { useEffect, useRef } from "react";

function burst() {
  const colors = ["#b90538", "#fed01b", "#22C55E", "#E0F2FE"];
  const els: HTMLDivElement[] = [];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement("div");
    el.style.cssText =
      `position:fixed;pointer-events:none;z-index:9999;width:${5 + Math.random() * 10}px;height:${5 + Math.random() * 10}px;background:${colors[Math.floor(Math.random() * colors.length)]};border-radius:${Math.random() > 0.5 ? "50%" : "2px"};left:${Math.random() * 100}vw;top:-20px`;
    document.body.appendChild(el);
    els.push(el);
    const anim = el.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${Math.random() * 100 - 50}px,100vh) rotate(${Math.random() * 720}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 2000 + Math.random() * 3000,
        easing: "cubic-bezier(0,.9,.57,1)",
        delay: Math.random() * 1000,
      }
    );
    anim.onfinish = () => el.remove();
  }
}

export function ConfettiEffect() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    burst();
    intervalRef.current = setInterval(burst, 2500);
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);
  return null;
}
