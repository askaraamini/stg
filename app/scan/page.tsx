import { Suspense } from "react";
import { ScannerScreen } from "./components/ScannerScreen";

function ScanFallback() {
  return (
    <div className="bg-ink-navy h-screen w-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<ScanFallback />}>
      <ScannerScreen />
    </Suspense>
  );
}
