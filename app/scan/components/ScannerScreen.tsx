"use client";

import { useState, useCallback, useRef, useEffect, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCamera } from "../hooks/useCamera";
import { ViewfinderOverlay } from "./ViewfinderOverlay";
import { ThumbnailTray } from "./ThumbnailTray";
import { CameraControls } from "./CameraControls";
import { PrimaryCTA } from "./PrimaryCTA";
import { ProcessingOverlay } from "./ProcessingOverlay";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useScanPayload } from "@/lib/scan-store";
import { getDeviceId } from "@/lib/device-id";
import { useUser } from "@/lib/user-store";

const MAX_IMAGES = 3;

async function dataUrlToFile(dataUrl: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], `page-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export function ScannerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expectedSubject = searchParams.get("subject");
  const retrySessionId = searchParams.get("retry");
  const { userId, userClass } = useUser();
  const { videoRef, isReady: cameraReady, error: cameraError, capture } = useCamera("environment");
  const { setImages, setQuiz, setSessionId } = useScanPayload();

  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorIsSubjectMismatch, setErrorIsSubjectMismatch] = useState(false);
  const [mismatchDetected, setMismatchDetected] = useState("");
  const [mismatchExpected, setMismatchExpected] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCapture = capturedImages.length < MAX_IMAGES;

  useEffect(() => {
    return () => {
      capturedImages.forEach((src) => {
        if (src.startsWith("blob:")) URL.revokeObjectURL(src);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShutter = useCallback(() => {
    if (!canCapture) return;
    const imageSrc = capture();
    if (!imageSrc) return;

    setCapturedImages((prev) => [...prev, imageSrc]);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);
  }, [canCapture, capture]);

  const handleDelete = (index: number) => {
    setCapturedImages((prev) => {
      const removed = prev[index];
      if (removed && removed.startsWith("blob:")) {
        URL.revokeObjectURL(removed);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - capturedImages.length;
    const toAdd = files.slice(0, remaining);

    const newUrls = toAdd.map((file) => URL.createObjectURL(file));
    setCapturedImages((prev) => [...prev, ...newUrls]);

    e.target.value = "";
  };

  const handleFinish = async () => {
    if (capturedImages.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setStatusText("Menyiapkan gambar...");

    try {
      setImages(capturedImages);

      // Step 1: Compress & upload all images to Supabase
      setProgress(20);
      setStatusText("Mengompres & mengunggah gambar...");

      const imageCompression = (await import("browser-image-compression")).default;
      const uploadedUrls: string[] = [];

      for (const dataUrl of capturedImages) {
        const file = await dataUrlToFile(dataUrl);
        const compressedFile = await imageCompression(file, {
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          initialQuality: 0.75,
          fileType: "image/jpeg",
        });

        const formData = new FormData();
        formData.append("file", compressedFile, `page-${Date.now()}.jpg`);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Gagal mengunggah gambar");

        const { url } = await res.json();
        uploadedUrls.push(url);
      }

      // Step 2: Convert blob URLs to data URLs
      setProgress(50);
      setStatusText("Membaca gambar...");

      const imageDataUrls = await Promise.all(
        capturedImages.map(async (src) => {
          if (src.startsWith("blob:")) {
            const response = await fetch(src);
            const blob = await response.blob();
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
          return src;
        })
      );

      // Step 3: Pass 1 — Extract context from images
      setProgress(60);
      setStatusText("Membaca materi dari halaman...");

      const contextRes = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "context",
          images: imageDataUrls,
          kelas: userClass,
        }),
      });

      if (!contextRes.ok) throw new Error("Gagal membaca materi");

      const { context } = await contextRes.json();

      if (!context || context.is_clear === false) {
        setErrorTitle(context?.rejection_reason || "Gambar kurang jelas, coba foto ulang");
        setErrorIsSubjectMismatch(false);
        setShowErrorPopup(true);
        setIsProcessing(false);
        return;
      }

      // Step 4: Pass 2 — Generate quiz from context
      setProgress(70);
      setStatusText("Membuat soal berdasarkan materi...");

      const quizRes = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          mode: "pretest",
          kelas: userClass,
          expectedSubject: expectedSubject || undefined,
        }),
      });

      if (!quizRes.ok) throw new Error("Gagal membuat soal");

      const result = await quizRes.json();

      // Subject mismatch
      if (result.subjectMismatch) {
        setMismatchDetected(result.detectedSubject);
        setMismatchExpected(result.expectedSubject);
        setErrorIsSubjectMismatch(true);
        setShowErrorPopup(true);
        setIsProcessing(false);
        return;
      }

      const { quiz } = result;

      if (!quiz.is_clear) {
        setErrorTitle(quiz.rejection_reason || "Gambar kurang jelas, coba foto ulang");
        setErrorIsSubjectMismatch(false);
        setShowErrorPopup(true);
        setIsProcessing(false);
        return;
      }

      // Step 5: Create session with quiz + context_meta
      setProgress(90);
      setStatusText("Menyimpan sesi quiz...");

      const sessionSummary = {
        ...quiz,
        context_meta: {
          subject: context.subject,
          title: context.title,
          kelas: userClass,
          key_concepts: context.key_concepts,
          formulas: context.formulas,
          definitions: context.definitions,
          example_problems: context.example_problems,
        },
      };

      let sessionId: string;

      if (retrySessionId) {
        const sessionRes = await fetch(`/api/sessions/${retrySessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrls: uploadedUrls,
            summary: JSON.stringify(sessionSummary),
          }),
        });
        if (!sessionRes.ok) throw new Error("Gagal memperbarui sesi");
        sessionId = retrySessionId;
      } else {
        const sessionRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrls: uploadedUrls,
            summary: JSON.stringify(sessionSummary),
            userId: userId || getDeviceId(),
          }),
        });
        if (!sessionRes.ok) throw new Error("Gagal menyimpan sesi");
        const data = await sessionRes.json();
        sessionId = data.sessionId;
      }

      setQuiz(quiz);
      setSessionId(sessionId);

      // Done
      setProgress(100);
      setStatusText("Selesai! 🎉");

      setTimeout(() => {
        router.push(`/learn?id=${sessionId}`);
      }, 500);
    } catch (err) {
      setStatusText(
        `Error: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`
      );
      setProgress(0);
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  const handleRetry = () => {
    setShowErrorPopup(false);
    setErrorIsSubjectMismatch(false);
    setCapturedImages([]);
  };

  return (
    <div className="bg-ink-navy h-screen w-screen overflow-hidden relative font-body-md text-on-surface select-none">
      {!isProcessing && (
        <>
          {/* Fallback background image */}
          <img
            alt="Camera view"
            className="absolute inset-0 z-0 w-full h-full object-cover"
            src="/images/google/55520017.png"
          />

          {/* Camera Video Feed — always rendered so useCamera ref is available */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 z-[1] w-full h-full object-cover transition-opacity duration-500 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Hidden file input for gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Flash Overlay */}
          {showFlash && (
            <div className="fixed inset-0 bg-white z-[9999] animate-[flash_150ms_ease-out_forwards]" />
          )}

          {/* Main Scanner UI Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
            <div className="h-24 w-full flex justify-between items-center px-container-margin-mobile pointer-events-auto bg-ink-navy/70">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center neo-border neo-shadow neo-interactive transition-all"
                aria-label="Kembali"
              >
                <MaterialIcon name="arrow_back" className="text-ink-navy text-2xl font-bold" />
              </button>

              <button
                onClick={() => setIsFlashOn((v) => !v)}
                className={`w-12 h-12 rounded-full flex items-center justify-center neo-border neo-shadow neo-interactive transition-colors ${
                  isFlashOn ? "bg-secondary-container" : "bg-white"
                }`}
                aria-label="Nyalakan flash"
              >
                <MaterialIcon
                  name={isFlashOn ? "flash_on" : "flash_off"}
                  className="text-ink-navy text-2xl font-bold"
                />
              </button>
            </div>

            <ViewfinderOverlay />

            <div className="w-full flex flex-col items-center gap-4 pb-6 pointer-events-auto">
              <div className="bg-ink-navy/70 px-4 py-1 rounded-full neo-border text-white font-label-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-success-green rounded-full animate-pulse" />
                <span>{capturedImages.length}/{MAX_IMAGES} Halaman Maksimal</span>
              </div>

              <ThumbnailTray
                images={capturedImages}
                onDelete={handleDelete}
                onAdd={handleGalleryClick}
                disabled={!canCapture}
              />

              {capturedImages.length > 0 && (
                <div className="px-8 w-full">
                  <PrimaryCTA onClick={handleFinish} disabled={isProcessing}>
                    <MaterialIcon name="auto_awesome" />
                    <span>Selesai & Buat Quiz</span>
                  </PrimaryCTA>
                </div>
              )}

              <CameraControls
                onShutter={handleShutter}
                shutterDisabled={!canCapture}
                onGallery={handleGalleryClick}
              />
            </div>
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink-navy/90 text-white p-6 text-center">
              <div className="flex flex-col gap-4">
                <MaterialIcon name="videocam_off" className="text-6xl text-error" />
                <p className="font-headline-md">{cameraError}</p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 bg-primary text-white rounded-xl neo-border neo-shadow font-bold"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Error Popup: gambar kurang jelas */}
          {showErrorPopup && !errorIsSubjectMismatch && (
            <div className="absolute inset-0 z-[999] bg-ink-navy/90 flex items-center justify-center p-6">
              <div className="bg-surface rounded-xl border-4 border-ink-navy shadow-neo p-6 max-w-md w-full text-center">
                <MaterialIcon name="visibility_off" className="text-6xl text-primary mb-4" />
                <p className="text-headline-md font-bold mb-2">Gambar Kurang Jelas</p>
                <p className="text-body-md text-on-surface-variant mb-6">
                  {errorTitle}
                  <br />
                  Yuk foto ulang dengan halaman yang lebih jelas!
                </p>
                <button
                  onClick={handleRetry}
                  className="w-full py-4 px-6 bg-primary text-white rounded-xl neo-border neo-shadow-lg font-bold text-body-lg flex items-center justify-center gap-2 btn-tactile"
                >
                  <MaterialIcon name="camera_alt" />
                  Coba Scan Ulang
                </button>
              </div>
            </div>
          )}

          {/* Error Popup: subject mismatch */}
          {showErrorPopup && errorIsSubjectMismatch && (
            <div className="absolute inset-0 z-[999] bg-ink-navy/90 flex items-center justify-center p-6">
              <div className="bg-surface rounded-xl border-4 border-ink-navy shadow-neo p-6 max-w-md w-full text-center">
                <MaterialIcon name="sync_problem" className="text-6xl text-primary mb-4" />
                <p className="text-headline-md font-bold mb-2">Mapel Tidak Sesuai</p>
                <p className="text-body-md text-on-surface-variant mb-6">
                  Halaman yang kamu scan adalah pelajaran <b>{mismatchDetected}</b>, tapi kamu memilih <b>{mismatchExpected}</b>.
                  <br /><br />
                  Pilih mapel yang sesuai atau scan halaman yang benar!
                </p>
                <button
                  onClick={handleRetry}
                  className="w-full py-4 px-6 bg-primary text-white rounded-xl neo-border neo-shadow-lg font-bold text-body-lg flex items-center justify-center gap-2 btn-tactile"
                >
                  <MaterialIcon name="camera_alt" />
                  Coba Scan Ulang
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <ProcessingOverlay
          progress={progress}
          statusText={statusText}
          totalPages={capturedImages.length}
        />
      )}
    </div>
  );
}
