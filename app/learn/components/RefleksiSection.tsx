"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import DOMPurify from "dompurify";

const WAVEFORM_BARS = [
  "bg-primary", "bg-ink-navy", "bg-primary", "bg-ink-navy",
  "bg-primary", "bg-ink-navy", "bg-primary", "bg-ink-navy",
  "bg-primary", "bg-ink-navy", "bg-primary", "bg-ink-navy",
  "bg-primary", "bg-ink-navy", "bg-primary",
];

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-12 w-full">
      {WAVEFORM_BARS.map((_, i) => (
        <div
          key={i}
          className={`w-[5px] rounded-full transition-all duration-150 ${
            active
              ? `${WAVEFORM_BARS[i]} animate-wave`
              : "bg-ink-navy/20"
          }`}
          style={active ? { animationDelay: `${((i % 8) + 1) * 0.1}s` } : { height: "6px" }}
        />
      ))}
    </div>
  );
}

function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>")
    .replace(/\n/g, "<br>");
}

const ALLOWED_TAGS = ["b", "i", "span", "br", "p", "ul", "li", "strong", "em"];
const ALLOWED_ATTR = ["style", "class"];

interface ContextMeta {
  subject?: string;
  title?: string;
  kelas?: number | null;
  key_concepts?: string[];
  [key: string]: unknown;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Assessment {
  understanding: "good" | "needs_improvement";
  what_good: string[];
  to_improve: string[];
}

interface Props {
  contextMeta: ContextMeta | null;
  sessionId: string | null;
  subject: string;
  title: string;
  onComplete: () => void;
  onAssessmentResult?: (assessment: Assessment) => void;
}

function RefleksiSection({ contextMeta, sessionId, subject, title, onComplete, onAssessmentResult }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micPopup, setMicPopup] = useState<"hidden" | "allow" | "denied">("hidden");
  const [showResult, setShowResult] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [speechText, setSpeechText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const accumulatedTextRef = useRef("");
  const latestInterimRef = useRef("");
  const sendingRef = useRef(false);
  const keepAliveRef = useRef(true);
  const mountedRef = useRef(true);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const silentRestartCountRef = useRef(0);
  const hasReceivedResultRef = useRef(false);
  const epochRef = useRef(0);

  const SpeechRecognitionAPI =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const speechSupported = !!SpeechRecognitionAPI;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto-complete when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !showResult) {
      triggerComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  // ── Speech-to-Text ──

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI || recognitionRef.current || showResult) return;
    silentRestartCountRef.current = 0;
    const epoch = ++epochRef.current;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      if (epochRef.current !== epoch) return;
      let newFinal = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          newFinal += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }
      hasReceivedResultRef.current = true;
      silentRestartCountRef.current = 0;
      console.log("[Refleksi] onresult", { newFinal, interim, acc: accumulatedTextRef.current, latest: latestInterimRef.current });
      console.log("[Refleksi] onresult raw", {
        resultIndex: event.resultIndex,
        resultsLength: event.results.length,
        results: Array.from(event.results).map((r: any) => ({
          isFinal: r.isFinal,
          transcript: r[0]?.transcript ?? "(missing)",
          confidence: r[0]?.confidence ?? "(missing)",
        })),
      });
      if (newFinal) {
        if (accumulatedTextRef.current.endsWith(newFinal) || accumulatedTextRef.current.includes(newFinal)) {
          console.log("[Refleksi] dedup skipped:", newFinal);
        } else {
          accumulatedTextRef.current += (accumulatedTextRef.current && newFinal ? " " : "") + newFinal;
        }
        latestInterimRef.current = "";
      }
      if (interim) {
        latestInterimRef.current = interim;
      }
      const displayText = accumulatedTextRef.current + (accumulatedTextRef.current && latestInterimRef.current ? " " : "") + latestInterimRef.current;
      if (displayText.trim()) {
        setSpeechText(displayText);
      }
      setIsSpeaking(!!interim);
    };

    recognition.onerror = (event: any) => {
      if (epochRef.current !== epoch) return;
      console.warn("[Refleksi] Speech error:", event.error);
      clearTimeout(restartTimeoutRef.current);
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === "not-allowed") {
        setMicPopup("allow");
      }
    };

    recognition.onend = () => {
      if (epochRef.current !== epoch) return;
      setIsListening(false);
      setIsSpeaking(false);
      console.log("[Refleksi] onend", { acc: accumulatedTextRef.current, latest: latestInterimRef.current });
      // Finalize pending interim so text survives recognition restart
      if (latestInterimRef.current) {
        accumulatedTextRef.current += (accumulatedTextRef.current && latestInterimRef.current ? " " : "") + latestInterimRef.current;
        latestInterimRef.current = "";
        setSpeechText(accumulatedTextRef.current);
        console.log("[Refleksi] finalized interim →", accumulatedTextRef.current);
      }
      if (keepAliveRef.current && !showResult) {
        silentRestartCountRef.current++;
        if (silentRestartCountRef.current > 10 && !hasReceivedResultRef.current) {
          console.warn("[Refleksi] too many silent restarts — stopping");
          return;
        }
        recognitionRef.current = null;
        restartTimeoutRef.current = setTimeout(() => {
          if (!keepAliveRef.current || showResult || !mountedRef.current) return;
          startListening();
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    keepAliveRef.current = true;
    setIsListening(true);
  }, [SpeechRecognitionAPI, showResult]);

  const stopListening = useCallback(() => {
    keepAliveRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      silentRestartCountRef.current = 0;
      setMicPopup("hidden");
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Try to start mic on mount
  useEffect(() => {
    mountedRef.current = true;
    if (speechSupported) {
      startListening();
    } else {
      setMicPopup("allow");
    }
    return () => {
      mountedRef.current = false;
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send speech as bubble ──
  const handleSendSpeech = useCallback(async () => {
    // Stop recognition first so we capture what's been said so far
    keepAliveRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsSpeaking(false);
    // Finalize pending interim
    if (latestInterimRef.current) {
      accumulatedTextRef.current += (accumulatedTextRef.current && latestInterimRef.current ? " " : "") + latestInterimRef.current;
      latestInterimRef.current = "";
    }

    const text = accumulatedTextRef.current.trim();
    console.log("[Refleksi] handleSendSpeech", { text, speechText, isLoading });
    if (!text || isLoading || sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setSpeechText("");
    accumulatedTextRef.current = "";
    latestInterimRef.current = "";
    setIsLoading(true);

    try {
      const updatedMessages = [...messages, userMsg];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionId,
          contextMeta,
          mode: "reflection",
        }),
      });

      if (!res.ok) throw new Error("Gagal mendapatkan respons");

      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        role: "assistant" as const,
        content: "Maaf, aku gagal merespons. Coba tekan Selesai Bicara lagi ya!",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
      // Always restart mic after sending
      if (speechSupported) startListening();
    }
  }, [messages, isLoading, sessionId, contextMeta, speechSupported, startListening, speechText]);

  // ── Complete — assessment + result ──
  const triggerComplete = useCallback(() => {
    stopListening();
    clearInterval(timerRef.current);
    doAssessment();
  }, [stopListening, messages, sessionId, contextMeta]);

  const doAssessment = useCallback(async () => {
    if (messages.length === 0) {
      const fallback: Assessment = {
        understanding: "needs_improvement",
        what_good: [],
        to_improve: ["Ceritakan apa yang kamu pelajari hari ini"],
      };
      setAssessment(fallback);
      onAssessmentResult?.(fallback);
      setShowResult(true);
      return;
    }

    setAssessing(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.filter((m) => m.role === "user").map((m) => ({ role: m.role, content: m.content })),
          sessionId,
          contextMeta,
          mode: "reflection-assessment",
        }),
      });

      if (!res.ok) throw new Error("Gagal menganalisis");

      const data = await res.json();
      const parsed: Assessment = {
        understanding: data.understanding || "needs_improvement",
        what_good: Array.isArray(data.what_good) && data.what_good.length > 0 ? data.what_good : ["Kamu sudah mencoba mengingat"],
        to_improve: Array.isArray(data.to_improve) && data.to_improve.length > 0 ? data.to_improve : ["Coba ulangi kembali materi yang sudah dipelajari"],
      };
      setAssessment(parsed);
      onAssessmentResult?.(parsed);
    } catch {
      const fallback: Assessment = {
        understanding: "needs_improvement",
        what_good: [],
        to_improve: ["Ulangi kembali materi yang sudah dipelajari"],
      };
      setAssessment(fallback);
      onAssessmentResult?.(fallback);
    } finally {
      setAssessing(false);
      setShowResult(true);
    }
  }, [messages, sessionId, contextMeta]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const timerColor = timeLeft <= 60 ? "text-error animate-pulse" : "text-ink-navy";

  // ── Loading assessment ──
  if (assessing) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-headline-md text-on-surface-variant animate-pulse text-center">
          Menganalisis pemahamanmu...
        </p>
        <div className="w-32 h-32 float-anim">
          <img
            alt="Aksaraa Friend"
            className="w-full h-full object-contain drop-shadow-lg"
            src="/images/friend.png"
          />
        </div>
      </main>
    );
  }

  // ── Result popup ──
  if (showResult && assessment) {
    const isGood = assessment.understanding === "good";
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        {isGood && <ConfettiEffect />}
        <div className="relative w-40 h-40 md:w-52 md:h-52 float-anim">
          <img
            alt="Aksaraa Mascot"
            className="w-full h-full object-contain drop-shadow-xl"
            src={isGood ? "/images/mascot.png" : "/images/wrong.png"}
          />
        </div>
        <div className="bg-white border-4 border-ink-navy rounded-[2rem] px-6 py-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] max-w-md w-full">
          <div className="text-center mb-4">
            <h2 className="text-headline-lg font-black text-ink-navy">
              {isGood ? "Pemahamanmu Sangat Baik! ✨" : "Ayo Semangat! 💪"}
            </h2>
          </div>

          {assessment.what_good.length > 0 && (
            <div className="mb-4">
              <p className="text-label-lg font-black text-success-green mb-2 flex items-center gap-1">
                <MaterialIcon name="check_circle" className="text-success-green" filled />
                Sudah Bagus
              </p>
              <ul className="space-y-1">
                {assessment.what_good.map((point, i) => (
                  <li key={i} className="text-body-md text-ink-navy flex items-start gap-2">
                    <span className="text-success-green mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.to_improve.length > 0 && (
            <div className="mb-6">
              <p className="text-label-lg font-black text-primary mb-2 flex items-center gap-1">
                <MaterialIcon name="menu_book" className="text-primary" filled />
                Tingkatkan Lagi
              </p>
              <ul className="space-y-1">
                {assessment.to_improve.map((point, i) => (
                  <li key={i} className="text-body-md text-ink-navy flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onComplete}
            className="w-full bg-primary text-on-primary font-black py-4 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all hover:scale-[1.02] text-headline-md"
          >
            Lanjut
          </button>
        </div>
      </main>
    );
  }

  // ── Main reflection UI ──
  return (
    <main className="flex-1 flex flex-col items-center justify-start gap-6 px-4 pt-6 pb-[160px] md:pb-32 w-full max-w-4xl mx-auto">
      {/* Friend mascot + static speech bubble */}
      <div className="w-full max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 float-anim">
            <img
              alt="Aksaraa Friend"
              className="w-full h-full object-contain drop-shadow-lg"
              src="/images/friend.png"
            />
          </div>
          <div className="flex-1 bg-white border-2 border-ink-navy rounded-xl rounded-tl-none p-3 md:p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <p className="text-body-lg md:text-headline-md font-black text-ink-navy">
              Ayo ceritakan apa yang kamu pelajari!
            </p>
            <p className="text-sm md:text-body-md text-on-surface-variant mt-1">
              Tentang <span className="font-black text-primary">{subject}</span> —{" "}
              <span className="font-black text-primary">{title}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="w-full max-w-2xl flex-1 overflow-y-auto max-h-[35vh] space-y-4 px-1 chat-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-1`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-xl border-2 border-ink-navy shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] ${
                msg.role === "user"
                  ? "bg-success-green/20 rounded-tr-none"
                  : "bg-white rounded-tl-none"
              }`}
            >
              {msg.role === "assistant" ? (
                <div
                  className="font-body-md text-ink-navy [&_b]:font-black [&_i]:italic [&_p]:mb-2"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(mdToHtml(msg.content), {
                      ALLOWED_TAGS,
                      ALLOWED_ATTR,
                    }),
                  }}
                />
              ) : (
                <p className="font-body-md text-ink-navy whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex flex-col items-start gap-1">
            <div className="bg-white border-2 border-ink-navy rounded-xl rounded-tl-none shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-4">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-ink-navy/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2.5 h-2.5 bg-ink-navy/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2.5 h-2.5 bg-ink-navy/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice visualizer + Selesai Bicara */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-4">
        <WaveformBars active={isListening} />
        {!isLoading && (isListening || speechText.trim()) && (
          <button
            onClick={handleSendSpeech}
            className="w-full max-w-xs bg-success-green text-white font-black py-3.5 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all hover:scale-[1.03] flex items-center justify-center gap-2"
          >
            <MaterialIcon name="mic" className="text-lg" filled />
            <span className="text-label-lg">Selesai Bicara</span>
          </button>
        )}
        {!isLoading && !isListening && !speechText.trim() && (
          <p className="text-body-md text-on-surface-variant text-center animate-pulse">
            Tekan tombol mic untuk berbicara
          </p>
        )}
      </div>

      {/* Mic permission popup */}
      {micPopup === "allow" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink-navy/60 backdrop-blur-sm" onClick={() => setMicPopup("denied")} />
          <div className="relative bg-white border-4 border-ink-navy rounded-3xl shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] p-6 max-w-sm w-full flex flex-col items-center gap-4">
            <div className="w-24 h-24">
              <img
                alt="Aksaraa Friend"
                className="w-full h-full object-contain"
                src="/images/friend.png"
              />
            </div>
            <p className="text-headline-md font-black text-ink-navy text-center">
              Aksaraa ingin mendengarkan suaramu
            </p>
            <p className="text-body-md text-on-surface-variant text-center">
              Izinkan akses mikrofon di browser agar kamu bisa bicara langsung!
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={async () => {
                  try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    setMicPopup("hidden");
                    startListening();
                  } catch {
                    setMicPopup("denied");
                  }
                }}
                className="w-full bg-primary text-on-primary font-black py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all"
              >
                Izinkan Mikrofon
              </button>
              <button
                onClick={() => setMicPopup("denied")}
                className="w-full bg-surface text-ink-navy font-bold py-3 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom bar — timer + mic status + selesai */}
      <div className="fixed bottom-0 left-0 w-full p-4 flex justify-center pointer-events-none z-50">
        <div className="pointer-events-auto flex items-center gap-4 bg-white border-4 border-ink-navy px-6 py-3 rounded-xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center gap-2 bg-surface-variant px-3 py-1.5 rounded-full border-2 border-ink-navy shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <MaterialIcon name="timer" className={`text-lg ${timerColor}`} />
            <span className={`font-headline-md font-black ${timerColor}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            onClick={toggleListening}
            disabled={!speechSupported}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-ink-navy shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-0.5 active:shadow-none ${
              isListening
                ? "bg-success-green animate-pulse"
                : speechSupported
                  ? "bg-primary hover:scale-110"
                  : "bg-primary/50 opacity-50 cursor-not-allowed"
            }`}
            title={
              !speechSupported
                ? "Browser tidak mendukung input suara"
                : isListening
                  ? "Klik untuk berhenti merekam"
                  : "Klik untuk merekam suara"
            }
          >
            <MaterialIcon
              name="mic"
              className="text-white text-lg"
              filled={isListening}
            />
          </button>

          <div className="h-6 w-px bg-ink-navy/20" />

          <button
            onClick={triggerComplete}
            disabled={isLoading || timeLeft > 300}
            className="bg-primary text-on-primary border-2 border-ink-navy px-6 py-2 rounded-lg font-black flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-label-lg">Selesai</span>
            <MaterialIcon name="check_circle" className="text-lg" filled />
          </button>
          {timeLeft > 300 && (
            <p className="text-label-sm text-on-surface-variant text-center max-w-[140px]">
              Ceritakan dulu apa yang kamu pelajari minimal 5 menit
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default RefleksiSection;
