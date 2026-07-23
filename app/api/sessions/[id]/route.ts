import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const WHATSAPP_SERVICE_URL = "http://127.0.0.1:3001/send";

async function notifyParentCompletion(
  sessionId: string,
  supabase: ReturnType<typeof createServiceClient>,
  summary: Record<string, unknown>,
  exam: Record<string, unknown>
) {
  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, title, subject")
    .eq("id", sessionId)
    .single();

  if (!session?.user_id) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, parent_whatsapp")
    .eq("id", session.user_id)
    .single();

  if (!profile?.parent_whatsapp) return;

  const name = profile.name || "Ananda";
  const firstName = name.split(" ")[0] || name;
  const title = session.title || "";
  const subject = session.subject || "";
  const score = Number(exam.score ?? 0);
  const assessment = (summary as any).assessment as
    | { understanding: string; what_good?: string[]; to_improve?: string[] }
    | undefined;

  let catatan: string;
  if (assessment?.what_good?.length || assessment?.to_improve?.length) {
    const lines: string[] = [];
    if (assessment.what_good?.length) {
      lines.push("✅ Sudah Mengerti:");
      lines.push(...assessment.what_good.map((p) => `  • ${p}`));
    }
    if (assessment.to_improve?.length) {
      if (lines.length) lines.push("");
      lines.push("📈 Perlu Ditingkatkan:");
      lines.push(...assessment.to_improve.map((p) => `  • ${p}`));
    }
    catatan = lines.join("\n");
  } else {
    catatan = `${firstName} menunjukkan pemahaman yang sangat baik pada sesi ini.`;
  }

  const message = [
    "📋 Laporan Belajar Harian",
    "",
    "Halo Orang Tua Tercinta, berikut adalah perkembangan belajar Ananda hari ini:",
    "",
    `👤 Nama: ${name}`,
    `📚 Topik: ${subject ? `${subject} - ` : ""}${title}`,
    `💯 Skor: ${score} / 100${score >= 70 ? " ✅ LULUS" : " ❌ TIDAK LULUS"}`,
    "",
    `Catatan: ${catatan}`,
    "",
    "Terus dukung konsistensi dan semangat belajarnya ya, Ayah & Bunda! ❤️",
  ].join("\n");

  const res = await fetch(WHATSAPP_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: profile.parent_whatsapp, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WA send failed: ${err.error || res.status}`);
  }
  console.log(`[WhatsApp] completion msg sent to ${profile.parent_whatsapp}`);
}

async function getParams(params: Promise<{ id: string }>) {
  return await params;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await getParams(params);

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ensure summary is returned as a string for consistent client-side parsing
    if (data.summary && typeof data.summary !== "string") {
      try {
        data.summary = JSON.stringify(data.summary);
      } catch {
        data.summary = "";
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil sesi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await getParams(params);
    const supabase = createServiceClient();
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) throw new Error(`Gagal menghapus sesi: ${error.message}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menghapus sesi" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await getParams(params);
    const { summary, imageUrls } = await request.json();

    if (!summary) {
      return NextResponse.json(
        { error: "Summary diperlukan" },
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

    const updateFields: Record<string, unknown> = {
      summary,
      title: title || null,
      subject: subject || null,
    };
    if (imageUrls && Array.isArray(imageUrls)) {
      updateFields.image_urls = imageUrls;
    }

    const { error } = await supabase
      .from("sessions")
      .update(updateFields)
      .eq("id", id);

    if (error) {
      throw new Error(`Gagal memperbarui sesi: ${error.message}`);
    }

    // Trigger WhatsApp notification if exam just completed
    try {
      const parsedSummary = typeof summary === "string" ? JSON.parse(summary) : summary;
      const exam = parsedSummary?.exam;
      if (exam?.completed_at) {
        // Check if already notified to prevent duplicates
        const { data: existing } = await supabase
          .from("sessions")
          .select("parent_notified_at")
          .eq("id", id)
          .single();

        if (!existing?.parent_notified_at) {
          await notifyParentCompletion(id, supabase, parsedSummary, exam);
          await supabase
            .from("sessions")
            .update({ parent_notified_at: new Date().toISOString() })
            .eq("id", id);
        }
      }
    } catch {
      // ignore parse errors on notification
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memperbarui sesi" },
      { status: 500 }
    );
  }
}
