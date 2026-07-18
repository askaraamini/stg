import { NextRequest, NextResponse } from "next/server";
import { parseJSON } from "@/lib/parse-json";
import { validateAndAlignQuestion, getClassConstraintBlock } from "@/lib/quiz-validation";
import { promises as fs } from "fs";
import path from "path";

const PROMPTS_DIR = path.join(process.cwd(), "app/api/quiz/prompts");

async function loadPrompt(name: string): Promise<string> {
  try {
    return await fs.readFile(path.join(PROMPTS_DIR, name), "utf-8");
  } catch {
    return "";
  }
}

const SUBJECT_PROMPT_MAP: Record<string, string> = {
  "Matematika": "matematika.txt",
  "IPA (Sains)": "ipa-sains.txt",
  "Bahasa Indonesia": "bahasa-indonesia.txt",
  "Bahasa Inggris": "bahasa-inggris.txt",
  "IPS (Sejarah)": "ips-sejarah.txt",
  "Seni & Budaya": "seni-budaya.txt",
};

async function callOpenRouter(systemPrompt: string, content: unknown[], maxTokens = 16384, model?: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key belum diatur");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  // Convert text-only content array to plain string (DeepSeek doesn't support array format)
  const userContent =
    Array.isArray(content) && content.length === 1 && content[0]
      ? ((content[0] as any)?.text ?? content)
      : content;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://askaraa.com",
        "X-Title": "Aksaraa",
      },
      body: JSON.stringify({
        model: model || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite",
        temperature: 0.1,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[quiz] OpenRouter HTTP ${response.status}: ${errorBody.slice(0, 500)}`);
      throw new Error(`OpenRouter error (${response.status})`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const raw = choice?.message?.content?.trim() || "";
    if (!raw) throw new Error("OpenRouter mengembalikan respons kosong");

    const finishReason = choice?.finish_reason;
    const usage = data.usage;
      const respModel = data.model || choice?.model;
    console.log(
      `[quiz] OpenRouter OK | model=${respModel} finish_reason=${finishReason}` +
      (usage ? ` prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens} total_tokens=${usage.total_tokens}` : "") +
      ` content_len=${raw.length}`
    );

    return raw;
  } finally {
    clearTimeout(timeoutId);
  }
}

function stripLatex(text: string): string {
  let result = text;
  const handlers: [RegExp, (inner: string) => string][] = [
    [/\\\[([\s\S]*?)\\\]/g, latextoReadable],
    [/\\\(([\s\S]*?)\\\)/g, latextoReadable],
    [/\$\$([\s\S]*?)\$\$/g, latextoReadable],
    [/\$([^$\n]+)\$/g, latextoReadable],
  ];
  for (const [regex, handler] of handlers) {
    result = result.replace(regex, (_, inner) => handler(inner));
  }
  return result;
}

function latextoReadable(latex: string): string {
  return latex
    .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
    .replace(/\{([^}]+)\}\^\{([^}]+)\}/g, "$1<sup>$2</sup>")
    .replace(/(\w)\^\{([^}]+)\}/g, "$1<sup>$2</sup>")
    .replace(/(\d+)\^\{([^}]+)\}/g, "$1<sup>$2</sup>")
    .replace(/(\w)\^(\d)/g, "$1<sup>$2</sup>")
    .replace(/(\d+)\^(\d+)/g, "$1<sup>$2</sup>")
    .replace(/\{([^}]+)\}_\{([^}]+)\}/g, "$1<sub>$2</sub>")
    .replace(/(\w)_\{([^}]+)\}/g, "$1<sub>$2</sub>")
    .replace(/(\w)_(\w)/g, "$1<sub>$2</sub>")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\approx/g, "≈")
    .replace(/\\neq/g, "≠")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\pi/g, "π")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\theta/g, "θ")
    .replace(/\\infty/g, "∞")
    .replace(/\\to/g, "→")
    .replace(/\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\partial/g, "∂")
    .trim();
}

function fixBrokenHtml(text: string): string {
  return text
    .replace(/<(\w+)>([^<]*)<\1>/g, "<$1>$2</$1>")
    .replace(/<(\w+)><\/(\w+)>/g, "")
    .replace(/<(b|i|strong|em|sub|sup|p|br)>\s*<\/\1>/g, "")
    .trim();
}

const VALID_SUBJECTS = [
  "Matematika", "IPA (Sains)", "Bahasa Indonesia",
  "Bahasa Inggris", "IPS (Sejarah)", "Seni & Budaya",
];

const SUBJECT_ALIASES: Record<string, string> = {
  "Fisika": "IPA (Sains)",
  "Kimia": "IPA (Sains)",
  "Biologi": "IPA (Sains)",
  "Geografi": "IPS (Sejarah)",
  "Ekonomi": "IPS (Sejarah)",
  "Sosiologi": "IPS (Sejarah)",
  "Antropologi": "IPS (Sejarah)",
  "Sejarah": "IPS (Sejarah)",
  "Olahraga": "Seni & Budaya",
  "Seni Rupa": "Seni & Budaya",
  "Seni Musik": "Seni & Budaya",
  "Seni Tari": "Seni & Budaya",
  "Prakarya": "Seni & Budaya",
  "Informatika": "Matematika",
};

function remapSubject(subject: string | null): string | null {
  if (!subject) return null;
  return SUBJECT_ALIASES[subject] || subject;
}

// ── Pass 1: Context Extraction ──
async function handleContext(images: string[], kelas: number | null) {
  const kelasLevel = kelas ? `Kelas ${kelas}` : "SD/SMP";
  const constraintBlock = getClassConstraintBlock(kelas);
  const constraintSection = constraintBlock
    ? `\n\n=== BATASAN KELAS ${kelasLevel} ===\n${constraintBlock}`
    : "";

  const systemPrompt = [
    `Kamu adalah Aksaraa, asisten AI yang mengekstrak materi pelajaran dari gambar halaman buku untuk anak ${kelasLevel} Indonesia.${constraintSection}`,
    "",
    "Lihat gambar halaman buku pelajaran ini dan ekstrak informasi berikut:",
    "",
    "1. subject: Mata pelajaran (pilih dari: " + VALID_SUBJECTS.join(", ") + ")",
    "2. title: Judul bab/topik",
    "3. key_concepts: Array konsep-konsep kunci yang dibahas (dalam bahasa Indonesia, dari gambar)",
    "4. formulas: Array rumus-rumus matematika/ilmiah yang muncul (TULISKAN PERSIS seperti di gambar, pakai LaTeX sederhana bila perlu)",
    "5. definitions: Array definisi istilah-istilah penting (dari gambar)",
    "6. example_problems: Array contoh soal yang ada di gambar (TULISKAN PERSIS soalnya, termasuk angka-angka)",
    "",
    "HANYA gunakan informasi yang TERLIHAT di gambar. JANGAN menambahkan informasi di luar gambar.",
    "Jika gambar buram, tidak terbaca, atau bukan materi pelajaran → set is_clear: false dan rejection_reason yang jelas.",
    "",
    "KELUARKAN HANYA JSON VALID:",
    JSON.stringify({
      is_clear: true,
      rejection_reason: "string (jika is_clear false)",
      subject: "string",
      title: "string",
      key_concepts: ["string"],
      formulas: ["string"],
      definitions: ["string"],
      example_problems: ["string"],
    }, null, 2),
  ].join("\n");

  const content: { type: string; text?: string; image_url?: { url: string } }[] = [
    { type: "text", text: "Ekstrak materi pelajaran dari gambar halaman buku ini." },
    ...images.map((img) => ({ type: "image_url" as const, image_url: { url: img } })),
  ];

  const raw = await callOpenRouter(systemPrompt, content, 8192);
  const result = parseJSON(raw);
  if (typeof result.is_clear !== "boolean") throw new Error("Response missing is_clear");

  if (result.subject) {
    const mapped = remapSubject(result.subject);
    if (mapped !== result.subject) {
      console.log(`[quiz] Subject alias: "${result.subject}" → "${mapped}"`);
      result.subject = mapped;
    }
  }
  if (result.subject && !VALID_SUBJECTS.includes(result.subject)) {
    console.warn(`[quiz] context: Unknown subject "${result.subject}", defaulting to first`);
    result.subject = VALID_SUBJECTS[0];
  }

  return result;
}

// ── Pass 2: Quiz Generation ──
async function handleQuiz(
  context: any,
  mode: string,
  kelas: number | null,
  expectedSubject: string | null,
  diagramIndexLimit: number,
  count = 10,
  exclude: string[] = [],
) {
  const isExam = mode === "exam";
  const kelasLevel = kelas ? `Kelas ${kelas}` : "SD/SMP";
  const classConstraints = getClassConstraintBlock(kelas);

  // Build prompt from files + dynamic parts
  const basePrompt = await loadPrompt("base.txt");
  const subjectFile = SUBJECT_PROMPT_MAP[context.subject] || "";
  const subjectContent = subjectFile ? await loadPrompt(subjectFile) : "";
  const baseWithSubject = basePrompt.replace("{subjectInstructions}", subjectContent || "(gunakan panduan umum)");

  const modeBlock = isExam
    ? [
        "",
        "=== MODE: UJIAN ===",
        `KELAS ${kelasLevel}`,
        classConstraints,
        `Semua ${count} soal HARUS SULIT untuk level kelas ini. TIDAK BOLEH ada soal hafalan/mudah.`,
        `Setiap soal minimal butuh 2 langkah berpikir (paham konsep lalu terapkan, atau baca data lalu simpulkan).`,
        "BUAT 3+ POLA SOAL BERBEDA. Jangan mengulang pola soal yang sama.",
        "Tidak ada feedback per-soal — user baru melihat jawaban benar/salah di akhir.",
      ].filter(Boolean)
    : [
        "",
        "=== MODE: PRE-TEST ===",
        `KELAS ${kelasLevel}`,
        classConstraints,
        "BUAT VARIASI TINGKAT KESULITAN: Dari 10 soal, buat 4 soal mudah (pengetahuan dasar), 4 soal sedang (aplikasi/pemahaman konsep), 2 soal sulit (analisis/hubungan antar konsep). Acak urutannya.",
        "2 soal sulit prioritaskan soal analisis/penerapan, bukan hafalan.",
      ].filter(Boolean);

  const contextBlock = [
    "",
    "=== KONTEKS MATERI DARI HALAMAN BUKU (HANYA gunakan informasi ini) ===",
    `Subject: ${context.subject || "(dari gambar)"}`,
    `Title: ${context.title || "(dari gambar)"}`,
    `Key Concepts: ${JSON.stringify(context.key_concepts || [])}`,
    `Formulas: ${JSON.stringify(context.formulas || [])}`,
    `Definitions: ${JSON.stringify(context.definitions || [])}`,
    `Example Problems: ${JSON.stringify(context.example_problems || [])}`,
  ].join("\n");

  const excludeBlock = exclude.length > 0
    ? [
        "",
        "=== SOAL-SOAL YANG SUDAH ADA (JANGAN buat soal yang SAMA atau MIRIP) ===",
        ...exclude.map((q, i) => `${i + 1}. "${q}"`),
        `Buat ${count} soal BARU yang BERBEDA dari soal-soal di atas. JANGAN ulang soal yang sudah ada.`,
      ].join("\n")
    : "";

  const systemPrompt = [
    baseWithSubject
      .replace(/\{kelas\}/g, String(kelas || ""))
      .replace(/\{classConstraints\}/g, classConstraints || "(tidak ada batasan khusus)"),
    ...modeBlock,
    contextBlock,
    excludeBlock,
  ].join("\n\n");

  const content: { type: string; text?: string }[] = [
    {
      type: "text",
      text: `Buat ${count} soal ${isExam ? "UJIAN (semua sulit)" : "PRE-TEST (variasi mudah/sedang/sulit)"} berdasarkan konteks materi di atas.`,
    },
  ];

  const raw = await callOpenRouter(systemPrompt, content, 16384, process.env.OPENROUTER_MODEL_QUIZ || "google/gemini-2.5-flash");
  let quiz: any;
  try {
    quiz = parseJSON(raw);
  } catch (e) {
    console.error(`[quiz] RAW LLM OUTPUT (first 2000): ${raw.slice(0, 2000).replace(/\n/g, "\\n")}`);
    console.error(`[quiz] RAW LLM OUTPUT (last 1000): ${raw.slice(-1000).replace(/\n/g, "\\n")}`);
    throw e;
  }

  if (typeof quiz.is_clear !== "boolean") throw new Error("Response missing is_clear");

  if (quiz.subject) {
    const mapped = remapSubject(quiz.subject);
    if (mapped !== quiz.subject) {
      console.log(`[quiz] Subject alias: "${quiz.subject}" → "${mapped}"`);
      quiz.subject = mapped;
    }
  }
  if (quiz.subject && !VALID_SUBJECTS.includes(quiz.subject)) {
    console.warn(`[quiz] Unknown subject "${quiz.subject}", defaulting to first`);
    quiz.subject = VALID_SUBJECTS[0];
  }

  // Subject mismatch check
  if (expectedSubject && quiz.subject && quiz.subject !== expectedSubject) {
    return { quiz, subjectMismatch: true, detectedSubject: quiz.subject, expectedSubject };
  }

  if (Array.isArray(quiz.questions)) {
    // Validate + collect questions, returning { valid: Question[], invalid: count }
    function validateQuestions(qs: any[]): any[] {
      const valid: any[] = [];
      for (const q of qs) {
        if (q.question) {
          q.question = stripLatex(q.question);
          q.question = fixBrokenHtml(q.question);
        }
        if (Array.isArray(q.options)) {
          q.options = q.options.map((opt: string) => opt.replace(/<[^>]*>/g, ""));
        }
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) continue;
        if (typeof q.correct_index === "string") {
          const trimmed = q.correct_index.trim();
          const parsed = parseInt(trimmed, 10);
          if (!isNaN(parsed)) q.correct_index = parsed;
        }
        if (typeof q.correct_index === "number" && !Number.isInteger(q.correct_index)) {
          q.correct_index = Math.round(q.correct_index);
        }
        if (q.correct_index === null || q.correct_index === undefined) q.correct_index = 0;
        if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index > 3) continue;
        if (q.diagram_index !== undefined && q.diagram_index !== null) {
          if (typeof q.diagram_index !== "number" || q.diagram_index < 0 || q.diagram_index >= diagramIndexLimit || !Number.isInteger(q.diagram_index)) {
            q.diagram_index = null;
          }
        }
        if (q.explanation_html) q.explanation_html = stripLatex(q.explanation_html);
        if (q.explanation_html && !/<[a-z][\s>]/i.test(q.explanation_html)) {
          q.explanation_html = `<p>${q.explanation_html}</p>`;
        }
        if (q.explanation_html && q.explanation_html.length > 600) {
          q.explanation_html = q.explanation_html.slice(0, 600);
        }
        valid.push(q);
      }
      return valid;
    }

    // ── Normalise, Shuffle, Validate ──

    function normalize(str: unknown): string {
      if (str === undefined || str === null) return '';
      return str.toString().trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function shuffleOptions(q: any): any {
      const opts = [...q.options];
      const correctText = opts[q.correct_index];

      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }

      const newIndex = opts.indexOf(correctText);
      if (newIndex === -1) {
        console.error(`[quiz] Shuffle failed to find "${correctText}" in options`);
        return q;
      }

      return { ...q, options: opts, correct_index: newIndex };
    }

    const jaccardSimilarity = (a: string, b: string): number => {
      const setA = new Set(a.toLowerCase().split(/\s+/));
      const setB = new Set(b.toLowerCase().split(/\s+/));
      const intersection = new Set([...setA].filter((x) => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      return intersection.size / union.size;
    };

    let accumulated: any[] = [];
    const excludeSet = new Set(exclude);
    const MAX_RETRIES = 3;

    // Helper: validate → shuffle → validateAndAlignQuestion → dedup → accumulate
    const processAndAccumulate = (questions: any[]) => {
      for (const q of validateQuestions(questions)) {
        const shuffled = shuffleOptions(q);
        const validated = validateAndAlignQuestion(shuffled);
        if (!validated) continue;
        if (accumulated.length >= count) break;
        const qText = validated.question.toLowerCase();
        if (excludeSet.has(qText)) continue;
        const isDuplicate = accumulated.some(
          (a) => jaccardSimilarity(a.question, validated.question) > 0.6
        );
        if (isDuplicate) continue;
        excludeSet.add(qText);
        delete validated.answer_value;
        accumulated.push(validated);
      }
    };

    // First batch — goes through full pipeline
    processAndAccumulate(quiz.questions);

    for (let attempt = 0; attempt < MAX_RETRIES && accumulated.length < count; attempt++) {
      const remaining = count - accumulated.length;
      const raw = await callOpenRouter(systemPrompt, [{
        type: "text",
        text: `Buat ${remaining} soal BARU ${isExam ? "UJIAN (semua sulit)" : "PRE-TEST (variasi mudah/sedang/sulit)"} berdasarkan konteks materi di atas. JANGAN buat soal yang sudah ada.`,
      }], 16384, process.env.OPENROUTER_MODEL_QUIZ || "google/gemini-2.5-flash");
      let retryQuiz: any;
      try { retryQuiz = parseJSON(raw); } catch { continue; }
      const fresh = retryQuiz?.questions;
      if (!Array.isArray(fresh)) continue;

      // Also goes through full pipeline (shuffle + validateCorrectAnswer)
      processAndAccumulate(fresh);

      if (accumulated.length >= count) break;
    }

    quiz.questions = accumulated;

    if (quiz.questions.length === 0) {
      throw new Error("Gagal menghasilkan soal valid setelah beberapa kali percobaan");
    }

    if (quiz.questions.length < count) {
      console.warn(`[quiz] Hanya ${quiz.questions.length} soal valid dari ${count} yang diminta. Melanjutkan dengan soal yang ada.`);
    }
  }

  return { quiz };
}

// ── Main Handler ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, mode = "pretest", kelas, expectedSubject, context, count, exclude } = body;

    if (mode === "context") {
      if (!images || !Array.isArray(images) || images.length === 0) {
        return NextResponse.json({ error: "Minimal 1 gambar diperlukan" }, { status: 400 });
      }
      for (const img of images) {
        if (typeof img !== "string" || (!img.startsWith("data:") && !img.startsWith("http"))) {
          return NextResponse.json({ error: "Format gambar tidak valid" }, { status: 400 });
        }
      }
      const result = await handleContext(images, kelas);
      const contextMeta = {
        subject: result.subject,
        title: result.title,
        key_concepts: result.key_concepts || [],
        formulas: result.formulas || [],
        definitions: result.definitions || [],
        example_problems: result.example_problems || [],
      };
      return NextResponse.json({ context: contextMeta });
    }

    // mode: "pretest" | "exam"
    let contextData = context;
    let diagramIndexLimit = 0;

    if (context) {
      // Using context from Pass 1 — no images needed
      diagramIndexLimit = 0;
    } else if (images && Array.isArray(images) && images.length > 0) {
      // Backward compat: images provided directly
      for (const img of images) {
        if (typeof img !== "string" || (!img.startsWith("data:") && !img.startsWith("http"))) {
          return NextResponse.json({ error: "Format gambar tidak valid" }, { status: 400 });
        }
      }
      // Build minimal context from images for backward compat
      contextData = {
        subject: null,
        title: null,
        key_concepts: [],
        formulas: [],
        definitions: [],
        example_problems: images.map((_: string, i: number) => `Gambar ${i + 1}`),
      };
      diagramIndexLimit = images.length;
    } else {
      return NextResponse.json({ error: "context atau images diperlukan" }, { status: 400 });
    }

    const result = await handleQuiz(contextData, mode, kelas, expectedSubject, diagramIndexLimit, count, exclude);

    if (result.subjectMismatch) {
      return NextResponse.json(result);
    }

    return NextResponse.json({ quiz: result.quiz });
  } catch (error) {
    console.error("[quiz]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
