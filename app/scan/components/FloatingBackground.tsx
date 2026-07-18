"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function FloatingBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      <MaterialIcon
        name="calculate"
        className="text-4xl text-primary opacity-20 absolute top-20 left-10 float-anim"
        filled
      />
      <MaterialIcon
        name="science"
        className="text-5xl text-secondary-container opacity-30 absolute top-40 right-10 float-anim-delay"
        filled
      />
      <MaterialIcon
        name="functions"
        className="text-3xl text-success-green opacity-20 absolute bottom-40 left-16 float-anim-delay"
        filled
      />
      <MaterialIcon
        name="emoji_objects"
        className="text-4xl text-ink-navy opacity-10 absolute bottom-32 right-20 float-anim"
        filled
      />
    </div>
  );
}
