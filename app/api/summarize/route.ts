import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 gambar diperlukan" },
        { status: 400 }
      );
    }

    // Validate images are data URLs (not blob: URLs)
    for (const img of images) {
      if (typeof img !== "string" || (!img.startsWith("data:") && !img.startsWith("http"))) {
        return NextResponse.json(
          { error: "Format gambar tidak valid. Gunakan data URL." },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key belum diatur" },
        { status: 500 }
      );
    }

    const content: { type: string; text?: string; image_url?: { url: string } }[] = [
      {
        type: "text",
        text: "Lihat gambar halaman buku pelajaran ini. Berikan analisis mendalam untuk anak SD/SMP.",
      },
    ];

    for (const img of images) {
      content.push({
        type: "image_url",
        image_url: { url: img },
      });
    }

    console.log(`[summarize] Sending ${content.length} items (1 text + ${content.length - 1} images) to OpenRouter`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://askaraa.com",
        "X-Title": "Aksaraa",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        temperature: 0,
        max_tokens: 2048,
        messages: [
          {
            role: "system",
            content: `Kamu adalah Aksaraa, guru AI untuk anak SD/SMP Indonesia.

TUGASMU:
1. Apakah gambar ini materi pelajaran VALID? Jika tidak, tolak dengan lucu.
2. Jika valid, buat ringkasan dalam JSON saja.

KELUARKAN HANYA JSON INI, TANPA MARKDOWN, TANPA BACKTICK:
{
  "is_valid_subject": true/false,
  "rejection_reason": "string",
  "title": "string",
  "sections": [
    {
      "text": "string (3-5 kalimat mendalam dengan contoh dan analogi untuk anak)",
      "image_keywords": ["string", "string"],
      "visual": {
        "style": "math_diagram|science_scene|nature_illustration|language_art|social_map|religion_symbol|generic_fun",
        "primary_color": "#HEX",
        "secondary_color": "#HEX",
        "icon": "material_icon_name",
        "scene": "string (deskripsi visual 2-3 kalimat)",
        "decoration": "dots|grid|waves|circles|stars",
        "keywords": ["string", "string", "string"]
      }
    }
  ]
}`,
          },
          { role: "user", content },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[summarize] OpenRouter HTTP ${response.status}: ${errorBody.slice(0, 500)}`);
      throw new Error(`OpenRouter error (${response.status}): ${errorBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";

    if (!raw) {
      throw new Error("OpenRouter mengembalikan respons kosong");
    }

    let lesson: any;
    try {
      lesson = JSON.parse(raw);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        lesson = JSON.parse(jsonMatch[1]);
      } else {
        console.error(`[summarize] Failed to parse JSON. Raw: ${raw.slice(0, 500)}`);
        throw new Error("Respons LLM bukan JSON valid");
      }
    }

    if (typeof lesson.is_valid_subject !== "boolean") {
      throw new Error("Response missing is_valid_subject");
    }

    if (Array.isArray(lesson.sections)) {
      lesson.sections = lesson.sections.slice(0, 5);
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Terjadi kesalahan saat merangkum",
      },
      { status: 500 }
    );
  }
}
