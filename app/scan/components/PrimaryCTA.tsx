"use client";

import { cn } from "@/lib/utils";

interface PrimaryCTAProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function PrimaryCTA({
  onClick,
  disabled,
  children,
}: PrimaryCTAProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full bg-primary-container text-white py-4 rounded-2xl neo-border-thick neo-shadow font-headline-md transition-all flex items-center justify-center gap-2",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "neo-interactive"
      )}
    >
      {children}
    </button>
  );
}
