import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

function safeJsonParse(str: string) {
  try { return JSON.parse(str); } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId diperlukan" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, class, parent_whatsapp")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: sessions } = await supabase
      .from("sessions")
      .select("summary")
      .eq("user_id", userId)
      .gte("started_at", monthStart)
      .lte("started_at", monthEnd);

    let monthlyCompleted = 0;
    if (sessions) {
      for (const s of sessions) {
        const summary = typeof s.summary === "string" ? safeJsonParse(s.summary) : s.summary;
        if (summary?.exam?.score >= 70 && summary?.exam?.completed_at) {
          monthlyCompleted++;
        }
      }
    }

    return NextResponse.json({ ...data, monthlyCompleted });
  } catch (error) {
    console.error("[profile GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil profil" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, pin, kelas, parentWhatsapp } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId diperlukan" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const updates: Record<string, unknown> = {};

    if (pin !== undefined) {
      if (!/^\d{6}$/.test(pin)) {
        return NextResponse.json({ error: "PIN harus 6 digit angka" }, { status: 400 });
      }
      updates.pin = await bcrypt.hash(pin, 10);
    }

    if (kelas !== undefined) {
      const kelasNum = Number(kelas);
      if (isNaN(kelasNum) || kelasNum < 1 || kelasNum > 12) {
        return NextResponse.json({ error: "Kelas harus 1-12" }, { status: 400 });
      }
      updates.class = kelasNum;
    }

    if (parentWhatsapp !== undefined) {
      const cleaned = parentWhatsapp.replace(/\D/g, "");
      if (cleaned.length < 10 || cleaned.length > 15) {
        return NextResponse.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
      }
      const normalized = cleaned.startsWith("0") ? `62${cleaned.slice(1)}` : cleaned.startsWith("62") ? cleaned : `62${cleaned}`;
      updates.parent_whatsapp = normalized;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      throw new Error(`Gagal memperbarui profil: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[profile POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
