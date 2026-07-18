"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import DOMPurify from "dompurify";

// Convert markdown **bold** and *italic* to HTML tags
function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>")
    .replace(/\n/g, "<br>");
}

const ALLOWED_TAGS = ["b", "i", "span", "br", "p", "ul", "li", "strong", "em"];
const ALLOWED_ATTR = ["style", "class"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ContextMeta {
  subject?: string;
  title?: string;
  kelas?: number | null;
  key_concepts?: string[];
  [key: string]: unknown;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  contextMeta: ContextMeta | null;
}

const MASCOT_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQWHTAqm4ntkuINZMoAv60PhC0YfQAQnOHhLpPu-9Th0A4puQAYm1feIsDII8t9ZVOpStvzVWRjVb5b_pN3kL_Eu-g0c-V0MF9J6d7iljPVuWEZLqUEK5cgqlPpISBdGs8d2cq0rqwi6p6V2Z6fXZKDOUHIytfb6HIuzQmiVnRELRR4OKahAIW5rpqW29oZYrNJleRRvVgmxlzGCfJSpcXMYPmBBTbTB48GFDV9n23nMza4t4NUyh0aXnYQEKHdhdWtzL3A3MofTqxAZM";

const GREETING = "Halo! Aku Aksaraa, asisten belajarmu. Ada yang ingin ditanyakan tentang materi ini? Atau mungkin kamu ingin cerita sesuatu? Aku siap dengerin! 😊";

export function TanyaChat({ isOpen, onClose, sessionId, contextMeta }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognitionAPI = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const speechSupported = !!SpeechRecognitionAPI;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Reset state on close
  const handleClose = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    onClose();
    setErrorMsg(null);
    setRetryMessage(null);
  }, [onClose]);

  // Send message to API
  const sendMessage = useCallback(async (text: string, isRetry = false) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const updatedMessages = isRetry
      ? messages.slice(0, -1).concat(userMsg)
      : [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setErrorMsg(null);
    setRetryMessage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionId,
          contextMeta,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal mendapatkan respons");
      }

      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setErrorMsg("Maaf, aku gagal merespons. Coba kirim ulang ya!");
      setRetryMessage(text.trim());
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, sessionId, contextMeta]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) sendMessage(input);
    }
  }, [input, sendMessage]);

  // Set greeting on first open
  useEffect(() => {
    if (isOpen && !hasOpened) {
      setHasOpened(true);
      setMessages([{ role: "assistant", content: GREETING }]);
    }
  }, [isOpen, hasOpened]);

  // ── Speech-to-Text ──
  const speakPrefixRef = useRef("");

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI || isListening || isLoading) return;

    speakPrefixRef.current = input;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      const prefix = speakPrefixRef.current;
      setInput(prefix + (prefix && (final || interim) ? " " : "") + final + interim);
      if (final) {
        recognition.stop();
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("[TanyaChat] Speech error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognitionAPI, isListening, isLoading, input]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-navy/60 z-[100] backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-1/2 md:translate-y-1/2 w-full md:w-[600px] h-[85vh] md:h-[70vh] z-[110] px-0 md:px-4">
        <div className="bg-white w-full h-full rounded-t-lg md:rounded-lg border-x-4 border-t-4 md:border-b-4 border-ink-navy shadow-[0px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col relative animate-bounce-in">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b-2 border-ink-navy bg-surface-container-low rounded-t-lg flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-ink-navy overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <img
                  alt="Aksaraa AI mascot"
                  className="w-full h-full object-cover"
                  src={MASCOT_URL}
                />
              </div>
              <div>
                <h1 className="text-headline-md font-headline-md text-ink-navy">Tanya Aksaraa</h1>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
                  <span className="text-label-sm font-label-sm text-on-surface-variant">
                    Online &amp; Siap Bantu
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full border-2 border-ink-navy bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-surface-variant transition-all active:translate-y-0.5 active:shadow-none"
            >
              <MaterialIcon name="close" className="text-ink-navy" />
            </button>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-gutter space-y-stack-md chat-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-1`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-xl border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] animate-bounce-in ${
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
                <span className={`text-label-sm font-label-sm text-on-surface-variant ${msg.role === "user" ? "mr-2" : "ml-2"}`}>
                  {msg.role === "user" ? "Kamu" : "Aksaraa"}
                </span>
              </div>
            ))}

            {/* Error message with retry */}
            {errorMsg && retryMessage && (
              <div className="flex flex-col items-center gap-2 py-2">
                <p className="text-label-sm text-error text-center">{errorMsg}</p>
                <button
                  onClick={() => sendMessage(retryMessage, true)}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg border-2 border-ink-navy shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all text-label-sm font-label-sm"
                >
                  <MaterialIcon name="refresh" className="text-on-primary mr-1" />
                  Kirim Ulang
                </button>
              </div>
            )}

            {/* Typing indicator */}
            {isLoading && !errorMsg && (
              <div className="flex flex-col items-start gap-1">
                <div className="bg-white border-2 border-ink-navy rounded-xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4 animate-bounce-in">
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

          {/* Input Area */}
          <div className="p-gutter border-t-2 border-ink-navy bg-white rounded-b-lg flex-shrink-0">
            <div className="flex items-center gap-stack-sm">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pertanyaanmu di sini..."
                  disabled={isLoading}
                  className="w-full pl-6 pr-12 py-4 bg-white border-2 border-ink-navy rounded-full text-body-md focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MaterialIcon name="send" className="text-[28px]" filled />
                </button>
              </div>
              <button
                onClick={toggleListening}
                disabled={!speechSupported || isLoading}
                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-ink-navy shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-0.5 active:shadow-none ${
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
                  className={`text-white text-[32px] ${isListening ? "filled" : ""}`}
                  filled={isListening}
                />
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                <MaterialIcon name="auto_awesome" className="text-[14px]" />
                Dibantu oleh Aksaraa AI yang Pintar
              </p>
            </div>
          </div>

          {/* Quick Action Floating */}
          <div className="absolute -top-12 right-4 flex gap-2 pointer-events-none">
            <div className="bg-secondary-container border-2 border-ink-navy px-4 py-2 rounded-full shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2 animate-bounce">
              <MaterialIcon name="star" className="text-primary text-[20px]" filled />
              <span className="text-label-sm font-label-sm text-ink-navy">Coba: &ldquo;{contextMeta?.subject || "Materi"}&rdquo;</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
