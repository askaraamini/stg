"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface QuizData {
  is_clear: boolean;
  rejection_reason?: string;
  subject?: string;
  title: string;
  language: "id" | "en";
  questions: {
    question: string;
    options: string[];
    correct_index: number;
    diagram_index?: number | null;
    explanation_html: string;
  }[];
}

interface ScanPayload {
  images: string[];
  setImages: (imgs: string[]) => void;
  quiz: QuizData | null;
  setQuiz: (q: QuizData | null) => void;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  clear: () => void;
}

const ScanContext = createContext<ScanPayload | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const clear = () => {
    setImages([]);
    setQuiz(null);
    setSessionId(null);
  };

  return (
    <ScanContext.Provider
      value={{ images, setImages, quiz, setQuiz, sessionId, setSessionId, clear }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScanPayload() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScanPayload must be used within a ScanProvider");
  return ctx;
}
