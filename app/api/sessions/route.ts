import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    const userId = searchParams.get("userId");
    const uid = userId || deviceId;
    if (!uid) {
      return NextResponse.json({ error: "userId atau deviceId diperlukan" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("started_at", { ascending: false });

    if (error) {
      throw new Error(`Gagal mengambil sesi: ${error.message}`);
    }

    const sessions = (data || []).map((s: any) => {
      let parsed = null;
      if (s.summary) {
        try {
          parsed = typeof s.summary === "string" ? JSON.parse(s.summary) : s.summary;
        } catch {
          console.warn(`[sessions] Failed to parse summary for session ${s.id}`);
          parsed = null;
        }
      }
      return { ...s, summary: parsed };
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil sesi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrls, summary, userId, deviceId } = await request.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 gambar diperlukan" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Extract title and subject from summary JSON
    let title = "";
    let subject = "";
    if (summary) {
      try {
        const parsed = typeof summary === "string" ? JSON.parse(summary) : summary;
        title = parsed?.title || "";
        subject = parsed?.subject || parsed?.context_meta?.subject || "";
      } catch {
        // ignore parse errors
      }
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: deviceId || userId || crypto.randomUUID(),
        image_urls: imageUrls,
        summary: summary || "",
        title: title || null,
        subject: subject || null,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Gagal membuat sesi: ${error.message}`);
    }

    return NextResponse.json({ sessionId: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat sesi" },
      { status: 500 }
    );
  }
}
