"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface CameraControlsProps {
  onShutter: () => void;
  shutterDisabled: boolean;
  onGallery: () => void;
}

export function CameraControls({
  onShutter,
  shutterDisabled,
  onGallery,
}: CameraControlsProps) {
  return (
    <div className="w-full bg-ink-navy/70 flex justify-between items-center px-8 pointer-events-auto pb-4 h-32">
      <button
        onClick={onGallery}
        className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center neo-border neo-shadow neo-interactive transition-all"
        aria-label="Buka galeri"
      >
        <MaterialIcon
          name="photo_library"
          className="text-ink-navy text-3xl"
        />
      </button>

      <button
        onClick={onShutter}
        disabled={shutterDisabled}
        className={`w-24 h-24 rounded-full flex items-center justify-center neo-border-thick neo-shadow-lg transition-all group ${
          shutterDisabled
            ? "opacity-40 cursor-not-allowed"
            : "neo-interactive bg-white"
        }`}
        aria-label="Ambil foto"
      >
        <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-primary-container rounded-full group-active:scale-90 transition-transform duration-100 flex items-center justify-center">
            <MaterialIcon
              name="camera"
              className="text-white text-3xl opacity-0 group-active:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </button>

      <div className="w-14 h-14" />
    </div>
  );
}
