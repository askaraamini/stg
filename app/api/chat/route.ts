import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parseJSON } from "@/lib/parse-json";

const PROMPT_PATH = path.join(process.cwd(), "app/api/chat/prompt.txt");
const REFLECTION_PROMPT_PATH = path.join(process.cwd(), "app/api/chat/reflection-prompt.txt");
const REFLECTION_ASSESS_PROMPT_PATH = path.join(process.cwd(), "app/api/chat/reflection-assessment-prompt.txt");

async function loadPrompt(contextMeta: Record<string, unknown>, mode?: string): Promise<string> {
  try {
    let promptPath = PROMPT_PATH;
    if (mode === "reflection") promptPath = REFLECTION_PROMPT_PATH;
    if (mode === "reflection-assessment") promptPath = REFLECTION_ASSESS_PROMPT_PATH;
    let template = await fs.readFile(promptPath, "utf-8");
    const subject = (contextMeta?.subject as string) || "Mata Pelajaran";
    const title = (contextMeta?.title as string) || "Materi Belajar";
    const kelas = (contextMeta?.kelas as string) || "Sekolah";
    const keyConcepts = Array.isArray(contextMeta?.key_concepts)
      ? (contextMeta.key_concepts as string[]).join(", ")
      : "-";

    template = template.replace(/{subject}/g, subject);
    template = template.replace(/{title}/g, title);
    template = template.replace(/{kelas}/g, String(kelas));
    template = template.replace(/{keyConcepts}/g, keyConcepts);

    return template;
  } catch {
    return "Kamu adalah asisten belajar yang ramah. Bantu siswa belajar dengan sabar.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key belum diatur" }, { status: 500 });
    }

    const body = await req.json();
    const { messages, contextMeta, mode } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    const systemPrompt = await loadPrompt(contextMeta || {}, mode);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
          model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite",
          temperature: 0.3,
          max_tokens: 1024,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[chat] OpenRouter HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
        return NextResponse.json({ error: "Gagal menghubungi AI" }, { status: 502 });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "";
      if (!reply) {
        return NextResponse.json({ error: "AI mengembalikan respons kosong" }, { status: 502 });
      }

      if (mode === "reflection-assessment") {
        try {
          const parsed = parseJSON(reply);
          return NextResponse.json(parsed);
        } catch {
          return NextResponse.json({
            understanding: "needs_improvement",
            what_good: ["Kamu sudah mencoba mengingat"],
            to_improve: ["Coba ulangi kembali materi yang sudah dipelajari"],
          });
        }
      }

      return NextResponse.json({ reply });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    console.error("[chat] Error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
