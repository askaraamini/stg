"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface ThumbnailTrayProps {
  images: string[];
  onDelete: (index: number) => void;
  onAdd: () => void;
  disabled: boolean;
}

export function ThumbnailTray({
  images,
  onDelete,
  onAdd,
  disabled,
}: ThumbnailTrayProps) {
  return (
    <div className="flex items-center gap-4 px-container-margin-mobile overflow-x-auto py-2">
      {images.map((src, idx) => (
        <div
          key={idx}
          className="relative w-20 h-24 rounded-xl neo-border overflow-hidden flex-shrink-0"
        >
          <img
            src={src}
            alt={`Halaman ${idx + 1}`}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onDelete(idx)}
            className="absolute top-1 right-1 w-6 h-6 bg-error rounded-full flex items-center justify-center neo-border shadow-sm"
            aria-label={`Hapus halaman ${idx + 1}`}
          >
            <MaterialIcon
              name="close"
              className="text-white text-sm font-bold"
            />
          </button>
        </div>
      ))}

      {!disabled && (
        <button
          onClick={onAdd}
          className="w-20 h-24 rounded-xl border-4 border-dashed border-soft-mint-green flex items-center justify-center bg-white/10 flex-shrink-0"
          aria-label="Tambah halaman"
        >
          <MaterialIcon name="add" className="text-soft-mint-green text-3xl" />
        </button>
      )}
    </div>
  );
}
