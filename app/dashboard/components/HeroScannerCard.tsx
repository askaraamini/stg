"use client";

import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function HeroScannerCard() {
  const router = useRouter();

  return (
    <section className="px-5 mb-6">
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 card-shadow relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <MaterialIcon name="qr_code_scanner" className="text-white text-3xl" filled />
          </div>
          <div className="flex-1">
            <h2 className="text-headline-md font-bold text-white mb-1">Scan Bukumu!</h2>
            <p className="text-body-md text-white/80">Mulai belajar dengan scan buku pelajaran</p>
          </div>
          <button
            onClick={() => router.push("/scan")}
            className="bg-white text-primary rounded-full px-5 py-2.5 text-label-lg font-bold shadow-lg active:scale-95 transition-transform"
          >
            Scan
          </button>
        </div>
      </div>
    </section>
  );
}
